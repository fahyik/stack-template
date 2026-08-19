import type { NextFunction, Request, Response } from "express";

/**
 * Shared-secret gate for service-to-service calls that are not user-facing
 * (internal dashboards, embedded runtimes, sidecar tooling). Compares
 * `x-api-key` against INTERNAL_SERVICE_AUTH_KEY, and is a no-op outside
 * production so local dev needs no key. Fails closed in production when the
 * key is unset.
 *
 * Prefer `systemAuth` for anything a cloud scheduler triggers — that verifies
 * a real OIDC token rather than a static secret.
 */
const HEADER = "x-api-key";

export function internalServiceAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.method === "OPTIONS" || process.env.NODE_ENV !== "production") {
    return next();
  }

  const expected = process.env.INTERNAL_SERVICE_AUTH_KEY;

  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      res.status(503).json({ reason: "invalid_configuration" });
      return;
    }
    return next();
  }

  const provided = (req.header(HEADER) ?? "").trim();

  if (provided !== expected) {
    res.status(401).json({ reason: "unauthorized" });
    return;
  }

  return next();
}
