type SessionWriter = (event: string, data: string) => void;

const globalForSessions = global as typeof globalThis & {
  _mcpSessions?: Map<string, { writer: SessionWriter; userId: string; createdAt: number }>;
};

if (!globalForSessions._mcpSessions) {
  globalForSessions._mcpSessions = new Map();
}

export const mcpSessions = globalForSessions._mcpSessions;

export function registerSession(sessionId: string, userId: string, writer: SessionWriter) {
  mcpSessions.set(sessionId, { writer, userId, createdAt: Date.now() });

  // Clean up sessions older than 2 hours
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, s] of mcpSessions.entries()) {
    if (s.createdAt < cutoff) {
      mcpSessions.delete(id);
    }
  }
}

export function unregisterSession(sessionId: string) {
  mcpSessions.delete(sessionId);
}

export function sendToSession(sessionId: string, event: string, data: string): boolean {
  const session = mcpSessions.get(sessionId);
  if (session && session.writer) {
    try {
      session.writer(event, data);
      return true;
    } catch {
      mcpSessions.delete(sessionId);
    }
  }
  return false;
}

