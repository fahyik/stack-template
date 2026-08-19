import type { NextFunction, Request, Response } from "express";

import { auth } from "./auth.js";
import { checkAdmin } from "./check-admin.js";
import { verifyGoogleOidc } from "./google-oidc-auth.js";
import type { AuthenticatedRequest } from "./interfaces.js";

// express-jwt is callback-based: it calls next(err) on failure and next() on
// success (its own returned promise resolves either way), so we bridge the
// callback into an awaitable boolean rather than leaving a floating promise.
// Resolves true when the JWT is valid (req.auth is populated as a side effect).
function verifyAdminJwt(args: {
  req: Request;
  res: Response;
}): Promise<boolean> {
  return new Promise<boolean>((resolve) =>
    auth(args.req, args.res, (err?: unknown) => resolve(!err))
  );
}

// Auth for /system endpoints. These are normally driven by Cloud Scheduler via
// a Google-signed OIDC token, but we also let an authenticated admin hit them
// (e.g. to manually trigger a job). Strategy:
//   1. Try Google OIDC (the scheduler path).
//   2. If that isn't a valid scheduler token, fall back to the standard
//      Supabase JWT + admin check.
// A production misconfiguration (no OIDC audience) still fails closed with 503
// rather than silently leaning on the admin path.
export async function systemAuth(
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

  // Not a valid scheduler token — fall back to admin JWT auth, mapping a failed
  // verification to 401 rather than surfacing the raw UnauthorizedError, then
  // enforce the admin claim.
  const isAuthenticated = await verifyAdminJwt({ req, res });
  if (!isAuthenticated) {
    res.status(401).json({ success: false, reason: "unauthorized" });
    return;
  }

  checkAdmin(req as AuthenticatedRequest, res, next);
}
