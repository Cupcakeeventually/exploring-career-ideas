import React, { useState, useEffect } from 'react';
import { RefreshCw, Shield } from 'lucide-react';

interface CaptchaVerificationProps {
  onVerify: (isVerified: boolean) => void;
  isVisible: boolean;
}

export const CaptchaVerification: React.FC<CaptchaVerificationProps> = ({ onVerify, isVisible }) => {
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const generateCaptcha = () => {
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1, num2, answer, question;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 20) + 10;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      case '×':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
      default:
        num1 = 5;
        num2 = 3;
        answer = 8;
        question = '5 + 3';
    }
    
    setCaptchaQuestion(question);
    setCaptchaAnswer(answer);
    setUserAnswer('');
  };

  useEffect(() => {
    if (isVisible) {
      generateCaptcha();
      setAttempts(0);
      setIsVerified(false);
    }
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userNum = parseInt(userAnswer);
    if (userNum === captchaAnswer) {
      setIsVerified(true);
      onVerify(true);
    } else {
      setAttempts(prev => prev + 1);
      if (attempts >= 2) {
        // After 3 failed attempts, generate new captcha
        generateCaptcha();
        setAttempts(0);
      }
      setUserAnswer('');
    }
  };

  const handleRefresh = () => {
    generateCaptcha();
    setAttempts(0);
  };

  if (!isVisible) return null;

  if (isVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2 text-green-800">
          <Shield className="h-5 w-5" />
          <span className="font-medium">Verification Complete</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Security Verification</h3>
      </div>
      
      <p className="text-blue-800 text-sm mb-4">
        Please solve this simple math problem to verify you're human:
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="bg-white border border-blue-300 rounded-lg p-3 font-mono text-lg font-bold text-center min-w-[120px]">
            {captchaQuestion} = ?
          </div>
          
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
            title="Generate new question"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Your answer"
            className="w-32 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Verify
          </button>
        </div>
        
        {attempts > 0 && (
          <p className="text-red-600 text-sm">
            Incorrect answer. {attempts >= 2 ? 'New question generated.' : `${3 - attempts} attempts remaining.`}
          </p>
        )}
      </form>
      
      <p className="text-blue-700 text-xs mt-3">
        This helps us prevent automated abuse and ensures the service remains available for everyone.
      </p>
    </div>
  );
};