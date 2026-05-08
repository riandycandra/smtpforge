import { Router } from 'express';
import { sequelize } from '@mailer/database';
import { redisClient } from '../config/redis';
import { emailQueue } from '../config/queue';

export const healthRouter = Router();

// Liveness Probe: Verifies the process is running and accepting HTTP requests
healthRouter.get('/live', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness Probe: Verifies dependencies (DB, Redis) are ready to serve traffic
healthRouter.get('/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    await redisClient.ping();
    const queueStatus = await (await emailQueue.client).status;

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: 'connected',
        redis: 'connected',
        queue: queueStatus === 'ready' ? 'connected' : 'degraded',
      },
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: sequelize.config.host ? 'error' : 'disconnected',
        redis: redisClient.status,
      },
      error: error.message,
    });
  }
});

