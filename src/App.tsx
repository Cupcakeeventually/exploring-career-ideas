import React, { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { QuestionnaireScreen } from './components/QuestionnaireScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { OffensiveContentScreen } from './components/OffensiveContentScreen';
import { PrivacyNotice } from './components/PrivacyNotice';
import { CareerQuestions, Career, ErrorState } from './types';
import { generateCareerSuggestions } from './services/careerService';
import { checkAllInputsForOffensiveContent } from './utils/contentFilter';
import { validateRequestSize } from './utils/contentFilter';

type Screen = 'welcome' | 'questionnaire' | 'results' | 'error' | 'offensive-content' | 'privacy';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [careerResults, setCareerResults] = useState<Career[]>([]);
  const [error, setError] = useState<ErrorState | null>(null);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  // Helper function to scroll to top when changing screens
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };
  const handleStart = () => {
    setCurrentScreen('questionnaire');
    setError(null);
    scrollToTop();
  };

  const handleShowPrivacy = () => {
    setShowPrivacyNotice(true);
  };

  const handleClosePrivacy = () => {
    setShowPrivacyNotice(false);
  };

  const handleBack = () => {
    setCurrentScreen('welcome');
    setError(null);
    scrollToTop();
  };

  const handleComplete = async (answers: CareerQuestions) => {
    // Check for offensive content first
    if (checkAllInputsForOffensiveContent(answers)) {
      setCurrentScreen('offensive-content');
      scrollToTop();
      return;
    }

    // Validate request size
    if (!validateRequestSize(answers)) {
      setError({
        title: 'Request Too Large',
        message: 'Your responses are too long. Please shorten your answers and try again.',
        suggestion: 'Try to be more concise in your responses while still providing the key information.'
      });
      setCurrentScreen('error');
      scrollToTop();
      return;
    }

    try {
      const llmResponse = await generateCareerSuggestions(answers);
      
      // Convert LLM response to Career format
      const results: Career[] = llmResponse.careers.map((career, index) => ({
        id: `llm-career-${index}`,
        title: career.title,
        description: career.description,
        subjects: career.subjects,
        strengths: career.strengths,
        priorities: career.priorities,
        keywords: [], // LLM doesn't need keywords
        score: career.score,
        url: career.url
      }));
      
      setCareerResults(results);
      setCurrentScreen('results');
      scrollToTop();
    } catch (error) {
      console.error('LLM service failed:', error);
      
      // Handle rate limiting specifically
      if (error instanceof Error && error.message.includes('429')) {
        setError({
          title: 'Too Many Requests',
          message: 'You have made too many requests in a short time. This helps us prevent abuse and ensure the service remains available for everyone.',
          suggestion: 'Please wait 15 minutes before trying again. If you need immediate assistance, consider using other career guidance resources.'
        });
      } else {
        setError({
          title: 'Career Analysis Failed',
          message: 'We encountered an issue while analyzing your responses. This could be due to a temporary service outage or connectivity issue.',
          suggestion: 'Please try again in a few moments. If the problem persists, check your internet connection.'
        });
      }
      setCurrentScreen('error');
      scrollToTop();
    }
  };

  const handleRestart = () => {
    setCurrentScreen('welcome');
    setCareerResults([]);
    setError(null);
    scrollToTop();
  };

  const handleBackToQuestions = () => {
    setCurrentScreen('questionnaire');
    scrollToTop();
  };

  const handleRetry = () => {
    setCurrentScreen('questionnaire');
    setError(null);
    scrollToTop();
  };

  return (
    <div className="min-h-screen">
      {showPrivacyNotice && (
        <PrivacyNotice onClose={handleClosePrivacy} />
      )}
      {currentScreen === 'welcome' && (
        <WelcomeScreen onStart={handleStart} onShowPrivacy={handleShowPrivacy} />
      )}
      {currentScreen === 'questionnaire' && (
        <QuestionnaireScreen onBack={handleBack} onComplete={handleComplete} />
      )}
      {currentScreen === 'results' && (
        <ResultsScreen 
          onBack={handleBackToQuestions} 
          onRestart={handleRestart} 
          careers={careerResults} 
        />
      )}
      {currentScreen === 'error' && error && (
        <ErrorScreen 
          error={error}
          onRetry={handleRetry}
          onRestart={handleRestart}
        />
      )}
      {currentScreen === 'offensive-content' && (
        <OffensiveContentScreen 
          onBack={handleBackToQuestions}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

interface ErrorScreenProps {
  error: ErrorState;
  onRetry: () => void;
  onRestart: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onRetry, onRestart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 rounded-full p-4">
              <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error.title}
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message}
          </p>
          <p className="text-gray-500 text-sm mb-8">
            {error.suggestion}
          </p>
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onRestart}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;