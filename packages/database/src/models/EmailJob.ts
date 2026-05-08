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
  public id!: string;
  public job_id!: string;
  public api_key_id!: string;
  public smtp_account_id!: string;
  public to!: string[];
  public cc!: string[] | null;
  public bcc!: string[] | null;
  public subject!: string;
  public html!: string;
  public attachments!: any[] | null;
  public status!: EmailStatus;
  public error_message!: string | null;
  public smtp_response!: string | null;
  public retry_count!: number;
  public latency_ms!: number | null;
  public sent_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
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
