import React, { useEffect, useState } from 'react';
import { AlertTriangle, Shield, Activity } from 'lucide-react';
import { sessionRateLimiter } from '../utils/sessionManager';

interface SecurityEvent {
  timestamp: string;
  type: 'rate_limit' | 'validation_error' | 'suspicious_activity' | 'success';
  message: string;
}

interface SecurityMonitorProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SecurityMonitor: React.FC<SecurityMonitorProps> = ({ isVisible, onClose }) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    blockedRequests: 0,
    successfulRequests: 0,
    sessionStats: {
      totalSessions: 0,
      activeSessions: 0,
      blockedSessions: 0
    }
  });

  useEffect(() => {
    // In a real implementation, this would connect to your logging system
    // For demo purposes, we'll simulate some events
    if (isVisible) {
      const mockEvents: SecurityEvent[] = [
        {
          timestamp: new Date().toISOString(),
          type: 'success',
          message: 'Career suggestions generated successfully'
        },
        {
          timestamp: new Date(Date.now() - 300000).toISOString(),
          type: 'validation_error',
          message: 'Input validation failed - excessive length detected'
        },
        {
          timestamp: new Date(Date.now() - 600000).toISOString(),
          type: 'rate_limit',
          message: 'Rate limit exceeded for IP address'
        }
      ];
      
      setEvents(mockEvents);
      setStats({
        totalRequests: 156,
        blockedRequests: 12,
        successfulRequests: 144,
        sessionStats: sessionRateLimiter.getSessionStats()
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'success':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'rate_limit':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'validation_error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventColor = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'rate_limit':
        return 'bg-orange-50 border-orange-200';
      case 'validation_error':
      case 'suspicious_activity':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-3">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Security Monitor</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Security Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-900">Active Sessions</span>
              </div>
              <p className="text-2xl font-bold text-purple-800 mt-2">{stats.sessionStats.activeSessions}</p>
              <p className="text-sm text-purple-700">
                {stats.sessionStats.blockedSessions} blocked
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Total Requests</span>
              </div>
              <p className="text-2xl font-bold text-blue-800 mt-2">{stats.totalRequests}</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">Successful</span>
              </div>
              <p className="text-2xl font-bold text-green-800 mt-2">{stats.successfulRequests}</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-900">Blocked</span>
              </div>
              <p className="text-2xl font-bold text-red-800 mt-2">{stats.blockedRequests}</p>
            </div>
          </div>

          {/* Recent Events */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Events</h3>
            <div className="space-y-3">
              {events.map((event, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getEventColor(event.type)}`}
                >
                  <div className="flex items-center space-x-3">
                    {getEventIcon(event.type)}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.message}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Measures Info */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Active Security Measures</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✅ Rate limiting (5 requests per 15 minutes)</li>
              <li>✅ Session-based rate limiting (3 requests per session)</li>
              <li>✅ Input validation and sanitization</li>
              <li>✅ Content Security Policy headers</li>
              <li>✅ Request size limits (50KB max)</li>
              <li>✅ CAPTCHA verification</li>
              <li>✅ Offensive content filtering</li>
              <li>✅ Security event logging</li>
              <li>✅ XSS and injection protection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};