"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmtpAccount = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class SmtpAccount extends sequelize_1.Model {
    id;
    name;
    host;
    port;
    secure;
    username;
    password_encrypted;
    from_email;
    from_name;
    retry_attempts;
    rate_limit_per_hour;
    is_active;
    created_at;
    updated_at;
}
exports.SmtpAccount = SmtpAccount;
SmtpAccount.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    host: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    port: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    secure: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    username: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    password_encrypted: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    from_email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    from_name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    retry_attempts: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
    },
    rate_limit_per_hour: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    is_active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'smtp_accounts',
    underscored: true,
});
