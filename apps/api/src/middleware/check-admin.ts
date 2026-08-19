import type { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "./interfaces.js";

export function checkAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (req.auth?.sub === undefined || req.auth?.app_metadata.is_admin !== true) {
    res.status(403).json({ success: false, reason: "not_authorized" });
    return;
  }

  next();
}
