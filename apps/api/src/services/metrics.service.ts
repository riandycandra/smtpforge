import { EmailJob } from '@mailer/database';
import { EMAIL_STATUS } from '@mailer/shared';
import { emailQueue } from '../config/queue';
import { Op, fn, col } from 'sequelize';

export async function getDashboardMetrics() {
  // 1. Queue Depth (from BullMQ)
  const jobCounts = await emailQueue.getJobCounts('wait', 'active', 'delayed');
  const queueDepth = jobCounts.wait + jobCounts.active + jobCounts.delayed;

  // 2. Job Statistics (Last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const stats = await EmailJob.findAll({
    attributes: [
      'status',
      [fn('COUNT', col('id')), 'count'],
      [fn('AVG', col('latency_ms')), 'avg_latency'],
    ],
    where: {
      created_at: {
        [Op.gte]: twentyFourHoursAgo,
      },
    },
    group: ['status'],
    raw: true,
  }) as any[];

  let successCount = 0;
  let failedCount = 0;
  let totalLatency = 0;
  let latencyCount = 0;

  stats.forEach((stat) => {
    const count = parseInt(stat.count, 10);
    if (stat.status === EMAIL_STATUS.SENT) {
      successCount = count;
    } else if (stat.status === EMAIL_STATUS.FAILED) {
      failedCount = count;
    }
    
    if (stat.avg_latency) {
      totalLatency += parseFloat(stat.avg_latency) * count;
      latencyCount += count;
    }
  });

  const totalCompleted = successCount + failedCount;
  const successRate = totalCompleted > 0 ? (successCount / totalCompleted) * 100 : 100;
  const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;

  return {
    queueDepth,
    successRate: successRate.toFixed(1) + '%',
    failedJobs: failedCount,
    avgLatency: avgLatency + 'ms',
  };
}

export async function getPlatformMetrics() {
  // 1. Queue Depth
  const jobCounts = await emailQueue.getJobCounts('wait', 'active', 'delayed', 'prioritized');
  const queueDepth = jobCounts.wait + jobCounts.active + jobCounts.delayed + (jobCounts.prioritized || 0);

  // 2. All-time Statistics
  const stats = await EmailJob.findAll({
    attributes: [
      'status',
      [fn('COUNT', col('id')), 'count'],
      [fn('AVG', col('latency_ms')), 'avg_latency'],
    ],
    group: ['status'],
    raw: true,
  }) as any[];

  let totalSent = 0;
  let totalFailed = 0;
  let totalLatency = 0;
  let latencyCount = 0;

  stats.forEach((stat) => {
    const count = parseInt(stat.count, 10);
    if (stat.status === EMAIL_STATUS.SENT) {
      totalSent = count;
    } else if (stat.status === EMAIL_STATUS.FAILED) {
      totalFailed = count;
    }
    
    if (stat.avg_latency) {
      totalLatency += parseFloat(stat.avg_latency) * count;
      latencyCount += count;
    }
  });

  const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;

  return {
    queueDepth,
    totalSent,
    totalFailed,
    avgLatency: avgLatency + 'ms',
  };
}
export async function getWorkerStats() {
  const workers = await emailQueue.getWorkers();
  return {
    count: workers.length,
    status: workers.length > 0 ? 'active' : 'inactive',
    workers: workers.map(w => ({
      id: w.id,
      name: w.name,
      concurrency: (w as any).concurrency, // Some internal props might be useful
    }))
  };
}
