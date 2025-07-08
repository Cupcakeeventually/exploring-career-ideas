import React from 'react';
import { Compass, ArrowRight, Shield, Activity } from 'lucide-react';
import { SecurityMonitor } from './SecurityMonitor';

interface WelcomeScreenProps {
  onStart: () => void;
  onShowPrivacy: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onShowPrivacy }) => {
  const [showSecurityMonitor, setShowSecurityMonitor] = React.useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <SecurityMonitor 
        isVisible={showSecurityMonitor}
        onClose={() => setShowSecurityMonitor(false)}
      />
      
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex justify-center mb-8">
            <div className="bg-blue-100 rounded-full p-4">
              <Compass className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
           Explore Career Ideas
          </h1>
          
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            Discover your perfect career path with our smart matching tool.
            <br />
            Answer a few questions about your interests, strengths, and goals, and we'll 
            suggest the top 20 careers for you to explore.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-amber-800 text-sm font-medium">
              <strong>Please note:</strong> This tool uses artificial intelligence to calculate career matches. 
              All results should be considered as suggestions only and used with caution alongside other career guidance.
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">What to expect:</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center font-semibold text-blue-900 mt-0.5">1</div>
                <span className="flex-1">Quick 6-question assessment</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center font-semibold text-blue-900 mt-0.5">2</div>
                <span className="flex-1">AI career analysis</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center font-semibold text-blue-900 mt-0.5">3</div>
                <span className="flex-1">Top 20 career recommendations</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={onStart}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colours duration-200 flex items-center space-x-2 mx-auto group"
          >
            <span>Start Your Journey</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-center">
              <button
                onClick={onShowPrivacy}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                <Shield className="h-4 w-4" />
                <span>Privacy Notice</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};