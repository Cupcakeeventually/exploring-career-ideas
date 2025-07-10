import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { CareerQuestions } from '../types';
import { strengthOptions, weaknessOptions, priorityOptions, subjectOptions } from '../data/careers';
import { validateInputLength, containsSuspiciousPatterns } from '../utils/contentFilter';
import { CaptchaVerification } from './CaptchaVerification';

interface QuestionnaireScreenProps {
  onBack: () => void;
  onComplete: (answers: CareerQuestions) => void;
}

export const QuestionnaireScreen: React.FC<QuestionnaireScreenProps> = ({ onBack, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [answers, setAnswers] = useState<CareerQuestions>({
    currentOptions: '',
    subjects: '',
    strengths: '',
    weaknesses: '',
    priorities: '',
    additionalInfo: ''
  });

  const questions = [
    {
      id: 'currentOptions',
      title: 'What career options are you currently considering?',
      subtitle: 'Leave blank if you\'re not sure yet',
      type: 'text' as const
    },
    {
      id: 'subjects',
      title: 'What school subjects are you good at?',
      subtitle: 'Type your subjects or click on the options below to add them',
      type: 'hybrid' as const,
      options: subjectOptions
    },
    {
      id: 'strengths',
      title: 'What are your key strengths?',
      subtitle: 'Type your strengths or click on the options below to add them',
      type: 'hybrid' as const,
      options: strengthOptions
    },
    {
      id: 'weaknesses',
      title: 'What do you find challenging?',
      subtitle: 'Type what you find challenging or click on the options below to add them',
      type: 'hybrid' as const,
      options: weaknessOptions
    },
    {
      id: 'priorities',
      title: 'What matters most to you in a future career?',
      subtitle: 'Type your priorities or click on the options below to add them',
      type: 'hybrid' as const,
      options: priorityOptions
    },
    {
      id: 'additionalInfo',
      title: 'Is there anything else I should know?',
      subtitle: 'The more detail you provide, the better your career suggestions will be',
      type: 'textarea' as const
    }
  ];

  const currentQ = questions[currentQuestion];

  const handleAnswerChange = (value: string | string[]) => {
    // Client-side validation for immediate feedback
    if (typeof value === 'string') {
      // Check length limits
      const maxLength = currentQ.id === 'additionalInfo' ? 1000 : 500;
      if (!validateInputLength(value, maxLength)) {
        return; // Don't update if too long
      }
      
      // Check for suspicious patterns
      if (containsSuspiciousPatterns(value)) {
        return; // Don't update if suspicious
      }
    }
    
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      // Scroll to top when moving to next question
      window.scrollTo(0, 0);
    } else {
      // Show CAPTCHA before final submission
      if (!isCaptchaVerified) {
        setShowCaptcha(true);
        window.scrollTo(0, 0);
        return;
      }
      
      setIsGenerating(true);
      try {
        await onComplete(answers);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleCaptchaVerify = (isVerified: boolean) => {
    if (isVerified) {
      setIsCaptchaVerified(true);
      setShowCaptcha(false);
      // Automatically proceed with form submission after CAPTCHA verification
      setIsGenerating(true);
      onComplete(answers).finally(() => {
        setIsGenerating(false);
      });
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      // Scroll to top when moving to previous question
      window.scrollTo(0, 0);
    } else {
      onBack();
    }
  };

  const toggleOption = (option: string) => {
    if (currentQ.type === 'hybrid' && (currentQ.id === 'strengths' || currentQ.id === 'subjects' || currentQ.id === 'weaknesses')) {
      // For text-based hybrid inputs
      const currentText = answers[currentQ.id as keyof CareerQuestions] as string;
      const itemsArray = currentText.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      if (itemsArray.includes(option)) {
        // Remove the option
        const newItemsArray = itemsArray.filter(item => item !== option);
        const newText = newItemsArray.join(', ');
        handleAnswerChange(newText);
      } else {
        // Add the option
        const newText = itemsArray.length > 0 ? `${currentText}, ${option}` : option;
        handleAnswerChange(newText);
      }
    } else if (currentQ.type === 'hybrid' && currentQ.id === 'priorities') {
      // For priorities - handle both string and array formats
      const currentValue = answers[currentQ.id as keyof CareerQuestions];
      let itemsArray: string[] = [];
      
      if (Array.isArray(currentValue)) {
        itemsArray = currentValue;
      } else {
        itemsArray = (currentValue as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      
      if (itemsArray.includes(option)) {
        // Remove the option
        const newItemsArray = itemsArray.filter(item => item !== option);
        const newText = newItemsArray.join(', ');
        handleAnswerChange(newText);
      } else {
        // Add the option
        const currentText = Array.isArray(currentValue) ? currentValue.join(', ') : (currentValue as string);
        const newText = itemsArray.length > 0 ? `${currentText}, ${option}` : option;
        handleAnswerChange(newText);
      }
    } else {
      // For regular multiselect
      const currentValue = answers[currentQ.id as keyof CareerQuestions] as string[];
      const newValue = currentValue.includes(option)
        ? currentValue.filter(item => item !== option)
        : [...currentValue, option];
      handleAnswerChange(newValue);
    }
  };

  const isAnswered = () => {
    const value = answers[currentQ.id as keyof CareerQuestions];
    if (currentQ.type === 'multiselect') {
      return (value as string[]).length > 0;
    }
    if (currentQ.type === 'hybrid' && currentQ.id === 'priorities') {
      // Handle both string and array formats
      if (Array.isArray(value)) {
        return value.length > 0;
      } else {
        return (value as string).length > 0;
      }
    }
    if (currentQ.type === 'hybrid') {
      return (value as string).length > 0;
    }
    return currentQ.id === 'currentOptions' || currentQ.id === 'additionalInfo' || (value as string).length > 0;
  };

  const canProceed = isAnswered() || currentQ.id === 'currentOptions' || currentQ.id === 'additionalInfo';

  // Show CAPTCHA screen
  if (showCaptcha) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Almost Done!
            </h2>
            
            <CaptchaVerification 
              onVerify={handleCaptchaVerify}
              isVisible={true}
            />
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowCaptcha(false)}
                className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colours"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Back to Questions</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 rounded-full p-4">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Analysing Your Responses
            </h2>
            <p className="text-gray-600 mb-6">
              Our AI is carefully reviewing your answers and generating personalised career suggestions just for you.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                This may take a few moments...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {currentQ.id === 'weaknesses' ? (
                <>
                  What do you find <span className="text-red-600 font-bold">challenging</span>?
                </>
              ) : (
                currentQ.title
              )}
            </h2>
            <p className="text-gray-600 text-lg mb-2">
              {currentQ.subtitle}
            </p>
            {currentQ.id === 'strengths' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Not sure what your strengths are?</strong> You can use the{' '}
                  <a
                    href="https://www.myworldofwork.co.uk/tools-and-quizzes/my-strengths"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    <span>My World of Work strengths tool</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {' '}to help identify them.
                </p>
              </div>
            )}
          </div>

          {/* Additional guidance for question 6 */}
          {currentQ.id === 'additionalInfo' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-900 font-semibold mb-3">Examples of helpful information:</h3>
              <ul className="text-blue-800 text-sm space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>What you're planning to study at college or university (if applicable)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Work experience you've done or plan to do</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Hobbies or activities you love doing in your free time</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Any specific career goals or aspirations you have</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Things you definitely don't want to do (e.g., 'I don't want to sit at a desk all day')</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Your ideal work environment or conditions</span>
                </li>
              </ul>
              <p className="text-blue-700 text-xs mt-3 italic">
                Remember: The more specific you are, the more personalised your career suggestions will be!
              </p>
            </div>
          )}

          {/* Helper text for hybrid questions */}
          {currentQ.type === 'hybrid' && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm flex items-start space-x-2">
                <span className="text-lg">💡</span>
                <span>
                  <strong>You can type your own answers or use the quick options below.</strong>
                  {currentQ.id === 'subjects' && (
                    <span className="block mt-1 text-green-700">
                      e.g., "I'm really good at Maths and enjoy Creative Writing"
                    </span>
                  )}
                  {currentQ.id === 'strengths' && (
                    <span className="block mt-1 text-green-700">
                      e.g., "I love problem-solving and working with data, plus I'm great at explaining things to others"
                    </span>
                  )}
                  {currentQ.id === 'weaknesses' && (
                    <span className="block mt-1 text-green-700">
                      e.g., "I sometimes struggle with time management and find public speaking nerve-wracking"
                    </span>
                  )}
                  {currentQ.id === 'priorities' && (
                    <span className="block mt-1 text-green-700">
                      e.g., "I want a job where I can help people and have good work-life balance"
                    </span>
                  )}
                </span>
              </p>
            </div>
          )}

          {/* Answer input */}
          <div className="mb-8">
            {currentQ.type === 'text' && (
              <input
                type="text"
                value={answers[currentQ.id as keyof CareerQuestions] as string}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Enter your answer..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            )}

            {currentQ.type === 'textarea' && (
              <textarea
                value={answers[currentQ.id as keyof CareerQuestions] as string}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder={currentQ.id === 'additionalInfo' 
                  ? "Share any additional information that might help us suggest the perfect careers for you..."
                  : "Share any additional thoughts..."
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
              />
            )}

            {currentQ.type === 'hybrid' && (
              <div className="space-y-4">
                {(currentQ.id === 'strengths' || currentQ.id === 'subjects' || currentQ.id === 'weaknesses') && (
                  <textarea
                    value={answers[currentQ.id as keyof CareerQuestions] as string}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder={
                      currentQ.id === 'strengths' 
                        ? "Type your strengths here, separated by commas..."
                        : currentQ.id === 'subjects'
                        ? "Type your subjects here, separated by commas..."
                        : "Type what you find challenging here, separated by commas..."
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
                  />
                )}
                {currentQ.id === 'priorities' && (
                  <textarea
                    value={Array.isArray(answers[currentQ.id as keyof CareerQuestions]) 
                      ? (answers[currentQ.id as keyof CareerQuestions] as string[]).join(', ')
                      : (answers[currentQ.id as keyof CareerQuestions] as string)}
                    onChange={(e) => {
                      // Store as string for text input, convert to array when needed
                      handleAnswerChange(e.target.value);
                    }}
                    placeholder="Type your priorities here, separated by commas..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
                  />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentQ.options?.map((option) => {
                    let isSelected = false;
                    
                    if (currentQ.id === 'priorities') {
                      // Handle both string and array formats
                      const currentValue = answers[currentQ.id as keyof CareerQuestions];
                      if (Array.isArray(currentValue)) {
                        isSelected = currentValue.includes(option);
                      } else {
                        const itemsArray = (currentValue as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
                        isSelected = itemsArray.includes(option);
                      }
                    } else {
                      const currentText = answers[currentQ.id as keyof CareerQuestions] as string || '';
                      const itemsArray = currentText.split(',').map(s => s.trim()).filter(s => s.length > 0);
                      isSelected = itemsArray.includes(option);
                    }
                    
                    return (
                      <button
                        key={option}
                        onClick={() => toggleOption(option)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-between text-left group ${
                          isSelected
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <span className="font-medium">{option}</span>
                        {isSelected && <CheckCircle className="h-5 w-5 text-green-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentQ.type === 'multiselect' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentQ.options?.map((option) => {
                  const isSelected = (answers[currentQ.id as keyof CareerQuestions] as string[]).includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => toggleOption(option)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between text-left group ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">{option}</span>
                      {isSelected && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colours"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-semibold transition-colours ${
                canProceed
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>{currentQuestion === questions.length - 1 ? 'Generate My Results' : 'Next'}</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};