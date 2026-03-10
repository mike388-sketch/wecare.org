import { randomUUID } from "crypto";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import { Strategy as AppleStrategy } from "passport-apple";
import { env } from "./env.js";
import { User } from "../models/User.js";

async function upsertOAuthUser({ email, fullName }) {
  if (!email) {
    throw new Error("OAuth provider did not return an email.");
  }

  const normalizedEmail = email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const passwordHash = await User.hashPassword(`${randomUUID()}_${Date.now()}`);
    user = await User.create({
      fullName: fullName || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      phoneNumber: "",
      passwordHash,
      role: "health_provider"
    });
  }

  return user;
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || false);
  } catch (error) {
    done(error, false);
  }
});

if (env.googleClientId && env.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: `${env.backendUrl}/api/auth/oauth/google/callback`
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const user = await upsertOAuthUser({ email, fullName: profile.displayName });
          done(null, user);
        } catch (error) {
          done(error, false);
        }
      }
    )
  );
}

if (env.githubClientId && env.githubClientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.githubClientId,
        clientSecret: env.githubClientSecret,
        callbackURL: `${env.backendUrl}/api/auth/oauth/github/callback`,
        scope: ["user:email"]
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const primaryEmail =
            profile.emails?.find((item) => item.primary)?.value ||
            profile.emails?.[0]?.value ||
            (profile.username ? `${profile.username}@users.noreply.github.com` : "");

          const user = await upsertOAuthUser({
            email: primaryEmail,
            fullName: profile.displayName || profile.username
          });

          done(null, user);
        } catch (error) {
          done(error, false);
        }
      }
    )
  );
}

if (env.microsoftClientId && env.microsoftClientSecret) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: env.microsoftClientId,
        clientSecret: env.microsoftClientSecret,
        callbackURL: `${env.backendUrl}/api/auth/oauth/microsoft/callback`,
        scope: ["user.read"]
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email =
            profile.emails?.[0] ||
            profile._json?.mail ||
            profile._json?.userPrincipalName ||
            "";

          const user = await upsertOAuthUser({
            email,
            fullName: profile.displayName || profile.name?.givenName
          });

          done(null, user);
        } catch (error) {
          done(error, false);
        }
      }
    )
  );
}

if (env.appleClientId && env.appleTeamId && env.appleKeyId && env.applePrivateKey) {
  passport.use(
    new AppleStrategy(
      {
        clientID: env.appleClientId,
        teamID: env.appleTeamId,
        keyID: env.appleKeyId,
        privateKeyString: env.applePrivateKey.replace(/\\n/g, "\n"),
        callbackURL: `${env.backendUrl}/api/auth/oauth/apple/callback`
      },
      async (_accessToken, _refreshToken, idToken, profile, done) => {
        try {
          const claims = idToken ? JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString()) : {};
          const email = profile?.email || claims?.email || "";
          const fullName = profile?.name || claims?.email?.split("@")[0] || "Apple User";

          const user = await upsertOAuthUser({ email, fullName });
          done(null, user);
        } catch (error) {
          done(error, false);
        }
      }
    )
  );
}

export default passport;
