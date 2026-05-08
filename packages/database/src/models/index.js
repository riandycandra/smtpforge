"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailJob = exports.ApiKeySmtpPermission = exports.ApiKey = exports.SmtpAccount = void 0;
const SmtpAccount_1 = require("./SmtpAccount");
Object.defineProperty(exports, "SmtpAccount", { enumerable: true, get: function () { return SmtpAccount_1.SmtpAccount; } });
const ApiKey_1 = require("./ApiKey");
Object.defineProperty(exports, "ApiKey", { enumerable: true, get: function () { return ApiKey_1.ApiKey; } });
const ApiKeySmtpPermission_1 = require("./ApiKeySmtpPermission");
Object.defineProperty(exports, "ApiKeySmtpPermission", { enumerable: true, get: function () { return ApiKeySmtpPermission_1.ApiKeySmtpPermission; } });
const EmailJob_1 = require("./EmailJob");
Object.defineProperty(exports, "EmailJob", { enumerable: true, get: function () { return EmailJob_1.EmailJob; } });
// ApiKey <-> SmtpAccount (Many to Many)
ApiKey_1.ApiKey.belongsToMany(SmtpAccount_1.SmtpAccount, {
    through: ApiKeySmtpPermission_1.ApiKeySmtpPermission,
    foreignKey: 'api_key_id',
    otherKey: 'smtp_account_id',
});
SmtpAccount_1.SmtpAccount.belongsToMany(ApiKey_1.ApiKey, {
    through: ApiKeySmtpPermission_1.ApiKeySmtpPermission,
    foreignKey: 'smtp_account_id',
    otherKey: 'api_key_id',
});
// EmailJob -> ApiKey (Many to One)
EmailJob_1.EmailJob.belongsTo(ApiKey_1.ApiKey, {
    foreignKey: 'api_key_id',
});
ApiKey_1.ApiKey.hasMany(EmailJob_1.EmailJob, {
    foreignKey: 'api_key_id',
});
// EmailJob -> SmtpAccount (Many to One)
EmailJob_1.EmailJob.belongsTo(SmtpAccount_1.SmtpAccount, {
    foreignKey: 'smtp_account_id',
});
SmtpAccount_1.SmtpAccount.hasMany(EmailJob_1.EmailJob, {
    foreignKey: 'smtp_account_id',
});
