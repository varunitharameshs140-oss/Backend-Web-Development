
const { getSession } = require('../session/sessionStore');

module.exports = function requireSession(req, res, next) {
  try {
    const sessionId = req.signedCookies?.sid;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const session = getSession(sessionId);

    if (!session) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    req.userId = session.userId;
    req.sessionId = sessionId;

    next();
  } catch {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }
};
