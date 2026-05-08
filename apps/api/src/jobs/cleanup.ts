import { Op } from 'sequelize';
import { EmailJob } from '@mailer/database';
import { logger } from '../utils/logger';

export async function runRetentionCleanup(retentionDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  logger.info(`Starting retention cleanup job. Target older than ${retentionDays} days (${cutoffDate.toISOString()})`);

  try {
    // Delete jobs older than cutoff.
    // Batch deletion is handled natively by Sequelize when doing a bulk destroy
    const deletedCount = await EmailJob.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate,
        }
      }
    });

    logger.info(`Retention cleanup completed. Removed ${deletedCount} expired email logs.`);
  } catch (error) {
    logger.error('Retention cleanup failed', error);
  }
}
