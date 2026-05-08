import { EmailJobPayload } from '@mailer/shared';
import { getTransporter } from './transporter.service';
import { downloadAttachments, cleanupAttachments, DownloadedAttachment } from './attachment.service';
import { processingLatencyHistogram } from '../metrics';

export interface SendResult {
  messageId: string;
  response: string;
  rejected: string[];
}

export async function sendEmailService(payload: EmailJobPayload): Promise<SendResult> {
  const timer = processingLatencyHistogram.startTimer();
  let downloadedAttachments: DownloadedAttachment[] = [];

  try {
    const { transporter, fromEmail, fromName } = await getTransporter(payload.smtp_account_id);

    if (payload.attachments && payload.attachments.length > 0) {
      downloadedAttachments = await downloadAttachments(payload.attachments);
    }

    const fromString = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

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

    return {
      messageId: info.messageId,
      response: info.response,
      rejected: info.rejected || [],
    };
  } finally {
    // Always cleanup tmp files defensively
    if (downloadedAttachments.length > 0) {
      await cleanupAttachments(downloadedAttachments);
    }
    timer();
  }
}
