import nodemailer from 'nodemailer';
import { SmtpAccount } from '@mailer/database';
import { decrypt } from '@mailer/database';

const transporterCache = new Map<string, nodemailer.Transporter>();

export async function getTransporter(smtpAccountId: string): Promise<{ transporter: nodemailer.Transporter, fromEmail: string, fromName: string | null }> {
  // If cache is not strictly required, we can create on the fly to avoid stale connections.
  // We recreate them here to avoid stale connections dropping randomly in the background.
  const account = await SmtpAccount.findByPk(smtpAccountId);
  
  if (!account) {
    throw new Error(`SMTP Account ${smtpAccountId} not found`);
  }

  if (!account.is_active) {
    throw new Error(`SMTP Account ${smtpAccountId} is inactive`);
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
    tls: {
      rejectUnauthorized: !account.ignore_tls_errors,
    },
    // Pool allows keeping connection alive, but for simple transactional we just use default
    pool: false, 
  } as any);

  return {
    transporter,
    fromEmail: account.from_email,
    fromName: account.from_name,
  };
}
