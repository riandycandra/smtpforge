import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { NotificationType, WorkerStatus, WORKER_STATUS } from '@mailer/shared';

export interface NotificationConfigAttributes {
  id: string;
  name: string;
  type: NotificationType;
  config: any; // Store webhook URL, etc.
  is_enabled: boolean;
  last_status: WorkerStatus;
  last_checked_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface NotificationConfigCreationAttributes extends Optional<NotificationConfigAttributes, 'id' | 'is_enabled' | 'last_status' | 'last_checked_at'> {}

export class NotificationConfig extends Model<NotificationConfigAttributes, NotificationConfigCreationAttributes> implements NotificationConfigAttributes {
  declare id: string;
  declare name: string;
  declare type: NotificationType;
  declare config: any;
  declare is_enabled: boolean;
  declare last_status: WorkerStatus;
  declare last_checked_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

NotificationConfig.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  config: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  is_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  last_status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: WORKER_STATUS.UNKNOWN,
  },
  last_checked_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'notification_configs',
  underscored: true,
});
