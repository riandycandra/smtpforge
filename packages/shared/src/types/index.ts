import { EmailStatus } from '../constants/status';

export interface EmailAttachment {
  filename: string;
  url?: string;
  content?: string;
  contentType?: string;
  size?: number;
}

export interface EmailJobPayload {
  email_job_id: string; // The UUID from the DB
  smtp_account_id: string;
  api_key_id: string;
  request_id?: string; // Distributed tracing correlation
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface SmtpConfigShape {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName?: string;
}

export interface QueueJobResult {
  status: EmailStatus;
  messageId?: string;
  smtpResponse?: string;
  error?: string;
}

