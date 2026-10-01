import app from './app.js';
import env from './config/environment.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { startReminderJob, stopReminderJob } from './jobs/reminderJob.js';
import logger from './utils/logger.js';

let server;

async function bootstrap() {
  try {
    // 1. Connect to Database
    await connectDatabase();

    // 2. Start HTTP Server
    server = app.listen(env.PORT, () => {
      logger.info(`Salon CRM Backend running in [${env.NODE_ENV}] on http://localhost:${env.PORT}`);
      logger.info(`Health check available at http://localhost:${env.PORT}/health`);
    });

    // 3. Start background scheduled tasks
    startReminderJob();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful Shutdown Handler
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop background jobs
  stopReminderJob();

  // Close HTTP server to stop accepting new requests
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        await disconnectDatabase();
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (err) {
        logger.error('Error during database disconnection:', err);
        process.exit(1);
      }
    });

    // Force shutdown after timeout if pending connections hang
    setTimeout(() => {
      logger.error('Graceful shutdown timed out, force terminating');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();
