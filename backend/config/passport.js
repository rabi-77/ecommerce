import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import userModel from "../models/userModel.js";
import { configDotenv } from "dotenv";
configDotenv()

 passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userModel.findOne({ googleId: profile.id });
        if (!user) {
          user = await userModel.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            // Don't change authProvider if they have a password
            if (!user.password) {
              user.authProvider = "google";
            }
            user.isVerified = true;
            await user.save();
          } else {
            user = new userModel({
              googleId: profile.id,
              email: profile.emails[0].value,
              username: profile.displayName.replace(/\s/g, "").toLowerCase(),
              authProvider: "google",
              isVerified: true,
            });
            await user.save();
          }
        }
        return done(null,user)
      } catch (err) {
        return done(err,null)
      }
    }
  )
);
