export interface CareerQuestions {
  currentOptions: string;
  subjects: string;
  strengths: string;
  weaknesses: string;
  priorities: string;
  additionalInfo: string;
}

export interface Career {
  id: string;
  title: string;
  description: string;
  subjects: string[];
  strengths: string[];
  priorities: string[];
  keywords: string[];
  score?: number;
  url?: string;
}

export interface ErrorState {
  title: string;
  message: string;
  suggestion: string;
}