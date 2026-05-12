import { SmtpAccount } from '@mailer/database';
import { encrypt, decrypt } from '@mailer/database';
import nodemailer from 'nodemailer';

type SmtpConnectionConfig = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  ignore_tls_errors?: boolean;
};

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

  return verifySmtpConnection({
    host: account.host,
    port: account.port,
    secure: account.secure,
    username: account.username,
    password: decrypt(account.password_encrypted),
    ignore_tls_errors: account.ignore_tls_errors,
  });
}

export async function testSmtpConnectionConfig(config: SmtpConnectionConfig) {
  return verifySmtpConnection(config);
}

async function verifySmtpConnection(config: SmtpConnectionConfig) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    tls: {
      rejectUnauthorized: !config.ignore_tls_errors,
    }
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
