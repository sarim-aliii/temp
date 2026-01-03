import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import User from '../models/User'; 


export function configurePassport(passport: passport.PassportStatic) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: '/api/auth/google/callback', // Must match Google Console
      },
      async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
        try {
          // 1. Check if user already exists via Google ID
          const existingUser = await User.findOne({ googleId: profile.id });
          if (existingUser) {
            return done(null, existingUser); // All good, log them in
          }

          // 2. Check if email is already taken
          const email = profile.emails![0].value.toLowerCase();
          const userByEmail = await User.findOne({ email: email });
          
          if (userByEmail) {
            userByEmail.googleId = profile.id;
            await userByEmail.save();
            return done(null, userByEmail);
          }

          const newUser = new User({
            googleId: profile.id,
            email: email,
          });
          
          const savedUser = await newUser.save();
          return done(null, savedUser);

        } catch (err) {
          return done(err as Error, false);
        }
      }
    )
  );

  passport.serializeUser((user: any, done: (err: any, id?: string) => void) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}