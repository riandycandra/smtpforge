import { checkAllAccountsHealth } from '../services/smtp.service';
import { logger } from '../utils/logger';

let smtpHealthCheckInterval: NodeJS.Timeout | null = null;

export async function runSmtpHealthCheckJob() {
  try {
    logger.info('[SmtpHealthCheck] Running scheduled SMTP accounts health check...');
    const result = await checkAllAccountsHealth();
    logger.info(
      `[SmtpHealthCheck] Completed. Total: ${result.total}, Healthy: ${result.healthy}, Unhealthy: ${result.unhealthy}`
    );
  } catch (error: any) {
    logger.error('[SmtpHealthCheck] Failed during health check execution:', error);
  }
}

export function startSmtpHealthCheck(intervalMs?: number) {
  if (smtpHealthCheckInterval) return;

  // Default: 15 minutes (or env var SMTP_HEALTH_CHECK_INTERVAL_MS)
  const interval = intervalMs || parseInt(process.env.SMTP_HEALTH_CHECK_INTERVAL_MS || '900000', 10);

  logger.info(`[SmtpHealthCheck] Starting SMTP health check background job (Interval: ${interval}ms)`);

  // Run initial check after a short 10-second delay so DB connects and seeds first
  setTimeout(() => {
    runSmtpHealthCheckJob().catch((err) =>
      logger.error('[SmtpHealthCheck] Initial run failed:', err)
    );
  }, 10000);

  smtpHealthCheckInterval = setInterval(runSmtpHealthCheckJob, interval);
}

export function stopSmtpHealthCheck() {
  if (smtpHealthCheckInterval) {
    clearInterval(smtpHealthCheckInterval);
    smtpHealthCheckInterval = null;
    logger.info('[SmtpHealthCheck] Stopped background job');
  }
}
