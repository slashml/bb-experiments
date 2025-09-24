import { SessionProgress, CompleteDocumentation } from './schemas';

// Shared session store for the demo
// In production, use Redis, MongoDB, or another persistent store
class SessionStore {
  private sessionStore = new Map<string, SessionProgress>();
  private documentationStore = new Map<string, CompleteDocumentation>();

  // Session progress methods
  setSession(sessionId: string, progress: SessionProgress) {
    this.sessionStore.set(sessionId, progress);
  }

  getSession(sessionId: string): SessionProgress | undefined {
    return this.sessionStore.get(sessionId);
  }

  getAllSessions(): SessionProgress[] {
    return Array.from(this.sessionStore.values());
  }

  // Documentation methods
  setDocumentation(sessionId: string, documentation: CompleteDocumentation) {
    this.documentationStore.set(sessionId, documentation);
  }

  getDocumentation(sessionId: string): CompleteDocumentation | undefined {
    return this.documentationStore.get(sessionId);
  }

  // Cleanup methods
  deleteSession(sessionId: string) {
    this.sessionStore.delete(sessionId);
    this.documentationStore.delete(sessionId);
  }

  // Clean up old sessions (older than 1 hour)
  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    for (const [sessionId, session] of this.sessionStore) {
      const sessionTime = new Date(session.startTime).getTime();
      if (sessionTime < oneHourAgo) {
        this.deleteSession(sessionId);
        console.log(`[SessionStore] Cleaned up old session: ${sessionId}`);
      }
    }
  }
}

// Export singleton instance
export const sessionStore = new SessionStore();

// Run cleanup every 30 minutes
if (typeof window === 'undefined') { // Only on server side
  setInterval(() => {
    sessionStore.cleanup();
  }, 30 * 60 * 1000);
}