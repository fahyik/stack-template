import { createLogger } from "@repo/logger";

export const logger = createLogger({
  defaultMeta: { service: process.env.PACKAGE_NAME ?? "local" },
});
