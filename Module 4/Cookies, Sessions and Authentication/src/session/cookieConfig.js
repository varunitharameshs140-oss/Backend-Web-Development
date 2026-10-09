
const SESSION_MAX_AGE = 30 * 60 * 1000; // 30 minutes

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure:
    process.env.NODE_ENV === 'production' ||
    process.env.COOKIE_SECURE === 'true',
  signed: true,
  path: '/',
  maxAge: SESSION_MAX_AGE
};

module.exports = {
  cookieOptions,
  SESSION_MAX_AGE
};
