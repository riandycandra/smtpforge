import { env } from './config/env';
import { app } from './app';
import { connectDatabase } from '@mailer/database';
import { redisClient } from './config/redis';
import { logger } from './utils/logger';
import { seedDefaultAdmin } from './routes/admin/auth';
import { startWorkerHealthCheck } from './jobs/workerHealthCheck';

async function bootstrap() {
  try {
    // Establish connections
    await connectDatabase();
    
    // Seed default admin user if none exists
    await seedDefaultAdmin();
    
    // Check Redis connection
    await redisClient.ping();
    logger.info('Redis connection established successfully.');

    // Start background jobs
    startWorkerHealthCheck();

    // Start server
    app.listen(env.PORT, () => {
      logger.info(`API Service running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to bootstrap API Service', error);
    process.exit(1);
  }
}

bootstrap();
