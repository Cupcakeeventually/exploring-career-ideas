// Session-based rate limiting utility
interface SessionData {
  sessionId: string;
  requestCount: number;
  firstRequestTime: number;
  lastRequestTime: number;
  isBlocked: boolean;
  blockUntil?: number;
}

class SessionRateLimiter {
  private sessions = new Map<string, SessionData>();
  private readonly maxRequests = 3; // Max requests per session
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  private readonly blockDurationMs = 30 * 60 * 1000; // 30 minutes block
  private readonly cleanupIntervalMs = 60 * 60 * 1000; // 1 hour cleanup

  constructor() {
    // Clean up old sessions periodically
    setInterval(() => this.cleanup(), this.cleanupIntervalMs);
  }

  private generateSessionId(): string {
    // Generate a unique session ID based on browser fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Session fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 0,
      navigator.deviceMemory || 0
    ].join('|');

    // Create a hash of the fingerprint
    return this.simpleHash(fingerprint);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs * 2; // Keep sessions for 2 windows

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastRequestTime < cutoff && (!session.blockUntil || session.blockUntil < now)) {
        this.sessions.delete(sessionId);
      }
    }
  }

  public getSessionId(): string {
    // Try to get existing session ID from sessionStorage
    let sessionId = sessionStorage.getItem('career_session_id');
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('career_session_id', sessionId);
    }
    
    return sessionId;
  }

  public checkRateLimit(): { allowed: boolean; remainingRequests: number; resetTime: number; reason?: string } {
    const sessionId = this.getSessionId();
    const now = Date.now();
    
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      // New session
      session = {
        sessionId,
        requestCount: 0,
        firstRequestTime: now,
        lastRequestTime: now,
        isBlocked: false
      };
      this.sessions.set(sessionId, session);
    }

    // Check if session is currently blocked
    if (session.isBlocked && session.blockUntil && now < session.blockUntil) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: session.blockUntil,
        reason: 'Session temporarily blocked due to excessive requests'
      };
    }

    // Reset block if block period has expired
    if (session.isBlocked && session.blockUntil && now >= session.blockUntil) {
      session.isBlocked = false;
      session.blockUntil = undefined;
      session.requestCount = 0;
      session.firstRequestTime = now;
    }

    // Check if we're in a new time window
    if (now - session.firstRequestTime > this.windowMs) {
      // Reset the window
      session.requestCount = 0;
      session.firstRequestTime = now;
      session.isBlocked = false;
    }

    // Check rate limit
    if (session.requestCount >= this.maxRequests) {
      // Block the session
      session.isBlocked = true;
      session.blockUntil = now + this.blockDurationMs;
      
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: session.blockUntil,
        reason: 'Too many requests from this session. Please wait before trying again.'
      };
    }

    // Update session data
    session.lastRequestTime = now;
    
    return {
      allowed: true,
      remainingRequests: this.maxRequests - session.requestCount,
      resetTime: session.firstRequestTime + this.windowMs
    };
  }

  public recordRequest(): void {
    const sessionId = this.getSessionId();
    const session = this.sessions.get(sessionId);
    
    if (session) {
      session.requestCount++;
      session.lastRequestTime = Date.now();
    }
  }

  public getSessionStats(): { totalSessions: number; activeSessions: number; blockedSessions: number } {
    const now = Date.now();
    let activeSessions = 0;
    let blockedSessions = 0;

    for (const session of this.sessions.values()) {
      if (now - session.lastRequestTime < this.windowMs) {
        activeSessions++;
      }
      if (session.isBlocked && session.blockUntil && now < session.blockUntil) {
        blockedSessions++;
      }
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      blockedSessions
    };
  }

  public resetSession(): void {
    const sessionId = this.getSessionId();
    this.sessions.delete(sessionId);
    sessionStorage.removeItem('career_session_id');
  }
}

// Export singleton instance
export const sessionRateLimiter = new SessionRateLimiter();