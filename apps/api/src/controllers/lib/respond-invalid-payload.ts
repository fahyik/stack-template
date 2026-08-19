import type { Response } from "express";
import type { z } from "zod";

// Dev-only debug extension: raw zod issues help engineers see which field
// failed, but they describe internal schema shape and must never ship to
// production clients.
const isDev = process.env.APP_ENV !== "production";

/**
 * The single 400 in the API contract. Every other business outcome is a 200
 * with `{ success: false, reason }`.
 */
export function respondInvalidPayload({
  res,
  issues,
}: {
  res: Response;
  issues: z.core.$ZodIssue[];
}) {
  res.status(400).json({
    success: false,
    reason: "invalid_payload",
    ...(isDev ? { issues } : {}),
  });
}
