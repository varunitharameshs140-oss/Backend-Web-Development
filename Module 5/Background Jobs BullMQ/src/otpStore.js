
'use strict';

const crypto = require('crypto');

const _store = new Map();

function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

function storeOTP(email, otp) {
  _store.set(email, {
    otp: otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0
  });
}

function verifyOTP(email, code) {
  const data = _store.get(email);

  if (!data) {
    return { ok: false, reason: 'not_found' };
  }

  if (Date.now() >= data.expiresAt) {
    _store.delete(email);
    return { ok: false, reason: 'expired' };
  }

  if (data.attempts >= 3) {
    return { ok: false, reason: 'too_many_attempts' };
  }

  if (data.otp !== String(code)) {
    data.attempts++;
    return { ok: false, reason: 'wrong_code' };
  }

  _store.delete(email);
  return { ok: true };
}

function markVerified(email) {
  console.log(`Email verified: ${email}`);
}

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  markVerified,
  _store
};
