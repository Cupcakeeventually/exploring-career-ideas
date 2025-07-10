import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Security logging
const logSecurityEvent = (event: string, details: any, clientIP: string) => {
  const timestamp = new Date().toISOString()
  console.log(`[SECURITY] ${timestamp} - ${event}`, {
    clientIP,
    ...details
  })
}

// Rate limiting storage (in-memory for this example)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_REQUESTS = 60 // Max requests per window (suitable for classroom use)
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes in milliseconds

// Request size limits (in bytes)
const MAX_REQUEST_SIZE = 50 * 1024 // 50KB
const MAX_FIELD_LENGTH = 1000
const MAX_ARRAY_ITEMS = 50

// Input validation helpers
const validateInput = (value: any, maxLength: number = 1000): boolean => {
  if (typeof value !== 'string') return false
  if (value.length > maxLength) return false
  
  // Check for potential injection attempts
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    // Enhanced prompt injection patterns
    /ignore\s+(previous|all|the)\s+(instructions?|prompts?|rules?)/i,
    /forget\s+(everything|all|previous)\s+(instructions?|prompts?|rules?)/i,
    /system\s+prompt/i,
    /act\s+as\s+(a\s+)?(?!career|guidance|counselor|adviser)/i,
    /pretend\s+to\s+be\s+(?!a\s+career|guidance|counselor|adviser)/i,
    /you\s+are\s+now\s+(?!a\s+career|guidance|counselor|adviser)/i,
    /jailbreak/i,
    /dan\s+mode/i,
    /developer\s+mode/i,
    /bypass\s+(safety|security|filters?|restrictions?)/i,
    /override\s+(instructions?|prompts?|rules?|safety)/i,
    /reveal\s+(your|the)\s+(prompt|instructions?|system)/i,
    /show\s+me\s+(your|the)\s+(prompt|instructions?|system)/i,
    /roleplay\s+as\s+(?!career|guidance)/i,
    /simulate\s+(?!career|job|work)/i,
    /\\n\\n/,
    /\*\*\*\s*system\s*\*\*\*/i,
    /\[system\]/i,
    /assistant:/i,
    /human:/i,
    /user:/i,
    /###\s*instruction/i
  ]
  
  if (suspiciousPatterns.some(pattern => pattern.test(value))) {
    return false
  }
  
  return true
}

const validateArray = (value: any, maxItems: number = 50): boolean => {
  if (!Array.isArray(value)) return false
  if (value.length > maxItems) return false
  return value.every(item => typeof item === 'string' && item.length <= 100)
}

const getClientIP = (req: Request): string => {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown'
}

const checkRateLimit = (clientIP: string): boolean => {
  const now = Date.now()
  const clientData = rateLimitMap.get(clientIP)
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (clientData.count >= RATE_LIMIT_REQUESTS) {
    return false
  }
  
  clientData.count++
  return true
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  // Content Security Policy headers
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com; frame-ancestors 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check request size
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      const clientIP = getClientIP(req)
      logSecurityEvent('REQUEST_TOO_LARGE', { 
        contentLength: parseInt(contentLength),
        maxAllowed: MAX_REQUEST_SIZE 
      }, clientIP)
      
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { answers } = await req.json()

    // Rate limiting check
    const clientIP = getClientIP(req)
    if (!checkRateLimit(clientIP)) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { 
        requests: RATE_LIMIT_REQUESTS,
        windowMinutes: RATE_LIMIT_WINDOW / 60000 
      }, clientIP)
      
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please wait a few minutes before trying again.',
          retryAfter: 15 * 60 // 15 minutes
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '900' // 15 minutes in seconds
          } 
        }
      )
    }

    // Validate input
    if (!answers) {
      logSecurityEvent('MISSING_ANSWERS', {}, getClientIP(req))
      return new Response(
        JSON.stringify({ error: 'Missing answers in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Input validation
    const validationErrors: string[] = []
    
    if (!validateInput(answers.currentOptions, MAX_FIELD_LENGTH)) {
      validationErrors.push('Current options field is invalid or too long')
    }
    
    if (!validateInput(answers.subjects, MAX_FIELD_LENGTH)) {
      validationErrors.push('Subjects field is invalid or too long')
    }
    
    if (!validateInput(answers.strengths, MAX_FIELD_LENGTH)) {
      validationErrors.push('Strengths field is invalid or too long')
    }
    
    if (!validateInput(answers.weaknesses, MAX_FIELD_LENGTH)) {
      validationErrors.push('Weaknesses field is invalid or too long')
    }
    
    if (!validateInput(answers.priorities, MAX_FIELD_LENGTH)) {
      validationErrors.push('Priorities field is invalid or too long')
    }
    
    if (!validateInput(answers.additionalInfo, MAX_FIELD_LENGTH)) {
      validationErrors.push('Additional info field is invalid or too long')
    }
    
    if (validationErrors.length > 0) {
      logSecurityEvent('VALIDATION_FAILED', { 
        errors: validationErrors,
        fieldsCount: Object.keys(answers).length 
      }, getClientIP(req))
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: validationErrors
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found in environment')
      logSecurityEvent('MISSING_API_KEY', {}, getClientIP(req))
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Comprehensive list of available job titles
    const availableJobs = [
      "3D Printing specialist",
      "AR/VR programmer",
      "Accommodation warden",
      "Accountant - Management",
      "Accountant - Private practice",
      "Accountant - Public finance",
      "Accounting technician",
      "Accounts assistant",
      "Actor",
      "Actuary",
      "Acupuncturist",
      "Administrative officer (courts)",
      "Administrator",
      "Advertising account executive",
      "Advertising account planner",
      "Advertising copywriter",
      "Advocate",
      "Advocate's clerk",
      "Aerospace engineer",
      "Agricultural consultant",
      "Agricultural engineer",
      "Air cabin crew",
      "Air traffic controller",
      "Aircraft maintenance engineer",
      "Airline customer service agent",
      "Airport baggage handler",
      "Airport information assistant",
      "Ambulance care assistant",
      "Ambulance paramedic",
      "Ambulance technician",
      "Anatomical pathology technologist",
      "Animal care worker",
      "Animal technician",
      "Animator",
      "Antique dealer",
      "App developer",
      "Archaeologist",
      "Architect",
      "Architectural technician",
      "Architectural technologist",
      "Archivist",
      "Army officer",
      "Army soldier",
      "Aromatherapist",
      "Art director",
      "Art gallery curator",
      "Art therapist",
      "Artificial intelligence engineer",
      "Arts administrator",
      "Assistance dog trainer",
      "Astronomer",
      "Astrophysicist",
      "Audio programmer",
      "Audio-visual technician",
      "Audiologist",
      "Automotive engineer",
      "Baker",
      "Bank manager",
      "Banking customer service adviser",
      "Bar person",
      "Beauty consultant",
      "Beauty therapist",
      "Big data engineer",
      "Biochemist",
      "Bioinformatician",
      "Biologist",
      "Biomedical scientist",
      "Biotechnologist",
      "Blacksmith",
      "Blockchain developer",
      "Body piercer",
      "Bookkeeper",
      "Bookseller",
      "Border Force officer or assistant officer",
      "Botanist",
      "Brewery worker",
      "Bricklayer",
      "Broadcast engineer",
      "Builders' merchant",
      "Building services engineer",
      "Building standards officer (local authority)",
      "Building surveyor",
      "Building technician",
      "Bus or coach driver",
      "Business analyst",
      "Business continuity specialist",
      "Business development manager",
      "Butcher",
      "CAD technician",
      "CCTV operator",
      "CNC programmer",
      "Cabinet maker",
      "Cake decorator",
      "Call centre operator",
      "Car rental agent",
      "Car salesperson",
      "Car valet",
      "Care home practitioner",
      "Care service manager",
      "Care support worker",
      "Careers adviser",
      "Caretaker",
      "Carpet fitter or floor layer",
      "Cartographer",
      "Catering manager",
      "Cemetery worker",
      "Ceramics designer or maker",
      "Charity fundraiser",
      "Chef",
      "Chemical engineer",
      "Chemical engineering technician",
      "Chemical plant process operator",
      "Chemist",
      "Childminder",
      "Chiropractor",
      "Choreographer",
      "Civil enforcement officer",
      "Civil engineer",
      "Civil engineering technician",
      "Civil service administrative officer",
      "Civil service executive officer",
      "Claims adjuster",
      "Classroom assistant",
      "Cleaner",
      "Climate change specialist",
      "Climate scientist",
      "Clinical engineer",
      "Clinical perfusionist",
      "Clinical psychologist",
      "Cloud services engineer",
      "Coastguard",
      "Commercial energy assessor",
      "Commissioning editor",
      "Community arts worker",
      "Community development worker",
      "Community education coordinator",
      "Company secretary",
      "Compliance officer",
      "Computer service and repair technician",
      "Concept Artist",
      "Consents manager",
      "Conservation officer",
      "Conservator",
      "Construction manager",
      "Construction operative",
      "Construction plant mechanic",
      "Construction plant operator",
      "Content designer",
      "Control room engineer",
      "Copy editor",
      "Costume designer",
      "Counselling psychologist",
      "Counsellor",
      "Counter service assistant",
      "Countryside officer",
      "Countryside ranger",
      "Courier",
      "Court officer",
      "Credit manager",
      "Crematorium technician",
      "Criminal intelligence analyst",
      "Customer service adviser",
      "Customs officer",
      "Cyber security analyst",
      "Cyber security architect",
      "Cyber security consultant",
      "Cyber security manager",
      "Cycle mechanic",
      "DJ",
      "Dance movement psychotherapist",
      "Dance teacher",
      "Dancer",
      "Data analyst",
      "Data architect",
      "Data scientist",
      "Data visualisation specialist",
      "Database administrator",
      "Decontamination technician",
      "Delivery van driver",
      "Demolition operative",
      "Dental hygienist",
      "Dental nurse",
      "Dental technician",
      "Dental therapist",
      "Dentist",
      "Design engineer",
      "DevOps engineer",
      "DevSecOps developer",
      "Development chemist",
      "Dietitian",
      "Digital forensic analyst",
      "Digital strategist",
      "Diplomatic service officer",
      "Dispatcher",
      "Dispensing optician",
      "Distillery manager",
      "District nurse",
      "Diver - specialist",
      "Doctor - GP",
      "Dog groomer",
      "Dog handler",
      "Domestic energy assessor",
      "Dramatherapist",
      "Dressmaker",
      "Drilling engineer",
      "Driving examiner",
      "Driving instructor",
      "Dry liner",
      "Dynamic positioning operator",
      "EFL teacher",
      "Early years practitioner",
      "Early years teacher",
      "Ecologist",
      "Economic development officer",
      "Economist",
      "Ecosystem modeller",
      "Educational psychologist",
      "Electrical engineer",
      "Electrical engineering technician",
      "Electrician",
      "Electricity distribution worker",
      "Electronics engineer",
      "Electronics engineering technician",
      "Emergency medical dispatcher",
      "Energy and sustainability manager",
      "Energy engineer",
      "Engineering craft machinist",
      "Engineering maintenance technician",
      "Engineering operative",
      "Entertainer",
      "Environmental advisor",
      "Environmental consultant",
      "Environmental engineer",
      "Environmental health and safety manager",
      "Environmental health officer",
      "Environmental manager",
      "Environmental officer",
      "Environmental product manager",
      "Ergonomist",
      "Estate agent",
      "Ethical hacker",
      "Event coordinator",
      "Events manager",
      "Exhibition designer",
      "Facilities manager",
      "Farm manager",
      "Farm technician",
      "Farm worker",
      "Farrier",
      "Fashion designer",
      "Fashion model",
      "Fence installer",
      "Finance analyst",
      "Finance manager",
      "Financial adviser",
      "Fine artist",
      "Fire & security engineer",
      "Firefighter",
      "Fish farm worker",
      "Fishing vessel skipper",
      "Fitness instructor",
      "Flight director",
      "Flight dispatcher",
      "Florist",
      "Food packaging operative",
      "Food scientist or food technologist",
      "Footballer",
      "Forensic psychologist",
      "Forensic scientist",
      "Forest manager",
      "Forestry worker",
      "Forklift truck operator",
      "Freight forwarder",
      "French polisher",
      "Funeral director",
      "Furniture designer",
      "Further education lecturer",
      "Game designer",
      "Gamekeeper",
      "Games developer",
      "Games tester",
      "Gardener",
      "Garment technologist",
      "Gas service technician",
      "General practice surveyor",
      "Geneticist",
      "Geographical information systems (GIS) Officer",
      "Geoscientist",
      "Glassmaker",
      "Glazier",
      "Graphic designer",
      "Greenkeeper",
      "Ground controller",
      "HV cable engineer",
      "Hairdresser",
      "Head brewer",
      "Health and safety adviser",
      "Health promotion specialist",
      "Health psychologist",
      "Health records clerk",
      "Health service manager",
      "Health visitor",
      "Healthcare assistant",
      "Heating and ventilation engineer",
      "Higher education lecturer",
      "Home technology integrator",
      "Homeopath",
      "Horse groom",
      "Horse riding coach",
      "Horticultural worker",
      "Hospital doctor",
      "Hospital porter",
      "Hotel manager",
      "Hotel porter",
      "Hotel receptionist",
      "Housekeeping assistant",
      "Housing officer",
      "Human resources adviser",
      "Hypnotherapist",
      "IT project analyst",
      "IT support technician",
      "IT trainer",
      "Illustrator",
      "Image consultant",
      "Immigration officer",
      "Indexer",
      "Infrastructure engineer",
      "Insurance account manager",
      "Insurance broker",
      "Insurance claims handler",
      "Insurance risk surveyor",
      "Insurance underwriter",
      "Interior designer",
      "Internet-of-things architect",
      "Interpreter",
      "Investment analyst",
      "Investment banker",
      "Jewellery designer",
      "Jockey",
      "Joiner",
      "Journalist",
      "Judge or sheriff",
      "Kitchen manager",
      "Kitchen porter",
      "Laboratory technician",
      "Land manager",
      "Land surveyor",
      "Landscape architect",
      "Landscaper",
      "Large goods vehicle driver",
      "Lead game engineer",
      "Leakage operative",
      "Learning support assistant",
      "Learning technologist",
      "Legal secretary",
      "Leisure centre manager",
      "Level designer",
      "Librarian",
      "Library assistant",
      "Lifeguard",
      "Lighting technician",
      "Literacies tutor",
      "Literary agent",
      "Local government administrative assistant",
      "Local government officer",
      "Local government revenues officer",
      "Locksmith",
      "Machine learning engineer",
      "Make-up artist",
      "Management consultant",
      "Manufacturing operator",
      "Manufacturing systems engineer",
      "Marine biologist",
      "Marine engineer",
      "Market research data analyst",
      "Market research executive",
      "Market research interviewer",
      "Marketing manager",
      "Materials engineer",
      "Materials technician",
      "Mechanic",
      "Mechanical engineer",
      "Mechanical engineering technician",
      "Media researcher",
      "Medical illustrator",
      "Medical physicist",
      "Medical sales representative",
      "Medical secretary",
      "Member of Parliament (MP)",
      "Merchant navy deck officer",
      "Merchant navy engineering officer",
      "Merchant navy rating",
      "Meteorologist",
      "Microbiologist",
      "Midwife",
      "Model maker",
      "Motor vehicle body repairer",
      "Motor vehicle parts person",
      "Museum assistant",
      "Museum curator",
      "Music promotions manager",
      "Music therapist",
      "Musical instrument maker or repairer",
      "Musician",
      "Nail technician",
      "Nanny",
      "Naturopath",
      "Naval architect",
      "Network manager",
      "Neuroscientist",
      "Newspaper or magazine editor",
      "Nuclear engineer",
      "Nurse - Adult",
      "Nurse - Child",
      "Nurse - Learning Disability",
      "Nurse - Mental Health",
      "Nursery manager",
      "Occupational psychologist",
      "Occupational therapist",
      "Occupational therapy support worker",
      "Oceanographer",
      "Offshore drilling worker",
      "Offshore medic",
      "Offshore roustabout",
      "Offshore service technician",
      "Online seller",
      "Operating department practitioner",
      "Operational researcher",
      "Optometrist",
      "Orthoptist",
      "Osteopath",
      "Outdoor activities instructor",
      "Painter and decorator",
      "Paralegal",
      "Patent attorney",
      "Pathologist",
      "Payroll administrator",
      "Personal care assistant",
      "Personal trainer",
      "Pest control technician",
      "Pharmacist",
      "Pharmacologist",
      "Pharmacy technician",
      "Phlebotomist",
      "Photographer",
      "Photographic stylist",
      "Physicist",
      "Physiotherapist",
      "Physiotherapy assistant",
      "Picture framer",
      "Pilot - Airline",
      "Pilot - Helicopter",
      "Planning and development surveyor",
      "Plasterer",
      "Play therapist",
      "Playworker",
      "Plumber",
      "Podiatrist",
      "Police officer",
      "Postal delivery worker",
      "Practice nurse",
      "Prison governor",
      "Prison officer",
      "Private investigator",
      "Procurator fiscal",
      "Procurement Manager",
      "Product designer",
      "Production manager (manufacturing)",
      "Project analyst",
      "Project manager",
      "Prop maker",
      "Propulsion engineer",
      "Prosthetist-orthotist",
      "Psychotherapist",
      "Public relations officer",
      "Quality assurance officer",
      "Quality control technician",
      "Quality manager",
      "Quantitative analyst",
      "Quantity surveyor",
      "Quarry engineer",
      "RAF airman or airwoman",
      "RAF officer",
      "ROV pilot technician",
      "Radio broadcast assistant",
      "Radiographer",
      "Rail engineering technician",
      "Receptionist",
      "Recruitment consultant",
      "Recycling operative",
      "Reflexologist",
      "Refrigeration and air conditioning engineer",
      "Refuse collector",
      "Registrar of births, deaths, marriages and civil partnerships",
      "Remanufacturing engineer",
      "Renewable energy analyst",
      "Renewable energy consultant",
      "Renewable energy manager",
      "Reporter to the Children's Panel",
      "Resort representative",
      "Restaurant manager",
      "Retail buyer",
      "Retail jeweller",
      "Retail manager",
      "Road transport manager",
      "Road worker",
      "Roadie",
      "Roadside technician",
      "Robot programmer",
      "Robotics engineer",
      "Roofer",
      "Royal Marines commando",
      "Royal Marines officer",
      "Royal Navy officer",
      "Royal Navy rating",
      "Rural surveyor",
      "SCADA technician",
      "SEO specialist",
      "SSPCA inspector",
      "Sales assistant",
      "Sales manager",
      "Sales representative",
      "Sales supervisor",
      "Satellite systems technician",
      "Scaffolder",
      "Scenes of crime officer",
      "Scrum master",
      "Secretary",
      "Security officer",
      "Senior Authorised Person (SAP)",
      "Service designer",
      "Service desk analyst",
      "Service engineer",
      "Set designer",
      "Sewing machinist",
      "Sheriff officer",
      "Shipbuilder",
      "Shopfitter",
      "Signwriter",
      "Site supervisor",
      "Smart meter installer",
      "Social media influencer",
      "Social media manager",
      "Social worker",
      "Software developer",
      "Software engineer",
      "Software product manager",
      "Software tester",
      "Solar PV installer",
      "Solar design engineer",
      "Solar electrician",
      "Solicitor",
      "Solution architect",
      "Solution consultant",
      "Sound designer",
      "Spacecraft communicator",
      "Speech and language therapist",
      "Sport and exercise psychologist",
      "Sport and exercise scientist",
      "Sports coach",
      "Sports development officer",
      "Sports professional",
      "Sports therapist",
      "Stage manager",
      "Stagehand",
      "Statistician",
      "Stockbroker",
      "Stonemason",
      "Store detective",
      "Strategic planner",
      "Street cleaner",
      "Structural engineer",
      "Studio sound engineer",
      "Stunt performer",
      "Sub-editor",
      "Surgeon",
      "Surveyor",
      "Sustainability consultant",
      "Sustainability manager",
      "Sustainable transport planner",
      "Swimming teacher or coach",
      "Systems analyst",
      "Systems engineer",
      "TV or film assistant director",
      "TV or film camera operator",
      "TV or film director",
      "TV or film producer",
      "TV or film production assistant",
      "TV or film sound technician",
      "TV presenter",
      "TV production runner",
      "Tailor",
      "Tattooist",
      "Tax inspector",
      "Taxi driver",
      "Teacher - Primary School",
      "Teacher - Secondary School",
      "Teacher - Secondary School - Art and Design",
      "Teacher - Secondary School - Biology",
      "Teacher - Secondary School - Business Studies",
      "Teacher - Secondary School - Chemistry",
      "Teacher - Secondary School - Drama",
      "Teacher - Secondary School - English",
      "Teacher - Secondary School - Gaelic",
      "Teacher - Secondary School - Geography",
      "Teacher - Secondary School - History",
      "Teacher - Secondary School - Home Economics",
      "Teacher - Secondary School - Mathematics",
      "Teacher - Secondary School - Modern Languages",
      "Teacher - Secondary School - Modern Studies",
      "Teacher - Secondary School - Music",
      "Teacher - Secondary School - Physical Education",
      "Teacher - Secondary School - Physics",
      "Teacher - Secondary School - Religious Education",
      "Teacher - Secondary school - Computing",
      "Teacher - Secondary school - Design and technology",
      "Technical author",
      "Technical surveyor",
      "Telecoms engineer",
      "Textile designer",
      "Thermal insulation engineer",
      "Toolmaker",
      "Tour manager",
      "Tourist guide",
      "Tourist information centre assistant",
      "Town planner",
      "Track maintenance operative",
      "Trade union official",
      "Trading standards officer",
      "Train conductor",
      "Train driver",
      "Train station staff",
      "Training manager",
      "Training officer",
      "Translator",
      "Travel agent",
      "Tree surgeon",
      "Tyre or exhaust fitter",
      "UAV and aerial surveyor",
      "User experience (UX) designer",
      "VFX artist",
      "Vehicle spray painter",
      "Veterinary nurse",
      "Veterinary surgeon",
      "Video editor",
      "Virtual reality designer",
      "Visual merchandiser",
      "Wall and floor tiler",
      "Wardrobe assistant",
      "Warehouse operative",
      "Water and wastewater engineer",
      "Water treatment technician",
      "Web developer",
      "Web editor",
      "Welder",
      "Welfare rights officer",
      "Wind turbine technician",
      "Window cleaner",
      "Window fitter",
      "Wine merchant",
      "Writer",
      "Yoga teacher",
      "Zookeeper",
      "Zoologist"
    ];

    const prompt = `
You are a career guidance counsellor helping a high school student explore career options. Based on their responses below, you MUST suggest exactly 20 careers.

SPECIAL INSTRUCTIONS
If the student mentions interest in a specific career, include closely related roles that they may not have considered. Only do this if they align with the user's skills and interests, and make sure to include the user's original area of interest unless there's a strong reason not to. For example, if the user is interested in a career that exists in the NHS (Health), you might include other potential NHS Health careers.  

SPECIAL INSTRUCTIONS FOR MILITARY AND EMERGENCY SERVICES:
- If the student mentions interest in military, armed forces, army, navy, air force, RAF, marines, or similar terms, you should consider suggesting careers across different branches of the military and emergency services, not just one branch
- If the user expresses interest in a specific career area (e.g. police, paramedic, or fire service), include closely related roles they may not have considered — such as support, analytical, or coordination roles in the same sector.
Only include these adjacent roles if they align with the user's skills, interests, or values, and make sure to also include the user's original area of interest unless there's a strong reason not to.
- This ensures they see the full range of opportunities available in public service and uniformed careers

SPECIAL INSTRUCTIONS FOR TRADES AND SKILLED CRAFTS:
- If the student mentions interest in trades, skilled work, manual work, hands-on work, building, construction, or similar terms, you should consider suggesting careers across MULTIPLE trade areas, not just one trade
- Include options from various trade categories such as:
  * Construction trades: Electrician, Plumber, Joiner, Bricklayer, Plasterer, Roofer, Carpenter
  * Engineering trades: Welder, Machinist, Fitter, Mechanic
  * Specialist trades: Glazier, Tiler, Painter and decorator, Heating and ventilation engineer
  * Creative trades: Cabinet maker, Stonemason, Blacksmith
- This ensures they see the full range of skilled trade opportunities available

CRITICAL REQUIREMENTS:
1. You MUST suggest exactly 20 careers - no more, no less
2. You MUST only suggest careers from this exact list of job titles:
${availableJobs.join(', ')}

3. Use the EXACT job titles from the list above - do not modify or abbreviate them
4. Base your recommendations solely on the user's responses
5. If you cannot find 20 perfect matches, include careers that are reasonably suitable to reach exactly 20
6. NEVER return fewer than 20 careers - this is absolutely critical

Student's Responses:
- Current career considerations: ${answers.currentOptions || 'None specified'}
- School subjects they're good at: ${answers.subjects || 'Not specified'}
- Strengths: ${Array.isArray(answers.strengths) ? answers.strengths.join(', ') : answers.strengths || 'Not specified'}
- Things they find challenging: ${Array.isArray(answers.weaknesses) ? answers.weaknesses.join(', ') : answers.weaknesses || 'Not specified'}
- Career priorities: ${Array.isArray(answers.priorities) ? answers.priorities.join(', ') : answers.priorities || 'Not specified'}
- Additional information: ${answers.additionalInfo || 'None provided'}

For each career suggestion, provide only:
1. Job title (MUST match exactly from the list above)
2. Match score (0-100)

Return the response as a JSON object with a "careers" array containing exactly 20 career objects, ordered by match score (highest first). 

CRITICAL: Your response MUST contain exactly 20 careers. Count them before responding.

Example format:
{
  "careers": [
    {
      "title": "Software engineer",
      "score": 85
    }
  ]
}
`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional career guidance counsellor with expertise in matching students to suitable career paths. Always respond with valid JSON only. You must only suggest careers from the provided job titles list, using exact titles. CRITICAL: You must return exactly 20 careers in every response. Focus on providing accurate matches based on the student\'s strengths, subjects, and priorities.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', response.status, errorData)
      logSecurityEvent('OPENAI_API_ERROR', { 
        status: response.status,
        error: errorData 
      }, getClientIP(req))
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate career suggestions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    // Clean the content by removing markdown code block delimiters
    const cleanedContent = content
      .replace(/^```json\s*/, '')  // Remove opening ```json
      .replace(/\s*```$/, '')      // Remove closing ```
      .trim()
    
    // Parse the JSON response
    const careerSuggestions = JSON.parse(cleanedContent)
    
    // Validate the response structure
    if (!careerSuggestions.careers || !Array.isArray(careerSuggestions.careers)) {
      throw new Error('Invalid response format from OpenAI')
    }

    // Validate we have exactly 20 careers
    if (careerSuggestions.careers.length < 20) {
      throw new Error(`Expected at least 20 careers, but received ${careerSuggestions.careers.length}`)
    }
    
    // Ensure we have exactly 20 careers by truncating if necessary
    if (careerSuggestions.careers.length > 20) {
      careerSuggestions.careers = careerSuggestions.careers.slice(0, 20)
    }

    // Helper function to generate My World of Work URL from job title
    const generateJobProfileUrl = (jobTitle: string): string => {
      const urlSlug = jobTitle.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      
      return `https://www.myworldofwork.co.uk/search-job-profiles/job-profiles/${urlSlug}`
    }

    // Add URLs and descriptions to the career suggestions
    const careersWithUrls = careerSuggestions.careers.map((career: any) => {
      return {
        ...career,
        url: generateJobProfileUrl(career.title),
        description: `View the full job profile on My World of Work for detailed information about this career.`,
        subjects: [],
        strengths: [],
        weaknesses: Array.isArray(answers.weaknesses) ? answers.weaknesses : 
                   typeof answers.weaknesses === 'string' ? answers.weaknesses.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [],
        priorities: Array.isArray(answers.priorities) ? answers.priorities :
                   typeof answers.priorities === 'string' ? answers.priorities.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : []
      }
    })

    // Log successful request
    logSecurityEvent('SUCCESSFUL_REQUEST', { 
      careersGenerated: careersWithUrls.length 
    }, getClientIP(req))

    return new Response(
      JSON.stringify({ careers: careersWithUrls }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-careers function:', error)
    logSecurityEvent('INTERNAL_ERROR', { 
      error: error.message 
    }, getClientIP(req))
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})