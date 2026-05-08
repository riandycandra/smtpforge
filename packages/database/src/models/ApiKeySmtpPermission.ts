import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ApiKeySmtpPermissionAttributes {
  id: string;
  api_key_id: string;
  smtp_account_id: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ApiKeySmtpPermissionCreationAttributes extends Optional<ApiKeySmtpPermissionAttributes, 'id'> {}

export class ApiKeySmtpPermission extends Model<ApiKeySmtpPermissionAttributes, ApiKeySmtpPermissionCreationAttributes> implements ApiKeySmtpPermissionAttributes {
  declare id: string;
  declare api_key_id: string;
  declare smtp_account_id: string;
  declare created_at: Date;
  declare updated_at: Date;
}

ApiKeySmtpPermission.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  api_key_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  smtp_account_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'api_key_smtp_permissions',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['api_key_id', 'smtp_account_id']
    }
  ]
});
