import React from 'react';
import { ArrowLeft, Briefcase, ExternalLink } from 'lucide-react';
import { Career } from '../types';

interface ResultsScreenProps {
  onBack: () => void;
  onRestart: () => void;
  careers: Career[];
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ onBack, onRestart, careers }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-center -mb-2">
            <img 
              src="/Rocket coming out of book - Transparent background.png" 
              alt="Career Exploration Logo" 
              className="h-20 w-20 object-contain"
            />
          </div>
          
          <div className="flex items-center justify-between mb-6 -mt-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colours"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Questions</span>
            </button>
            <button
              onClick={onRestart}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colours"
            >
              Start Over
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Career Suggestions
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Based on your responses, here are 20 careers from My World of Work that align with your interests, 
              strengths, and priorities. Click on any career title to view the full profile on My World of Work.
            </p>
          </div>
        </div>

        {/* Results List */}
        <div className="grid gap-4">
          {careers.map((career, index) => (
            <div key={career.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <span className="text-blue-600 font-bold text-lg">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{career.title}</h3>
                      <p className="text-gray-600 mt-2">{career.description}</p>
                      {career.url && (
                        <div className="mt-3">
                          <a
                            href={career.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>View full profile on My World of Work</span>
                          </a>
                        </div>
                      )}
                      {!career.url && (
                        <div className="mt-3">
                          <span className="text-gray-500 text-sm italic">Profile not available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to Explore Further?</h3>
          <p className="text-gray-600 mb-6">
            These career suggestions are a starting point based on My World of Work profiles. Consider researching these options further and speaking to your careers adviser.
          </p>
          <button
            onClick={onRestart}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colours"
          >
            Explore Again
          </button>
        </div>
      </div>
    </div>
  );
};