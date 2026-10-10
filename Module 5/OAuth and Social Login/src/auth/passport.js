
'use strict';

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { users, nextId } = require('../data');

async function verifyCallback(accessToken, refreshToken, profile, done) {
  try {
    // 1. Check whether this Google account already exists
    const existingGoogleUser = users.find(
      (user) => user.googleId === profile.id
    );

    if (existingGoogleUser) {
      return done(null, existingGoogleUser);
    }

    // Read the permitted Google profile fields
    const email = profile.emails[0].value;
    const name = profile.displayName;

    // 2. Check whether a local account has this email
    const existingEmailUser = users.find(
      (user) => user.email === email
    );

    if (existingEmailUser) {
      // Link only when Google confirms the email is verified
      if (profile._json.email_verified === true) {
        existingEmailUser.googleId = profile.id;
        return done(null, existingEmailUser);
      }

      // Reject an unverified email to prevent account takeover
      return done(null, false);
    }

    // 3. Create a new user if no match exists
    const newUser = {
      id: nextId(),
      googleId: profile.id,
      email,
      name,
      role: 'member',
    };

    users.push(newUser);
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'test-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret',
      callbackURL: '/auth/google/callback',
    },
    verifyCallback,
  ),
);

module.exports = { passport, verifyCallback };
