import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { EMAIL_STATUS, EmailStatus } from '@mailer/shared';

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

export interface EmailJobCreationAttributes extends Optional<EmailJobAttributes, 'id' | 'cc' | 'bcc' | 'attachments' | 'error_message' | 'smtp_response' | 'retry_count' | 'latency_ms' | 'sent_at'> {}

export class EmailJob extends Model<EmailJobAttributes, EmailJobCreationAttributes> implements EmailJobAttributes {
  declare id: string;
  declare job_id: string;
  declare api_key_id: string;
  declare smtp_account_id: string;
  declare to: string[];
  declare cc: string[] | null;
  declare bcc: string[] | null;
  declare subject: string;
  declare html: string;
  declare attachments: any[] | null;
  declare status: EmailStatus;
  declare error_message: string | null;
  declare smtp_response: string | null;
  declare retry_count: number;
  declare latency_ms: number | null;
  declare sent_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

EmailJob.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  job_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  api_key_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  smtp_account_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  to: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  cc: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  bcc: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  html: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  attachments: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: EMAIL_STATUS.QUEUED,
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  smtp_response: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  retry_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  latency_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'email_jobs',
  underscored: true,
  indexes: [
    {
      fields: ['status']
    }
  ]
});
