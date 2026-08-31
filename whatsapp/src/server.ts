import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { whatsappClient } from './whatsapp/client';

const server = app.listen(config.port, () => {
  logger.info(`gangster-bot-relay listening on port ${config.port}`, {
    env: config.nodeEnv,
  });
});

// Start WhatsApp client in the background
whatsappClient.initialize().catch((err) => {
  logger.error('WhatsApp initialization error (service continues running)', err);
});

// Graceful shutdown for Railway / container stops
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal} – shutting down gracefully…`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await whatsappClient.destroy();
    } catch (err) {
      logger.warn('Error during WhatsApp cleanup', err);
    }

    logger.info('Shutdown complete');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 15_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  // Give logs a moment then exit so the process manager can restart
  setTimeout(() => process.exit(1), 1000);
});
