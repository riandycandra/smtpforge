import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class AdminUser extends Model {
  declare id: string;
  declare username: string;
  declare password_hash: string;
  declare must_change_password: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

AdminUser.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    must_change_password: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'admin_users',
    modelName: 'AdminUser',
  }
);
