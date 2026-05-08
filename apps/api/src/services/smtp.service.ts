import { SmtpAccount } from '@mailer/database';
import { encrypt, decrypt } from '@mailer/database';
import nodemailer from 'nodemailer';

export async function createSmtpAccount(data: any) {
  const payload = { ...data };
  if (payload.password) {
    payload.password_encrypted = encrypt(payload.password);
    delete payload.password;
  }
  const account = await SmtpAccount.create(payload);
  return omitSecrets(account.toJSON());
}

export async function getSmtpAccounts(limit: number, offset: number) {
  const result = await SmtpAccount.findAndCountAll({
    limit,
    offset,
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['password_encrypted'] },
  });
  return result;
}

export async function getSmtpAccount(id: string) {
  const account = await SmtpAccount.findByPk(id, {
    attributes: { exclude: ['password_encrypted'] }
  });
  return account ? account.toJSON() : null;
}

export async function updateSmtpAccount(id: string, data: any) {
  const account = await SmtpAccount.findByPk(id);
  if (!account) return null;

  const payload = { ...data };
  if (payload.password) {
    payload.password_encrypted = encrypt(payload.password);
    delete payload.password;
  }

  await account.update(payload);
  return omitSecrets(account.toJSON());
}

export async function deleteSmtpAccount(id: string) {
  const account = await SmtpAccount.findByPk(id);
  if (!account) return false;
  await account.destroy();
  return true;
}

export async function testSmtpConnection(id: string) {
  const account = await SmtpAccount.findByPk(id);
  if (!account) {
    throw new Error('SMTP Account not found');
  }

  const decryptedPassword = decrypt(account.password_encrypted);

  const transporter = nodemailer.createTransport({
    host: account.host,
    port: account.port,
    secure: account.secure,
    auth: {
      user: account.username,
      pass: decryptedPassword,
    },
  });

  const start = Date.now();
  try {
    await transporter.verify();
    return {
      success: true,
      latency_ms: Date.now() - start,
    };
  } catch (error: any) {
    return {
      success: false,
      latency_ms: Date.now() - start,
      error: `Connection failed: ${error.message || 'Unknown error'}`,
    };
  }
}

function omitSecrets(account: any) {
  const { password_encrypted, ...rest } = account;
  return rest;
}
