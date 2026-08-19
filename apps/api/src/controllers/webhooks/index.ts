import { type Request, Router } from "express";

/**
 * Webhook bodies must be verified against the exact bytes the provider signed,
 * so provider sub-routers mount `express.raw(...)` rather than relying on the
 * global json() parser. Parse only AFTER the signature checks out.
 */
export function extractRawBody(req: Request): string {
  return Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
}

/** Collapses Express's `string | string[]` header values to plain strings. */
export function flattenHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") {
      headers[key] = value;
    } else if (Array.isArray(value)) {
      headers[key] = value.join(",");
    }
  }
  return headers;
}

// Unauthenticated (JWT-wise) provider callbacks, mounted at /webhooks in
// app.ts. Deliberately ships with NO routes: every route here is reachable by
// anyone on the internet, so each one must verify a provider signature before
// it does anything. Add a provider like this:
//
//   const stripe = Router();
//   stripe.use(express.raw({ type: "application/json", limit: "1mb" }));
//   stripe.post("/", async (req, res, next) => {
//     try {
//       const rawBody = extractRawBody(req);
//       const headers = flattenHeaders(req);
//       if (!verifySignature({ rawBody, headers })) {
//         res.status(401).json({ success: false, reason: "bad_signature" });
//         return;
//       }
//       await handleStripeEvent({ event: JSON.parse(rawBody) });
//       res.status(200).json({ success: true });
//     } catch (error) {
//       next(error);
//     }
//   });
//   router.use("/stripe", stripe);
export function webhooksRouter() {
  const router = Router();

  return router;
}
