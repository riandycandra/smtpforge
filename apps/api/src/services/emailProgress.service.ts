import { Request, Response } from 'express';
import { QueueEvents } from 'bullmq';
import { EMAIL_QUEUE_NAME } from '../config/queue';
import { redisConnectionOptions } from '../config/redis';
import { EmailJob } from '@mailer/database';
import { EMAIL_STATUS, EmailProgressData, logger } from '@mailer/shared';

export const emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
});

emailQueueEvents.on('error', (err) => {
  logger.error('[QueueEvents] Error in BullMQ QueueEvents:', err);
});

function sendSseEvent(res: Response, event: string, data: any) {
  if (res.writableEnded || res.destroyed) return;
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  res.write(`event: ${event}\ndata: ${payload}\n\n`);
}

export async function streamEmailProgress(
  req: Request,
  res: Response,
  initialJobRecord: EmailJob
): Promise<void> {
  const targetJobId = initialJobRecord.job_id;
  const emailJobId = initialJobRecord.id;

  // Set SSE HTTP response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  // If already reached terminal state before stream connection, emit and terminate immediately
  if (initialJobRecord.status === EMAIL_STATUS.SENT) {
    const completedData: EmailProgressData = {
      job_id: targetJobId,
      email_job_id: emailJobId,
      status: EMAIL_STATUS.SENT,
      step: 'delivered',
      percentage: 100,
      message: 'Email delivered successfully',
      latency_ms: initialJobRecord.latency_ms,
      smtp_response: initialJobRecord.smtp_response,
      timestamp: (initialJobRecord.sent_at || initialJobRecord.updated_at || new Date()).toISOString(),
    };
    sendSseEvent(res, 'completed', completedData);
    res.end();
    return;
  }

  if (initialJobRecord.status === EMAIL_STATUS.FAILED) {
    const failedData: EmailProgressData = {
      job_id: targetJobId,
      email_job_id: emailJobId,
      status: EMAIL_STATUS.FAILED,
      step: 'failed',
      percentage: 100,
      message: initialJobRecord.error_message || 'Email delivery failed',
      error: initialJobRecord.error_message,
      timestamp: (initialJobRecord.updated_at || new Date()).toISOString(),
    };
    sendSseEvent(res, 'failed', failedData);
    res.end();
    return;
  }

  // Send initial snapshot
  const initialStep = initialJobRecord.status === EMAIL_STATUS.QUEUED ? 'queued' : 'preparing';
  const initialPercentage = initialJobRecord.status === EMAIL_STATUS.QUEUED ? 0 : 25;
  const initialData: EmailProgressData = {
    job_id: targetJobId,
    email_job_id: emailJobId,
    status: initialJobRecord.status,
    step: initialStep,
    percentage: initialPercentage,
    message: initialJobRecord.status === EMAIL_STATUS.QUEUED
      ? 'Email job is queued for delivery'
      : 'Email is being processed by worker',
    timestamp: new Date().toISOString(),
  };
  sendSseEvent(res, 'progress', initialData);

  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    clearInterval(keepAliveInterval);
    clearInterval(dbCheckInterval);
    clearTimeout(safetyTimeout);
    emailQueueEvents.off('progress', onProgress);
    emailQueueEvents.off('completed', onCompleted);
    emailQueueEvents.off('failed', onFailed);
  };

  const onProgress = ({ jobId, data }: { jobId: string; data: any }) => {
    if (jobId !== targetJobId) return;
    let progressData = data;
    if (typeof data === 'string') {
      try {
        progressData = JSON.parse(data);
      } catch {
        progressData = { message: data };
      }
    }
    sendSseEvent(res, 'progress', progressData);
  };

  const onCompleted = ({ jobId, returnvalue }: { jobId: string; returnvalue: any }) => {
    if (jobId !== targetJobId) return;
    let parsedReturn = returnvalue;
    if (typeof returnvalue === 'string') {
      try {
        parsedReturn = JSON.parse(returnvalue);
      } catch {
        parsedReturn = {};
      }
    }

    const completedPayload: EmailProgressData = {
      job_id: targetJobId,
      email_job_id: emailJobId,
      status: EMAIL_STATUS.SENT,
      step: 'delivered',
      percentage: 100,
      message: 'Email delivered successfully',
      latency_ms: parsedReturn?.latencyMs || null,
      smtp_response: parsedReturn?.smtpResponse || null,
      timestamp: new Date().toISOString(),
    };

    sendSseEvent(res, 'completed', completedPayload);
    cleanup();
    res.end();
  };

  const onFailed = ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    if (jobId !== targetJobId) return;

    const failedPayload: EmailProgressData = {
      job_id: targetJobId,
      email_job_id: emailJobId,
      status: EMAIL_STATUS.FAILED,
      step: 'failed',
      percentage: 100,
      message: failedReason || 'Email delivery failed',
      error: failedReason,
      timestamp: new Date().toISOString(),
    };

    sendSseEvent(res, 'failed', failedPayload);
    cleanup();
    res.end();
  };

  emailQueueEvents.on('progress', onProgress);
  emailQueueEvents.on('completed', onCompleted);
  emailQueueEvents.on('failed', onFailed);

  // Periodic database check to safeguard against missed Redis events
  const dbCheckInterval = setInterval(async () => {
    try {
      const latest = await EmailJob.findByPk(emailJobId);
      if (!latest) return;

      if (latest.status === EMAIL_STATUS.SENT) {
        onCompleted({
          jobId: targetJobId,
          returnvalue: {
            latencyMs: latest.latency_ms,
            smtpResponse: latest.smtp_response,
          },
        });
      } else if (latest.status === EMAIL_STATUS.FAILED) {
        onFailed({
          jobId: targetJobId,
          failedReason: latest.error_message || 'Email delivery failed',
        });
      }
    } catch (err) {
      logger.error(`[SSE] DB fallback check failed for ${targetJobId}:`, err);
    }
  }, 4000);

  // 15-second keep-alive ping to prevent proxy drops
  const keepAliveInterval = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(': keep-alive\n\n');
    }
  }, 15000);

  // 5-minute safety timeout
  const safetyTimeout = setTimeout(() => {
    if (!res.writableEnded && !res.destroyed) {
      sendSseEvent(res, 'failed', {
        job_id: targetJobId,
        email_job_id: emailJobId,
        status: EMAIL_STATUS.FAILED,
        step: 'failed',
        percentage: 100,
        message: 'Progress stream timed out after 5 minutes',
        error: 'STREAM_TIMEOUT',
        timestamp: new Date().toISOString(),
      });
      cleanup();
      res.end();
    }
  }, 5 * 60 * 1000);

  req.on('close', () => {
    cleanup();
  });
}
