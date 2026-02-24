import "dotenv/config";
import { env } from "./config/env";
import { createApp } from "./app";
import { logger } from "./utils/logger";
import { startSyncProcessor } from "./services/sync";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);

  // Start the failed sync retry processor
  startSyncProcessor();
});
