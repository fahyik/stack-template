import { TransformableInfo } from "logform";
import winston from "winston";
import {
  Logger,
  LoggerOptions,
  createLogger as createWinstonLogger,
  format,
  transports,
} from "winston";

import { asyncLocalStorage } from "./async-local-storage.js";

export const log = (str: string) => {
  console.log("logger: " + str);
};

export const createLogger = (params?: {
  defaultMeta?: LoggerOptions["defaultMeta"];
}): Logger => {
  const developmentTransports = [
    new transports.File({
      level: "error",
      filename: "logs/errors.log",
    }),
    new transports.File({
      level: "debug",
      filename: "logs/debug.log",
    }),
  ];

  const ENV = process.env.NODE_ENV || "development";
  const localDump = process.env.LOCAL_LOG_DUMP === "true";
  const additionalTransports = localDump ? developmentTransports : [];

  const jsonParams = ENV === "development" ? { space: 2 } : {};

  return createWinstonLogger({
    defaultMeta: params?.defaultMeta,
    exitOnError: false,
    format: format.combine(
      injectCorrelationId(),
      errorFormatter(),
      format.timestamp(),
      format.json(jsonParams)
    ),
    level: "debug",
    transports: [
      new transports.Console({
        silent: process.env.NODE_ENV === "test",
      }),
      ...additionalTransports,
    ],
  });
};

const injectCorrelationId = winston.format((info) => {
  const store = asyncLocalStorage.getStore();
  if (store) {
    info.correlationId = store.get("correlationId");
  }
  return info;
});

const errorFormatter = winston.format((info: TransformableInfo) => {
  if (typeof info.message === "object") {
    info = {
      ...info,
      ...info.message,
      message: undefined,
    };
  }

  return {
    ...info,
    ...(info.error instanceof Error
      ? {
          error: { message: info.error.message, stack: info.error.stack },
          message: info.message || info.error.message,
        }
      : { message: info.message ?? "no message" }),
  };
});
