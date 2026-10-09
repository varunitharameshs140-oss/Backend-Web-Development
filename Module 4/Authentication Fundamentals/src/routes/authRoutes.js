
const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function sendError(res, error) {
  if (error.code === 'P2002' || error.code === 'EMAIL_ALREADY_EXISTS') {
    return res.status(409).json({
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email already exists',
      },
    });
  }

  if (error.code === 'INVALID_CREDENTIALS') {
    return res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  }

  if (error.status === 400) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'Required fields must be non-empty strings',
      },
    });
  }

  console.error('Authentication request failed');

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      !isNonEmptyString(name) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(password)
    ) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Required fields must be non-empty strings',
        },
      });
    }

    const user = await authService.registerUser({
      name,
      email,
      password,
    });

    return res.status(201).json(user);
  } catch (error) {
    return sendError(res, error);
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      !isNonEmptyString(email) ||
      !isNonEmptyString(password)
    ) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Required fields must be non-empty strings',
        },
      });
    }

    const user = await authService.loginUser({ email, password });

    return res.status(200).json(user);
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
