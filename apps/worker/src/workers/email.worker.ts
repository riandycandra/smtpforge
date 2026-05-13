import { Worker, Job } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';
import { QUEUE_NAME_EMAIL_DELIVERY, EmailJobPayload, EMAIL_STATUS } from '@mailer/shared';
import { sendEmailService } from '../services/send-email.service';
import { classifyError, RetryClassification } from '../services/retry-classifier.service';
import { EmailJob } from '@mailer/database';
import { 
  emailActiveJobsGauge, 
  emailJobsCompletedCounter, 
  emailJobsFailedCounter, 
  emailJobsRetryCounter 
} from '../metrics';

export function createEmailWorker() {
  const worker = new Worker<EmailJobPayload>(
    QUEUE_NAME_EMAIL_DELIVERY,
    async (job: Job<EmailJobPayload>) => {
      emailActiveJobsGauge.inc();
      const payload = job.data;
      let emailJobRecord: EmailJob | null = null;
      
      console.log(`[Worker] Processing Job ID: ${job.id} | Request ID: ${payload.request_id || 'N/A'}`);

      try {
        emailJobRecord = await EmailJob.findByPk(payload.email_job_id);
        
        if (!emailJobRecord) {
          throw new Error(`EmailJob record ${payload.email_job_id} not found`);
        }

        if (emailJobRecord.status === EMAIL_STATUS.SENT) {
          console.log(`[Worker] Job ID: ${job.id} already sent; skipping duplicate delivery.`);
          return { status: EMAIL_STATUS.SENT, message: 'Email already sent; skipped duplicate delivery.' };
        }

        // Update status to processing
        emailJobRecord.status = EMAIL_STATUS.PROCESSING;
        await emailJobRecord.save();

        const startLatency = Date.now();
        const result = await sendEmailService(payload);
        const latencyMs = Date.now() - startLatency;

        // Success Update
        emailJobRecord.status = EMAIL_STATUS.SENT;
        emailJobRecord.smtp_response = result.response;
        emailJobRecord.latency_ms = latencyMs;
        emailJobRecord.sent_at = new Date();
        emailJobRecord.error_message = null;
        await emailJobRecord.save();

        emailJobsCompletedCounter.inc();

        return { status: EMAIL_STATUS.SENT, messageId: result.messageId };

      } catch (error: any) {
        if (emailJobRecord) {
          const classification = classifyError(error);
          
          if (classification === RetryClassification.NON_RETRYABLE) {
            // Force fail immediately, bypass BullMQ retries
            emailJobRecord.status = EMAIL_STATUS.FAILED;
            emailJobRecord.error_message = error.message;
            await emailJobRecord.save();
            emailJobsFailedCounter.inc();
            
            // We don't want BullMQ to retry this, so we throw a specific error or just return failed
            // But returning a value marks job as completed in BullMQ.
            // If we throw, BullMQ retries. To stop BullMQ, we can move it to failed manually or discard it.
            // For BullMQ 5+, job.discard() stops retries.
            job.discard();
            throw error;
          } else {
            // Retryable
            emailJobRecord.status = EMAIL_STATUS.RETRYING;
            emailJobRecord.retry_count += 1;
            emailJobRecord.error_message = error.message;
            await emailJobRecord.save();
            emailJobsRetryCounter.inc();
            throw error;
          }
        }
        
        // If no record found at all, just throw so BullMQ fails it
        throw error;
      } finally {
        emailActiveJobsGauge.dec();
      }
    },
    {
      connection: redisConnectionOptions,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '10', 10),
    }
  );

  worker.on('failed', async (job, err) => {
    console.error(`Job ${job?.id} failed with ${err.message}`);
    // If it ran out of attempts, mark as failed permanently
    if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
      try {
        const payload = job.data;
        const emailJobRecord = await EmailJob.findByPk(payload.email_job_id);
        if (emailJobRecord) {
          if (emailJobRecord.status === EMAIL_STATUS.SENT) {
            console.log(`[Worker] Job ${job.id} failed after email was already marked sent; keeping sent status.`);
            return;
          }

          emailJobRecord.status = EMAIL_STATUS.FAILED;
          await emailJobRecord.save();
        }
        emailJobsFailedCounter.inc();
      } catch (e) {
        console.error('Failed to update DB on final job failure', e);
      }
    }
  });

  return worker;
}
