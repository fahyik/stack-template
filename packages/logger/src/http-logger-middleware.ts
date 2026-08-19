import morgan from "morgan";

import { asyncLocalStorage } from "./async-local-storage.js";

const ENV = process.env.NODE_ENV || "development";

morgan.token("correlationId", function () {
  const store = asyncLocalStorage.getStore();
  if (store) {
    return store.get("correlationId");
  }
  return undefined;
});

function logBody(req: unknown, contentType: string): unknown {
  if (!contentType.toLowerCase().includes("application/json")) {
    return "";
  }

  const body = (req as { body?: unknown }).body;

  // express.raw() gives us a Buffer — decode and parse so logs show the JSON
  // object instead of { type: "Buffer", data: [...] }.
  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString("utf8"));
    } catch {
      return "";
    }
  }

  return body;
}

export function getHttpLogger(
  serviceName: string,
  options: { skipPaths?: string[] } = {}
) {
  const { skipPaths = [] } = options;

  return morgan(
    function (tokens, req, res) {
      const contentType = tokens.req(req, res, "content-type") ?? "";

      const log: Record<string, unknown> = {
        level: "info",
        service: serviceName,
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: tokens.status(req, res),
        message: `${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)} ${tokens["response-time"](req, res)} ms - ${tokens.res(req, res, "content-length")}`,
        remoteAddress: tokens["remote-addr"](req, res),
        userAgent: tokens["user-agent"](req, res),
        referrer: tokens.referrer(req, res),
        httpVersion: tokens["http-version"](req, res),
        timestamp: tokens.date(req, res, "iso"),
        correlationId: tokens.correlationId(req, res),
        body: ENV === "development" ? logBody(req, contentType) : undefined,
      };

      return JSON.stringify(log, null, ENV === "development" ? 2 : 0);
    },
    {
      skip: (req) => {
        const url =
          (req as { originalUrl?: string; url?: string }).originalUrl ??
          (req as { url?: string }).url ??
          "";
        return skipPaths.some((p) => url.includes(p));
      },
    }
  );
}
