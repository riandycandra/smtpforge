"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeySmtpPermission = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class ApiKeySmtpPermission extends sequelize_1.Model {
    id;
    api_key_id;
    smtp_account_id;
    created_at;
    updated_at;
}
exports.ApiKeySmtpPermission = ApiKeySmtpPermission;
ApiKeySmtpPermission.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    api_key_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    smtp_account_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'api_key_smtp_permissions',
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['api_key_id', 'smtp_account_id']
        }
    ]
});
