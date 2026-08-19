import { v4 } from "uuid";

import { asyncLocalStorage } from "./async-local-storage.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function correlationIdMiddleware(req: any, _res: any, next: any) {
  const correlationId: string =
    (req.headers["x-correlation-id"] as string | undefined) || v4();

  asyncLocalStorage.run(new Map([["correlationId", correlationId]]), () => {
    next();
  });
}
