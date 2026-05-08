"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKey = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class ApiKey extends sequelize_1.Model {
    id;
    name;
    api_key_hash;
    is_active;
    rate_limit_per_hour;
    created_at;
    updated_at;
}
exports.ApiKey = ApiKey;
ApiKey.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    api_key_hash: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    is_active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    rate_limit_per_hour: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'api_keys',
    underscored: true,
});
