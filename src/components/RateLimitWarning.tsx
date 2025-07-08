import React from 'react';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface RateLimitWarningProps {
  remainingRequests: number;
  resetTime: number;
  onClose: () => void;
}

export const RateLimitWarning: React.FC<RateLimitWarningProps> = ({ 
  remainingRequests, 
  resetTime, 
  onClose 
}) => {
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  React.useEffect(() => {
    const updateTimeLeft = () => {
      const now = Date.now();
      const diff = resetTime - now;
      
      if (diff <= 0) {
        setTimeLeft('Ready to try again');
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [resetTime]);

  const isBlocked = remainingRequests === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`rounded-full p-3 ${isBlocked ? 'bg-red-100' : 'bg-orange-100'}`}>
                {isBlocked ? (
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                ) : (
                  <Clock className="h-8 w-8 text-orange-600" />
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {isBlocked ? 'Request Limit Reached' : 'Rate Limit Warning'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {isBlocked ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium mb-2">
                  You've reached the maximum number of career analysis requests for this session.
                </p>
                <p className="text-red-700 text-sm">
                  This limit helps prevent abuse and ensures the service remains available for everyone.
                </p>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-800 font-medium mb-2">
                  You have {remainingRequests} request{remainingRequests !== 1 ? 's' : ''} remaining in this session.
                </p>
                <p className="text-orange-700 text-sm">
                  Please use them thoughtfully to get the best career guidance.
                </p>
              </div>
            )}

            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
              <RefreshCw className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-gray-800 font-medium">
                  {isBlocked ? 'Reset in:' : 'Limit resets in:'}
                </p>
                <p className="text-gray-600 text-sm">{timeLeft}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-900 font-medium mb-2">Why do we have limits?</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Prevents automated abuse and spam</li>
                <li>• Ensures fair access for all users</li>
                <li>• Protects against prompt injection attacks</li>
                <li>• Maintains service quality and availability</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};