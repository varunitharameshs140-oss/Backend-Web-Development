
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');

const normalizeEmail = (email) => email.trim().toLowerCase();

async function registerUser({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);

  const existingUser = await userRepository.findUserByEmail(normalizedEmail);

  if (existingUser) {
    const error = new Error('Email already exists');
    error.status = 409;
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  return userRepository.createUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
  });
}

async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await userRepository.findUserByEmail(normalizedEmail);

  // Use a generic error for both unknown email and incorrect password.
  if (!user) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

module.exports = {
  registerUser,
  loginUser,
};
