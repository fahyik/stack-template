import type { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";

import { logger } from "../logger.js";

const oauthClient = new OAuth2Client();

const VALID_ISSUERS = new Set([
  "https://accounts.google.com",
  "accounts.google.com",
]);

// RFC 7235 / 6750: the auth-scheme ("Bearer") is case-insensitive and may be
// followed by one or more spaces. Returns the token, or undefined if the header
// isn't a well-formed bearer credential.
function extractBearerToken(header: string): string | undefined {
  const match = /^Bearer[ \t]+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token && token.length > 0 ? token : undefined;
}

export type GoogleOidcOutcome =
  | { outcome: "authorized" }
  | { outcome: "unauthorized" }
  | { outcome: "misconfigured" };

// Verifies a Google-signed OIDC token attached by Cloud Scheduler (or another
// GCP service-account caller). Returns an outcome rather than writing to the
// response, so it can be composed with other auth strategies (see
// system-auth.ts).
//
// There is intentionally NO dev bypass: the gate fails closed (`misconfigured`
// → 503) whenever CLOUD_SCHEDULER_OIDC_AUDIENCE is unset, regardless of
// NODE_ENV. To exercise /system/* locally, set that env var to any non-empty
// value and call with an admin JWT — systemAuth falls back to admin auth when
// the OIDC token is absent or invalid.
export async function verifyGoogleOidc(
  req: Request
): Promise<GoogleOidcOutcome> {
  const audience = process.env.CLOUD_SCHEDULER_OIDC_AUDIENCE;
  const requiredServiceAccount =
    process.env.CLOUD_SCHEDULER_OIDC_SERVICE_ACCOUNT;

  if (!audience) {
    return { outcome: "misconfigured" };
  }

  const idToken = extractBearerToken(req.header("authorization") ?? "");
  if (!idToken) {
    return { outcome: "unauthorized" };
  }

  try {
    const ticket = await oauthClient.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("missing_payload");
    }
    if (!payload.iss || !VALID_ISSUERS.has(payload.iss)) {
      throw new Error("bad_issuer");
    }
    if (requiredServiceAccount) {
      if (
        payload.email !== requiredServiceAccount ||
        payload.email_verified !== true
      ) {
        throw new Error("bad_service_account");
      }
    }
    return { outcome: "authorized" };
  } catch (err) {
    logger.warn("google-oidc-auth rejected request", { err });
    return { outcome: "unauthorized" };
  }
}

// Standalone middleware that enforces Google OIDC only (no fallback). For the
// /system routes, prefer systemAuth, which also lets admins in.
export async function googleOidcAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const result = await verifyGoogleOidc(req);
  if (result.outcome === "authorized") {
    next();
    return;
  }
  if (result.outcome === "misconfigured") {
    res.status(503).json({ success: false, reason: "invalid_configuration" });
    return;
  }
  res.status(401).json({ success: false, reason: "unauthorized" });
}
