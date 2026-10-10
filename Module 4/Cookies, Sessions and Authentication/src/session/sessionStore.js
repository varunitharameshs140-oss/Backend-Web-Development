
const sessions = new Map();

function createSession(sessionId, userId, expiresAt) {
  sessions.set(sessionId, {
    userId,
    expiresAt: new Date(expiresAt)
  });
}

function getSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

function destroySession(sessionId) {
  if (sessionId) {
    sessions.delete(sessionId);
  }
}

module.exports = {
  createSession,
  getSession,
  destroySession
};
