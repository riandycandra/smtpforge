import { ApiKey, ApiKeySmtpPermission } from '@mailer/database';
import { generateApiKey, hashApiKey } from '../utils/apiKey';
import { sequelize } from '@mailer/database';

export async function createApiKey(data: any) {
  const rawKey = generateApiKey();
  const hashedKey = hashApiKey(rawKey);

  const account = await sequelize.transaction(async (t) => {
    return await ApiKey.create({
      ...data,
      api_key_hash: hashedKey,
    }, { transaction: t });
  });

  const response = account.toJSON();
  // Safe to omit hash
  const { api_key_hash, ...rest } = response;
  
  // Return PLAINTEXT key exactly ONCE during creation
  return {
    ...rest,
    api_key: rawKey,
  };
}

export async function getApiKeys(limit: number, offset: number) {
  const result = await ApiKey.findAndCountAll({
    limit,
    offset,
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['api_key_hash'] },
  });
  return result;
}

export async function getApiKey(id: string) {
  const account = await ApiKey.findByPk(id, {
    attributes: { exclude: ['api_key_hash'] },
    include: ['SmtpAccounts'] // Using alias implicitly derived from belongsToMany
  });
  return account ? account.toJSON() : null;
}

export async function updateApiKey(id: string, data: any) {
  const account = await ApiKey.findByPk(id);
  if (!account) return null;

  await account.update(data);
  const response = account.toJSON();
  const { api_key_hash, ...rest } = response;
  return rest;
}

export async function deleteApiKey(id: string) {
  const account = await ApiKey.findByPk(id);
  if (!account) return false;
  await account.destroy();
  return true;
}

export async function assignSmtpPermission(apiKeyId: string, smtpAccountId: string) {
  return await sequelize.transaction(async (t) => {
    const existing = await ApiKeySmtpPermission.findOne({
      where: { api_key_id: apiKeyId, smtp_account_id: smtpAccountId },
      transaction: t,
    });
    if (existing) return existing;

    return await ApiKeySmtpPermission.create({
      api_key_id: apiKeyId,
      smtp_account_id: smtpAccountId,
    }, { transaction: t });
  });
}

export async function removeSmtpPermission(apiKeyId: string, smtpAccountId: string) {
  const permission = await ApiKeySmtpPermission.findOne({
    where: { api_key_id: apiKeyId, smtp_account_id: smtpAccountId }
  });
  if (!permission) return false;
  await permission.destroy();
  return true;
}

export async function getSmtpPermissions(apiKeyId: string) {
  return await ApiKeySmtpPermission.findAll({
    where: { api_key_id: apiKeyId }
  });
}
