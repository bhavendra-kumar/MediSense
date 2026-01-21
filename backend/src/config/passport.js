const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, BACKEND_URL } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL:
        GOOGLE_CALLBACK_URL ||
        `${(BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '')}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0]?.value;
        const firstName = profile.name?.givenName || 'Google';
        const lastName = profile.name?.familyName || 'User';

        if (!email) {
          return done(null, false, { message: 'No email from Google' });
        }

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            firstName,
            lastName,
            email,
            password: `${profile.id}-${Date.now()}`,
            preferredLanguage: 'en',
            role: 'patient',
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
