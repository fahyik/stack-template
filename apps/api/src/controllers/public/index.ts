import { Router } from "express";

// Unauthenticated tier, CORS-restricted to the marketing origins configured in
// app.ts. Use it for what a logged-out visitor must reach (lead capture,
// contact forms). Everything else belongs on the authed api router.
export function publicRouter() {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      res.json({ success: true, data: null });
      return;
    } catch (error) {
      next(error);
    }
  });

  return router;
}
