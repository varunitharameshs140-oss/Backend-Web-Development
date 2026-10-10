
const express = require('express');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

const users = require('../db/userRepository');
const {
  createSession,
  getSession,
  destroySession
} = require('../session/sessionStore');

const {
  cookieOptions,
  SESSION_MAX_AGE
} = require('../session/cookieConfig');

const requireSession = require('../middleware/requireSession');

const router = express.Router();

const unauthorized = (res) =>
  res.status(401).json({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid email or password'
    }
  });

router.post('/login', async (req, res, next) => {
  try {
    const email =
      typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';

    const password =
      typeof req.body?.password === 'string'
        ? req.body.password
        : '';

    if (!email || !password || email.length > 254 ||
        password.length > 1024) {
      return unauthorized(res);
    }

    const user = await users.findByEmail(email);

    // Compare even when the account is unknown, to keep failures generic.
    const dummyHash =
      '$2a$10$C6UzMDM.H6dfI/f/IKcEe.5H8Xxq8Q3j8u6hQ4uQ2yJq5V5Y5Y5Y5';

    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash || dummyHash
    );

    if (!user || !passwordMatches) {
      return unauthorized(res);
    }

    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

    createSession(sessionId, user.id, expiresAt);

    res.cookie('sid', sessionId, cookieOptions);

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireSession, async (req, res, next) => {
  try {
    const user = await users.findSafeById(req.userId);

    if (!user) {
      destroySession(req.sessionId);
      res.clearCookie('sid', cookieOptions);
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  try {
    const sessionId = req.signedCookies?.sid;

    if (typeof sessionId === 'string') {
      destroySession(sessionId);
    }

    res.clearCookie('sid', cookieOptions);
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
