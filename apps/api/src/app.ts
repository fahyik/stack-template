// #region module:mastra
import { MastraServer } from "@mastra/express";
// #endregion module:mastra
import pkgBodyParser from "body-parser";
import cors from "cors";
import express from "express";

import { apiRouter } from "./controllers/api/index.js";
import { publicRouter } from "./controllers/public/index.js";
import { systemRouter } from "./controllers/system/router.js";
import { webhooksRouter } from "./controllers/webhooks/index.js";
import { sql } from "./db/index.js";
import { logger } from "./logger.js";
import { errorHandler } from "./middleware/error-handler.js";
// #region module:mastra
import { internalServiceAuth } from "./middleware/internal-service-auth.js";
// #endregion module:mastra
import { systemAuth } from "./middleware/system-auth.js";
import { addBeforeExitHandler } from "./server/process-lifecycle.js";
// #region module:mastra
import { mastra, shutdownMastra } from "./services/mastra/index.js";

// #endregion module:mastra

import { correlationIdMiddleware, getHttpLogger } from "@repo/logger";

const { json, urlencoded } = pkgBodyParser;

// Paths excluded from HTTP access logging (chatty internal surfaces).
const httpLoggerSkipPaths: string[] = [
  // #region module:mastra
  "/mastra",
  // #endregion module:mastra
];

export async function createServer() {
  logger.debug(`🟠🟠🟠 creating server ..`);

  const app = express();

  app
    .disable("x-powered-by")
    .use(correlationIdMiddleware)
    .use(
      getHttpLogger(process.env.npm_package_name ?? "local", {
        skipPaths: httpLoggerSkipPaths,
      })
    );

  app.get("/", async (_req, res) => {
    return res.json({
      app: process.env.npm_package_name ?? "api",
      version: process.env.npm_package_version,
      env: process.env.APP_ENV,
    });
  });

  app.get("/ready", async (_req, res) => {
    res.status(200).json({
      ready: true,
      version: process.env.npm_package_version ?? "local",
    });
    return;
  });

  // Origins allowed to call the unauthenticated /public tier from a browser.
  // TODO: add your production marketing/app origins here before deploying.
  const originsOnPublic: (string | RegExp)[] = [];

  if (process.env.NODE_ENV !== "production") {
    originsOnPublic.push(
      "http://localhost:3000", // landing
      "http://localhost:3002", // webapp
      "http://localhost:3003" // backoffice
    );
  }

  app.use("/public", cors({ origin: originsOnPublic }), json(), publicRouter());

  // Webhook routes: unauthenticated (JWT-wise). Body parsing is per-route
  // since signature-verified webhooks need raw bytes while others may want
  // parsed JSON.
  app.use("/webhooks", webhooksRouter());

  // #region module:mastra
  app.use(
    "/mastra",
    cors({
      origin: ["http://localhost:3011"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-api-key",
        "x-mastra-client-type",
        "x-mastra-dev-playground",
      ],
      credentials: true,
    }),
    internalServiceAuth,
    json()
  );

  // Mastra routes mounted under /mastra prefix
  const mastraServer = new MastraServer({
    app,
    mastra,
    prefix: "/mastra",
    ...(process.env.NODE_ENV !== "production"
      ? { openapiPath: "/openapi.json" }
      : {}),
  });
  await mastraServer.init();
  // #endregion module:mastra

  app
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors());

  app.use("/system", json(), systemAuth, systemRouter());

  app.use(
    "/",
    json({
      verify: (req, res, buf) => {
        // TODO: figure out how to augment types
        // https://stackoverflow.com/questions/58049052/typescript-express-property-rawbody-does-not-exist-on-type-incomingmessage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).rawBody = buf;
      },
    }),
    apiRouter() // auth defined inside router
  );

  app.use(errorHandler);

  app.use((_req, res, _next) => {
    res.status(404).json({ success: false, reason: "not_found" });
  });

  // #region module:mastra
  addBeforeExitHandler(async () => {
    await shutdownMastra();
    logger.info("Mastra shut down");
  });
  // #endregion module:mastra

  addBeforeExitHandler(async () => {
    await sql.end();
    logger.info("Db connection terminated");
  });

  return app;
}
