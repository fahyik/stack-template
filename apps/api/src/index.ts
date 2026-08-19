import { createServer } from "./app.js";
import { logger } from "./logger.js";
import { handleProcessTerminationEvents } from "./server/process-lifecycle.js";

const port = process.env.PORT || "3001";

handleProcessTerminationEvents();

createServer()
  .then((server) => {
    server.listen(port, () => {
      logger.debug(`🟢🟢🟢 Server listening on port ${port}`);
    });
  })
  .catch((err: unknown) => {
    logger.error("🔴🔴🔴 Server error", err);
  });
