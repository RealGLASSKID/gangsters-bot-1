import { initDatabase } from "./database";
import { startBot } from "./bot";
import { startApi } from "./api";
import { logger } from "./utils/logger";
import { config } from "./config";

async function main() {
  console.log(`\n${config.botName}\n`);

  if (config.ownerJid.includes("YOUR_NUMBER") || config.groupJid.includes("YOUR_GROUP")) {
    logger.warn("Edit src/config.ts (ownerJid + groupJid) before production use");
  }

  initDatabase();
  startApi();
  await startBot();
}

main().catch((err) => {
  logger.error(err, "fatal");
  process.exit(1);
});
