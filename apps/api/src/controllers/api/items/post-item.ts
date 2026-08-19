import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../../../middleware/interfaces.js";
import { createItem } from "../../../services/items/create-item.js";
import { respondInvalidPayload } from "../../lib/respond-invalid-payload.js";

import { createItemBodySchema } from "@repo/api-types/api/items";

export async function postItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      res.json({ success: false, reason: "unauthenticated" });
      return;
    }

    const body = createItemBodySchema.safeParse(req.body);
    if (!body.success) {
      respondInvalidPayload({ res, issues: body.error.issues });
      return;
    }

    const result = await createItem({
      userId,
      name: body.data.name,
      notes: body.data.notes,
    });

    res.json({ success: true, data: { item: result.item } });
  } catch (error) {
    next(error);
  }
}
