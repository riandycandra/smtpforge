import { Registry, Counter, Gauge, Histogram } from 'prom-client';

export const workerRegistry = new Registry();

export const emailActiveJobsGauge = new Gauge({
  name: 'mailer_worker_active_jobs',
  help: 'Number of currently active email jobs in the worker',
  registers: [workerRegistry],
});

export const emailJobsCompletedCounter = new Counter({
  name: 'mailer_worker_jobs_completed_total',
  help: 'Total number of successfully completed email jobs',
  registers: [workerRegistry],
});

export const emailJobsFailedCounter = new Counter({
  name: 'mailer_worker_jobs_failed_total',
  help: 'Total number of failed email jobs (including retries)',
  registers: [workerRegistry],
});

export const emailJobsRetryCounter = new Counter({
  name: 'mailer_worker_jobs_retried_total',
  help: 'Total number of job retries',
  registers: [workerRegistry],
});

export const queueDepthGauge = new Gauge({
  name: 'mailer_worker_queue_depth',
  help: 'Number of pending jobs in the queue',
  registers: [workerRegistry],
});

export const processingLatencyHistogram = new Histogram({
  name: 'mailer_worker_processing_latency_ms',
  help: 'Latency of email job processing in milliseconds',
  buckets: [100, 500, 1000, 2000, 5000, 10000, 30000],
  registers: [workerRegistry],
});
