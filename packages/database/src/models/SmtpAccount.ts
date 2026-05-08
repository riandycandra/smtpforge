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
  public id!: string;
  public name!: string;
  public host!: string;
  public port!: number;
  public secure!: boolean;
  public username!: string;
  public password_encrypted!: string;
  public from_email!: string;
  public from_name!: string | null;
  public retry_attempts!: number;
  public rate_limit_per_hour!: number | null;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
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
