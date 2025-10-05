import { SessionProgress, CompleteDocumentation } from './schemas';
import { fileDocumentationStorage } from './file-storage';

// Shared session store for the demo
// In production, use Redis, MongoDB, or another persistent store
class SessionStore {
  private sessionStore = new Map<string, SessionProgress>();

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
  async setDocumentation(sessionId: string, documentation: CompleteDocumentation): Promise<void> {
    await fileDocumentationStorage.saveDocumentation(sessionId, documentation);
  }

  async getDocumentation(sessionId: string): Promise<CompleteDocumentation | null> {
    return await fileDocumentationStorage.getDocumentation(sessionId);
  }

  // Cleanup methods
  async deleteSession(sessionId: string): Promise<void> {
    this.sessionStore.delete(sessionId);
    await fileDocumentationStorage.deleteDocumentation(sessionId);
  }

  // Clean up old sessions (older than 1 hour)
  async cleanup(): Promise<void> {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    for (const [sessionId, session] of this.sessionStore) {
      const sessionTime = new Date(session.startTime).getTime();
      if (sessionTime < oneHourAgo) {
        await this.deleteSession(sessionId);
        console.log(`[SessionStore] Cleaned up old session: ${sessionId}`);
      }
    }

    // Also clean up old documentation files
    await fileDocumentationStorage.cleanup(1); // 1 hour
  }
}

// Export singleton instance
export const sessionStore = new SessionStore();

// Run cleanup every 30 minutes
if (typeof window === 'undefined') { // Only on server side
  setInterval(() => {
    sessionStore.cleanup().catch(console.error);
  }, 30 * 60 * 1000);
}