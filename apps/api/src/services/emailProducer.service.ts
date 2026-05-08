import { emailQueue } from '../config/queue';
import { EmailJob } from '@mailer/database';
import { EmailJobPayload, EMAIL_STATUS } from '@mailer/shared';
import { QUEUE_NAME_EMAIL_DELIVERY, QUEUE_DEFAULT_JOB_OPTIONS } from '@mailer/shared';

export async function enqueueEmailJob(payload: Omit<EmailJobPayload, 'email_job_id'>) {
  // 1. Create the persistent record
  const emailJob = await EmailJob.create({
    job_id: 'pending', // Will update immediately after enqueue
    api_key_id: payload.api_key_id,
    smtp_account_id: payload.smtp_account_id,
    to: payload.to,
    cc: payload.cc || null,
    bcc: payload.bcc || null,
    subject: payload.subject,
    html: payload.html,
    attachments: payload.attachments || null,
    status: EMAIL_STATUS.QUEUED,
    retry_count: 0,
    latency_ms: null,
    error_message: null,
    smtp_response: null,
    sent_at: null,
  });

  // 2. Enqueue to BullMQ
  const jobPayload: EmailJobPayload = {
    ...payload,
    email_job_id: emailJob.id,
  };

  const job = await emailQueue.add('send-email', jobPayload, {
    ...QUEUE_DEFAULT_JOB_OPTIONS,
  });

  // 3. Update job_id back to persistent record
  emailJob.job_id = job.id!;
  await emailJob.save();

  return emailJob;
}
