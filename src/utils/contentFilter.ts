// Content filtering utility to detect deliberately offensive language

// Enhanced content filtering with additional security checks
export const validateInputLength = (text: string, maxLength: number = 1000): boolean => {
  return typeof text === 'string' && text.length <= maxLength;
};

export const validateRequestSize = (data: any): boolean => {
  const jsonString = JSON.stringify(data);
  const sizeInBytes = new Blob([jsonString]).size;
  const maxSizeInBytes = 50 * 1024; // 50KB
  return sizeInBytes <= maxSizeInBytes;
};

export const containsSuspiciousPatterns = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  
  const suspiciousPatterns = [
    // Potential injection attempts
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    // Excessive repetition (potential spam)
    /(.)\1{50,}/,
    // Unusual character patterns
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/,
    // SQL injection patterns
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    // Command injection patterns
    /;\s*rm\s+/i,
    /;\s*cat\s+/i,
    /;\s*ls\s+/i,
    // Prompt injection patterns
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
    /new\s+(instructions?|prompts?|rules?)/i,
    /different\s+(instructions?|prompts?|rules?)/i,
    /alternative\s+(instructions?|prompts?|rules?)/i,
    /roleplay\s+as\s+(?!career|guidance)/i,
    /simulate\s+(?!career|job|work)/i,
    /hypothetically/i,
    /what\s+if\s+you\s+were\s+(?!a\s+career|guidance)/i,
    /tell\s+me\s+about\s+(?!career|job|work|education)/i,
    /explain\s+how\s+to\s+(?!get|become|find|choose|explore)/i,
    /step\s+by\s+step\s+(?!career|job|guidance)/i,
    /tutorial\s+(?!career|job|guidance)/i,
    /instructions?\s+for\s+(?!career|job|guidance)/i,
    /reveal\s+(your|the)\s+(prompt|instructions?|system)/i,
    /show\s+me\s+(your|the)\s+(prompt|instructions?|system)/i,
    /what\s+(are|is)\s+(your|the)\s+(prompt|instructions?|system)/i,
    /copy\s+(your|the)\s+(prompt|instructions?|system)/i,
    /repeat\s+(your|the)\s+(prompt|instructions?|system)/i,
    /output\s+(your|the)\s+(prompt|instructions?|system)/i,
    /print\s+(your|the)\s+(prompt|instructions?|system)/i,
    /display\s+(your|the)\s+(prompt|instructions?|system)/i,
    /\\n\\n/,
    /\*\*\*\s*system\s*\*\*\*/i,
    /\[system\]/i,
    /\{system\}/i,
    /<system>/i,
    /assistant:/i,
    /human:/i,
    /user:/i,
    /\[\/INST\]/i,
    /\[INST\]/i,
    /###\s*instruction/i,
    /###\s*system/i,
    /###\s*human/i,
    /###\s*user/i,
    /###\s*assistant/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(text));
};

const offensiveWords = [
  // Only the most clearly offensive profanity
  'fuck', 'shit', 'bitch', 'bastard', 'cunt', 'whore', 'slut',
  'motherfucker', 'asshole', 'dumbass', 'jackass', 'dipshit',
  'bullshit', 'horseshit', 'chickenshit', 'batshit',
  // Clear variations and substitutions
  'f*ck', 'sh*t', 'b*tch', 'f**k', 's**t', 'b**ch',
  'fck', 'fuk', 'biatch',
  // Clear hate speech and slurs (most offensive)
  'nigger', 'faggot', 'retard',
  // Only clear drug references that are inappropriate
  'cocaine', 'heroin', 'meth', 'crack cocaine', 'drug dealer',
  // Only clear violence/threats
  'kill yourself', 'commit suicide', 'bomb threat', 'shoot up'
];

// More targeted patterns for creative spellings
const offensivePatterns = [
  /f+u+c+k+i+n+g+/i,
  /s+h+i+t+t+y+/i,
  /b+i+t+c+h+e+s+/i,
  /a+s+s+h+o+l+e+s+/i
];

export const containsOffensiveLanguage = (text: string): boolean => {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const normalizedText = text.toLowerCase().trim();

  // Only check for exact word matches with word boundaries to avoid false positives
  for (const word of offensiveWords) {
    const wordPattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (wordPattern.test(normalizedText)) {
      return true;
    }
  }

  // Check against patterns
  for (const pattern of offensivePatterns) {
    if (pattern.test(normalizedText)) {
      return true;
    }
  }

  // Check for obvious attempts to bypass filters with excessive punctuation
  const cleanedText = normalizedText.replace(/[^a-z0-9\s]/g, '');
  const suspiciousPatterns = [
    /f+u+c+k+/i,
    /s+h+i+t+/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(cleanedText)) {
      // Additional check: make sure it's not part of a legitimate word
      const matches = cleanedText.match(pattern);
      if (matches) {
        const match = matches[0];
        // If the match is the entire word or clearly separated, flag it
        const beforeMatch = cleanedText.substring(0, cleanedText.indexOf(match));
        const afterMatch = cleanedText.substring(cleanedText.indexOf(match) + match.length);
        
        if (beforeMatch.endsWith(' ') || beforeMatch === '' || 
            afterMatch.startsWith(' ') || afterMatch === '') {
          return true;
        }
      }
    }
  }

  return false;
};

export const checkAllInputsForOffensiveContent = (answers: any): boolean => {
  const textInputs = [
    answers.currentOptions,
    answers.subjects,
    answers.strengths,
    answers.weaknesses,
    answers.additionalInfo
  ];

  // Check text inputs
  for (const input of textInputs) {
    if (typeof input === 'string' && containsOffensiveLanguage(input)) {
      return true;
    }
    
    // Check for prompt injection attempts
    if (typeof input === 'string') {
      const injectionCheck = detectPromptInjection(input);
      if (injectionCheck.isInjection) {
        console.warn(`Prompt injection detected: ${injectionCheck.reason}`);
        return true;
      }
    }
  }

  // Check array inputs (priorities)
  if (typeof answers.priorities === 'string' && containsOffensiveLanguage(answers.priorities)) {
    return true;
  }
  
  // Check priorities for prompt injection
  if (typeof answers.priorities === 'string') {
    const injectionCheck = detectPromptInjection(answers.priorities);
    if (injectionCheck.isInjection) {
      console.warn(`Prompt injection detected in priorities: ${injectionCheck.reason}`);
      return true;
    }
  }

  return false;
};