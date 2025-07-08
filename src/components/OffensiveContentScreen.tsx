import React from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface OffensiveContentScreenProps {
  onBack: () => void;
  onRestart: () => void;
}

export const OffensiveContentScreen: React.FC<OffensiveContentScreenProps> = ({ onBack, onRestart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 rounded-full p-4">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Content Not Appropriate
          </h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            We detected inappropriate language in your responses. This career exploration tool 
            is designed to provide helpful guidance for individuals exploring career options.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              Please review your answers and ensure they contain appropriate language 
              that will help us provide you with the best career suggestions.
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={onBack}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Go Back and Edit Responses</span>
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