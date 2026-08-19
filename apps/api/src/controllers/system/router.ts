import { Router } from "express";

// Service-to-service infra triggers (GCP Cloud Scheduler, etc.). Sits outside
// the user-JWT-protected api router and outside /webhooks. Mounted with
// systemAuth in app.ts (Google OIDC for the scheduler, admin JWT as fallback).
//
// Add scheduled jobs here, e.g.
//   router.post("/items/reap", postItemsReap);
export function systemRouter() {
  const router = Router();

  return router;
}
