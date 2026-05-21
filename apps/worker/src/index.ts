import { env } from './config/env';
import { createEmailWorker } from './workers/email.worker';
import { redisClient } from './config/redis';
import { connectDatabase } from '@mailer/database';
import { startupTempCleanupScan } from './services/attachment.service';
import { logger } from '@mailer/shared';

async function bootstrap() {
  logger.info('Starting Mailer Worker Service...');

  try {
    // 1. Establish dependencies (DB + Redis)
    await connectDatabase();
    await redisClient.ping();
    logger.info('Worker dependencies connected successfully.');

    // 2. Cleanup stale temp files
    await startupTempCleanupScan();

    // 3. Start Worker
    const worker = createEmailWorker();
    logger.info('Worker listening for jobs...');

    // 3. Graceful Shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, initiating graceful shutdown...`);
      
      // Stop accepting new jobs and wait for active ones to finish
      await worker.close();
      logger.info('Worker closed active queues.');

      // Close Redis connection
      await redisClient.quit();
      logger.info('Redis connection closed.');

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Worker failed to bootstrap:', error);
    process.exit(1);
  }
}

bootstrap().catch(logger.error);
