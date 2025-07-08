import React, { useState } from 'react';
import { Shield, Eye, EyeOff, ExternalLink, X } from 'lucide-react';

interface PrivacyNoticeProps {
  onClose: () => void;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-3">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Privacy Notice</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              aria-label="Close privacy notice"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4 text-gray-700">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Your Privacy Matters</h3>
              <p className="text-blue-800 text-sm">
                We are committed to protecting your privacy. This notice explains how we handle your data when you use our career exploration tool.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">What Information We Collect</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your responses to career questionnaire questions</li>
                <li>School subjects, strengths, challenges, and career priorities you select or enter</li>
                <li>Any additional information you choose to provide</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">How We Use Your Information</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>To generate personalised career suggestions using artificial intelligence</li>
                <li>To match your responses with suitable career profiles from My World of Work</li>
                <li>To provide you with relevant career guidance and recommendations</li>
              </ul>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{isExpanded ? 'Show Less' : 'Show More Details'}</span>
            </button>

            {isExpanded && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Data Processing & AI</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your responses are processed by OpenAI's GPT-4 model to generate career suggestions</li>
                    <li>Data is sent securely through our protected server infrastructure</li>
                    <li>AI processing helps match your profile with the most suitable career options</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Data Storage & Security</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your responses are temporarily processed but not permanently stored by us</li>
                    <li>Data is transmitted using secure, encrypted connections</li>
                    <li>We do not create user accounts or maintain a database of your responses</li>
                    <li>Each session is independent - your data is not linked to previous or future sessions</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Third-Party Services</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Career profiles and links are provided by My World of Work (Skills Development Scotland)</li>
                    <li>AI processing is handled by OpenAI under their data usage policies</li>
                    <li>We recommend reviewing their privacy policies for additional information</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Your Rights</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>You can stop using the tool at any time</li>
                    <li>You control what information you choose to share</li>
                    <li>You can restart the questionnaire to provide different responses</li>
                    <li>No personal identification is required to use this service</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 mb-2">Important Disclaimer</h3>
                  <p className="text-amber-800 text-sm">
                    This tool provides career suggestions for guidance only. All recommendations should be considered alongside other career advice and personal research. We are not responsible for career decisions made based on these suggestions.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">External Links</h3>
                  <p className="text-sm">
                    Career profile links direct you to{' '}
                    <a
                      href="https://www.myworldofwork.co.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      <span>My World of Work</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    , which has its own privacy policy and terms of use.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Data Minimisation</h3>
              <p className="text-green-800 text-sm">
                We only collect the minimum information necessary to provide career suggestions. You remain anonymous throughout the process, and we do not track your identity or create user profiles.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};