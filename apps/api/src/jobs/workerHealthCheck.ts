import { NotificationConfig } from '@mailer/database';
import { emailQueue } from '../config/queue';
import { notifyWorkerStatusChange } from '../services/notification.service';
import { WORKER_STATUS, WorkerStatus } from '@mailer/shared';
import { logger } from '../utils/logger';

export async function checkWorkerHealth() {
  try {
    const workers = await emailQueue.getWorkers();
    const currentStatus: WorkerStatus = workers.length > 0 ? WORKER_STATUS.UP : WORKER_STATUS.DOWN;

    const configs = await NotificationConfig.findAll({
      where: {
        is_enabled: true,
      },
    });

    for (const config of configs) {
      const previousStatus = config.last_status as WorkerStatus;

      // Only notify if status changed
      if (previousStatus !== currentStatus) {
        // Skip notification if transitioning from UNKNOWN to UP (initial healthy state)
        if (!(previousStatus === WORKER_STATUS.UNKNOWN && currentStatus === WORKER_STATUS.UP)) {
          logger.info(`Worker status changed from ${previousStatus} to ${currentStatus}. Notifying ${config.name}...`);
          await notifyWorkerStatusChange(config, currentStatus);
        }
      }

      // Update last checked status and time
      await config.update({
        last_status: currentStatus,
        last_checked_at: new Date(),
      });
    }
  } catch (error: any) {
    logger.error('Worker health check failed', error);
  }
}

let healthCheckInterval: NodeJS.Timeout | null = null;

export function startWorkerHealthCheck(intervalMs = 60000) { // Default 1 minute
  if (healthCheckInterval) return;

  logger.info(`Starting worker health check background job (Interval: ${intervalMs}ms)`);
  
  // Run immediately on start
  checkWorkerHealth();

  healthCheckInterval = setInterval(checkWorkerHealth, intervalMs);
}

export function stopWorkerHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}
