import { PinoLogger } from "@mastra/loggers";
import pino from "pino";
import pinoPretty from "pino-pretty";

// Build pino directly so we can set `messageKey: "message"` — GCP Cloud
// Logging keys the displayed log text off `jsonPayload.message`, but pino's
// default key is `msg`. `@mastra/loggers`' PinoLogger doesn't expose
// messageKey, so we go through its undocumented `_logger` field.
const pinoInstance = pino(
  {
    name: "Mastra",
    level: "info",
    messageKey: "message",
    formatters: {
      level: (label) => ({ severity: label.toUpperCase() }),
    },
  },
  process.env.NODE_ENV !== "production"
    ? pinoPretty({
        colorize: true,
        levelFirst: true,
        ignore: "pid,hostname,component",
        colorizeObjects: true,
        translateTime: "SYS:standard",
        singleLine: false,
        messageKey: "message",
      })
    : undefined
);

export const mastraLogger = new PinoLogger({
  _logger: pinoInstance,
} as never);
