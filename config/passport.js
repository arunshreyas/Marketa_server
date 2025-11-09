require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const https = require('https');
const DiscordStrategy = require('passport-discord').Strategy;

// Fetch primary verified email from GitHub if not present in profile
function fetchGithubPrimaryEmail(token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/user/emails',
      method: 'GET',
      headers: {
        'User-Agent': 'Marketa-Server',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const emails = JSON.parse(data);
          if (Array.isArray(emails)) {
            const primary = emails.find(e => e.primary && e.verified) || emails[0];
            resolve(primary ? primary.email : null);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://marketa-server.onrender.com/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email,
            password: accessToken,
            name: profile.displayName,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://marketa-server.onrender.com/auth/github/callback'
          : 'http://localhost:3500/auth/github/callback'),
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = (profile && profile.emails && profile.emails[0] && profile.emails[0].value) ||
                    (profile && profile._json && profile._json.email) ||
                    null;
        if (!email) {
          email = await fetchGithubPrimaryEmail(accessToken);
        }
        if (!email) {
          return done(new Error('GitHub email not available'), null);
        }
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email,
            password: accessToken,
            name: profile.displayName,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL:
        process.env.DISCORD_CALLBACK_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://marketa-server.onrender.com/auth/discord/callback'
          : 'http://localhost:3500/auth/discord/callback'),
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email,
            password: accessToken,
            name: profile.displayName,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
)



passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
