import { createEmailWorker } from './workers/email.worker';
import { redisClient } from './config/redis';
import { connectDatabase } from '@mailer/database';
import { startupTempCleanupScan } from './services/attachment.service';

async function bootstrap() {
  console.log('Starting Mailer Worker Service...');

  try {
    // 1. Establish dependencies (DB + Redis)
    await connectDatabase();
    await redisClient.ping();
    console.log('Worker dependencies connected successfully.');

    // 2. Cleanup stale temp files
    await startupTempCleanupScan();

    // 3. Start Worker
    const worker = createEmailWorker();
    console.log('Worker listening for jobs...');

    // 3. Graceful Shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, initiating graceful shutdown...`);
      
      // Stop accepting new jobs and wait for active ones to finish
      await worker.close();
      console.log('Worker closed active queues.');

      // Close Redis connection
      await redisClient.quit();
      console.log('Redis connection closed.');

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Worker failed to bootstrap:', error);
    process.exit(1);
  }
}

bootstrap().catch(console.error);
