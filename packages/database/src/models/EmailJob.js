"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailJob = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const shared_1 = require("@mailer/shared");
class EmailJob extends sequelize_1.Model {
    id;
    job_id;
    api_key_id;
    smtp_account_id;
    to;
    cc;
    bcc;
    subject;
    html;
    attachments;
    status;
    error_message;
    smtp_response;
    retry_count;
    latency_ms;
    sent_at;
    created_at;
    updated_at;
}
exports.EmailJob = EmailJob;
EmailJob.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    job_id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    api_key_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    smtp_account_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    to: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    cc: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    bcc: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    subject: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    html: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    attachments: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: shared_1.EMAIL_STATUS.QUEUED,
    },
    error_message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    smtp_response: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    retry_count: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    latency_ms: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    sent_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'email_jobs',
    underscored: true,
    indexes: [
        {
            fields: ['status']
        }
    ]
});
