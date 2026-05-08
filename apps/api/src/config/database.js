"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
exports.connectDatabase = connectDatabase;
const sequelize_1 = require("sequelize");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
exports.sequelize = new sequelize_1.Sequelize(env_1.env.DB_NAME, env_1.env.DB_USER, env_1.env.DB_PASSWORD, {
    host: env_1.env.DB_HOST,
    port: env_1.env.DB_PORT,
    dialect: 'postgres',
    logging: (msg) => logger_1.logger.debug(msg),
    define: {
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    // Ensure timezones are handled properly if needed
    timezone: '+00:00',
});
async function connectDatabase() {
    try {
        logger_1.logger.info('Testing database connection...');
        await exports.sequelize.authenticate();
        logger_1.logger.info('Database connection has been established successfully.');
    }
    catch (error) {
        logger_1.logger.error('Unable to connect to the database during startup:', error);
        // Graceful startup failure
        process.exit(1);
    }
}
