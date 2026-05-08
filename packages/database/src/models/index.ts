import { SmtpAccount } from './SmtpAccount';
import { ApiKey } from './ApiKey';
import { ApiKeySmtpPermission } from './ApiKeySmtpPermission';
import { EmailJob } from './EmailJob';

// ApiKey <-> SmtpAccount (Many to Many)
ApiKey.belongsToMany(SmtpAccount, {
  through: ApiKeySmtpPermission,
  foreignKey: 'api_key_id',
  otherKey: 'smtp_account_id',
});

SmtpAccount.belongsToMany(ApiKey, {
  through: ApiKeySmtpPermission,
  foreignKey: 'smtp_account_id',
  otherKey: 'api_key_id',
});

// EmailJob -> ApiKey (Many to One)
EmailJob.belongsTo(ApiKey, {
  foreignKey: 'api_key_id',
});
ApiKey.hasMany(EmailJob, {
  foreignKey: 'api_key_id',
});

// EmailJob -> SmtpAccount (Many to One)
EmailJob.belongsTo(SmtpAccount, {
  foreignKey: 'smtp_account_id',
});
SmtpAccount.hasMany(EmailJob, {
  foreignKey: 'smtp_account_id',
});

export {
  SmtpAccount,
  ApiKey,
  ApiKeySmtpPermission,
  EmailJob,
};
