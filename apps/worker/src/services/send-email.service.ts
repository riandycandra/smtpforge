import { EmailJobPayload } from '@mailer/shared';
import { getTransporter } from './transporter.service';
import { downloadAttachments, cleanupAttachments, DownloadedAttachment } from './attachment.service';
import { processingLatencyHistogram } from '../metrics';

export interface SendResult {
  messageId: string;
  response: string;
  rejected: string[];
  smtpRespondedAt: Date;
  smtpLatencyMs: number;
}

export async function sendEmailService(payload: EmailJobPayload): Promise<SendResult> {
  const timer = processingLatencyHistogram.startTimer();
  let downloadedAttachments: DownloadedAttachment[] = [];

  try {
    const { transporter, fromEmail, fromName } = await getTransporter(payload.smtp_account_id);

    if (payload.attachments && payload.attachments.length > 0) {
      downloadedAttachments = await downloadAttachments(payload.attachments);
    }

    const effectiveFromEmail = payload.from_email?.trim() || fromEmail;
    const effectiveFromName = payload.from_name !== undefined ? payload.from_name.trim() : fromName;
    const fromString = effectiveFromName ? `"${effectiveFromName}" <${effectiveFromEmail}>` : effectiveFromEmail;

    const smtpStart = Date.now();
    try {
      const info = await transporter.sendMail({
        from: fromString,
        to: payload.to,
        cc: payload.cc,
        bcc: payload.bcc,
        subject: payload.subject,
        html: payload.html,
        attachments: downloadedAttachments.map(att => ({
          filename: att.filename,
          path: att.path,
          contentType: att.contentType,
        })),
      });

      const smtpRespondedAt = new Date();
      const smtpLatencyMs = Date.now() - smtpStart;

      return {
        messageId: info.messageId,
        response: info.response || '',
        rejected: info.rejected || [],
        smtpRespondedAt,
        smtpLatencyMs,
      };
    } catch (smtpError: any) {
      const smtpRespondedAt = new Date();
      const smtpLatencyMs = Date.now() - smtpStart;
      smtpError.smtpRespondedAt = smtpRespondedAt;
      smtpError.smtpLatencyMs = smtpLatencyMs;
      throw smtpError;
    }
  } finally {
    // Always cleanup tmp files defensively
    if (downloadedAttachments.length > 0) {
      await cleanupAttachments(downloadedAttachments);
    }
    timer();
  }
}
