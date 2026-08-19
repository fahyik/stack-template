import { logger } from "../logger.js";

type Event = NodeJS.Signals | "uncaughtException";

type ExitHandler = () => Promise<unknown>;

const beforeExitHandlers: ExitHandler[] = [];

export function addBeforeExitHandler(handler: ExitHandler): void {
  beforeExitHandlers.push(handler);
}

export function handleProcessTerminationEvents(): void {
  async function exitGracefully(
    eventName: Event,
    exitCode: number
  ): Promise<void> {
    for (const [index, handler] of beforeExitHandlers.entries()) {
      if (handler !== undefined) {
        try {
          await handler();
          logger.info(`exit handler ${index} success `, {
            index,
          });
        } catch (error) {
          logger.warn(`Error while running beforeExitHandler[${index}]`, {
            error,
            index,
          });
        }
      } else {
        logger.warn(
          `Exit handler undefined while running beforeExitHandler[${index}]`,
          {
            index,
          }
        );
      }
    }

    logger.on("finish", () => process.exit(exitCode));
    logger.info("Gracefully exiting node process..", {
      eventName,
      exitCode,
    });
    logger.end();
  }

  process.on("SIGTERM", async () => {
    await exitGracefully("SIGTERM", 0);
  });
  process.on("SIGINT", async () => {
    await exitGracefully("SIGINT", 0);
  });
  // https://nodejs.org/docs/latest-v18.x/api/process.html#event-unhandledrejection
  process.on(
    "unhandledRejection",
    (err: unknown, rejectedPromise: Promise<unknown>) => {
      logger.error(`unhandledRejection:`, { error: err, rejectedPromise });
    }
  );

  // https://nodejs.org/docs/latest-v18.x/api/process.html#process_event_uncaughtexception
  process.on(
    "uncaughtException",
    (err: unknown, origin: "unhandledRejection" | "uncaughtException") => {
      logger.error(`${origin}:`, { error: err });
      process.exit(1);
    }
  );
}
