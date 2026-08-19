import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "express-jwt";
import { JwksRateLimitError } from "jwks-rsa";

import { logger } from "../logger.js";

const isDev = process.env.APP_ENV !== "production";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof UnauthorizedError) {
    res.status(err.status);
    res.json({ reason: err.code });

    if (isDev) {
      logger.warn(`Auth error on ${req.method} ${req.originalUrl}`, err);
    }

    return;
  }

  if (err instanceof JwksRateLimitError) {
    res.status(401);
    res.json({ reason: "unable_to_verify_token" });
    return;
  }

  logger.error(
    `Error while processing ${req.method} ${req.url}: ${err.message}`,
    {
      error: err,
      request: {
        method: req.method,
        url: req.url,
        params: req.params,
        agent: req.headers["user-agent"],
      },
      scope: "expressErrorHandler",
    }
  );

  res.status(500);
  res.json({
    message: "Internal server error",
    ...(isDev ? { error: err.message, stack: err.stack } : {}),
  });
}
