import { CareerQuestions } from '../types';

interface LLMCareerResponse {
  careers: Array<{
    title: string;
    description: string;
    matchReason?: string;
    score: number;
    subjects: string[];
    strengths: string[];
    priorities: string[];
    url?: string;
  }>;
}

export const generateCareerSuggestions = async (answers: CareerQuestions): Promise<LLMCareerResponse> => {
  try {
    // Get the Supabase URL from environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    // Call our secure edge function instead of OpenAI directly
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-careers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        answers: answers
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Career generation failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Validate the response structure
    if (!data.careers || !Array.isArray(data.careers)) {
      throw new Error('Invalid response format from career service');
    }

    // Convert to the expected format
    const results: LLMCareerResponse = {
      careers: data.careers.map((career: any, index: number) => ({
        title: career.title,
        description: career.description || `View the full job profile on My World of Work for detailed information about this career.`,
        subjects: career.subjects || [],
        strengths: career.strengths || [],
        priorities: career.priorities || [],
        score: career.score || 0,
        url: career.url
      }))
    };
    
    return results;
  } catch (error) {
    console.error('Career service failed:', error);
    throw error;
  }
};