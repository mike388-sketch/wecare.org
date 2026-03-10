import { Router } from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { login, me, oauthNotConfigured, oauthSuccess, register } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { validateLogin, validateRegister } from "../validators/authValidators.js";
import { env } from "../config/env.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false
});

router.use(authLimiter);

router.post("/register", validateBody(validateRegister), register);
router.post("/login", validateBody(validateLogin), login);
router.get("/me", authenticate, me);
router.get("/oauth/providers", (_req, res) => {
  res.status(200).json({
    google: Boolean(env.googleClientId && env.googleClientSecret),
    github: Boolean(env.githubClientId && env.githubClientSecret),
    microsoft: Boolean(env.microsoftClientId && env.microsoftClientSecret),
    apple: Boolean(env.appleClientId && env.appleTeamId && env.appleKeyId && env.applePrivateKey)
  });
});

if (env.googleClientId && env.googleClientSecret) {
  router.get("/oauth/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
  router.get(
    "/oauth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: `${env.frontendUrl}/login.html?error=oauth_failed` }),
    oauthSuccess
  );
} else {
  router.get("/oauth/google", oauthNotConfigured("Google"));
  router.get("/oauth/google/callback", oauthNotConfigured("Google"));
}

if (env.githubClientId && env.githubClientSecret) {
  router.get("/oauth/github", passport.authenticate("github", { scope: ["user:email"], session: false }));
  router.get(
    "/oauth/github/callback",
    passport.authenticate("github", { session: false, failureRedirect: `${env.frontendUrl}/login.html?error=oauth_failed` }),
    oauthSuccess
  );
} else {
  router.get("/oauth/github", oauthNotConfigured("GitHub"));
  router.get("/oauth/github/callback", oauthNotConfigured("GitHub"));
}

if (env.microsoftClientId && env.microsoftClientSecret) {
  router.get("/oauth/microsoft", passport.authenticate("microsoft", { session: false }));
  router.get(
    "/oauth/microsoft/callback",
    passport.authenticate("microsoft", { session: false, failureRedirect: `${env.frontendUrl}/login.html?error=oauth_failed` }),
    oauthSuccess
  );
} else {
  router.get("/oauth/microsoft", oauthNotConfigured("Microsoft"));
  router.get("/oauth/microsoft/callback", oauthNotConfigured("Microsoft"));
}

if (env.appleClientId && env.appleTeamId && env.appleKeyId && env.applePrivateKey) {
  router.get("/oauth/apple", passport.authenticate("apple", { scope: ["name", "email"], session: false }));
  router.post(
    "/oauth/apple/callback",
    passport.authenticate("apple", { session: false, failureRedirect: `${env.frontendUrl}/login.html?error=oauth_failed` }),
    oauthSuccess
  );
} else {
  router.get("/oauth/apple", oauthNotConfigured("Apple"));
  router.post("/oauth/apple/callback", oauthNotConfigured("Apple"));
}

export default router;
