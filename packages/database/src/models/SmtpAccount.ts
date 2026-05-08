import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface SmtpAccountAttributes {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password_encrypted: string;
  from_email: string;
  from_name: string | null;
  retry_attempts: number;
  rate_limit_per_hour: number | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface SmtpAccountCreationAttributes extends Optional<SmtpAccountAttributes, 'id' | 'secure' | 'retry_attempts' | 'is_active' | 'from_name' | 'rate_limit_per_hour'> {}

export class SmtpAccount extends Model<SmtpAccountAttributes, SmtpAccountCreationAttributes> implements SmtpAccountAttributes {
  declare id: string;
  declare name: string;
  declare host: string;
  declare port: number;
  declare secure: boolean;
  declare username: string;
  declare password_encrypted: string;
  declare from_email: string;
  declare from_name: string | null;
  declare retry_attempts: number;
  declare rate_limit_per_hour: number | null;
  declare is_active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

SmtpAccount.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  host: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  secure: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password_encrypted: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  from_email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  from_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  retry_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
  },
  rate_limit_per_hour: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'smtp_accounts',
  underscored: true,
});
