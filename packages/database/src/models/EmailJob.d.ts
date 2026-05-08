import { Model, Optional } from 'sequelize';
import { EmailStatus } from '@mailer/shared';
export interface EmailJobAttributes {
    id: string;
    job_id: string;
    api_key_id: string;
    smtp_account_id: string;
    to: string[];
    cc: string[] | null;
    bcc: string[] | null;
    subject: string;
    html: string;
    attachments: any[] | null;
    status: EmailStatus;
    error_message: string | null;
    smtp_response: string | null;
    retry_count: number;
    latency_ms: number | null;
    sent_at: Date | null;
    created_at?: Date;
    updated_at?: Date;
}
export interface EmailJobCreationAttributes extends Optional<EmailJobAttributes, 'id' | 'cc' | 'bcc' | 'attachments' | 'error_message' | 'smtp_response' | 'retry_count' | 'latency_ms' | 'sent_at'> {
}
export declare class EmailJob extends Model<EmailJobAttributes, EmailJobCreationAttributes> implements EmailJobAttributes {
    id: string;
    job_id: string;
    api_key_id: string;
    smtp_account_id: string;
    to: string[];
    cc: string[] | null;
    bcc: string[] | null;
    subject: string;
    html: string;
    attachments: any[] | null;
    status: EmailStatus;
    error_message: string | null;
    smtp_response: string | null;
    retry_count: number;
    latency_ms: number | null;
    sent_at: Date | null;
    readonly created_at: Date;
    readonly updated_at: Date;
}
