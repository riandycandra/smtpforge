import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ApiKeyAttributes {
  id: string;
  name: string;
  api_key_hash: string;
  is_active: boolean;
  rate_limit_per_hour: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ApiKeyCreationAttributes extends Optional<ApiKeyAttributes, 'id' | 'is_active' | 'rate_limit_per_hour'> {}

export class ApiKey extends Model<ApiKeyAttributes, ApiKeyCreationAttributes> implements ApiKeyAttributes {
  declare id: string;
  declare name: string;
  declare api_key_hash: string;
  declare is_active: boolean;
  declare rate_limit_per_hour: number | null;
  declare created_at: Date;
  declare updated_at: Date;
}

ApiKey.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  api_key_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  rate_limit_per_hour: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'api_keys',
  underscored: true,
});
