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

import { v4 as uuidv4 } from 'uuid';
import { EmailJob } from '@mailer/database';
import { EMAIL_STATUS } from '@mailer/shared';

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

export async function checkAccountHealth(id: string) {
  const account = await SmtpAccount.findByPk(id);
  if (!account) {
    throw new Error('SMTP Account not found');
  }

  const result = await verifySmtpConnection({
    host: account.host,
    port: account.port,
    secure: account.secure,
    username: account.username,
    password: decrypt(account.password_encrypted),
    ignore_tls_errors: account.ignore_tls_errors,
  });

  const now = new Date();
  if (result.success) {
    account.health_status = 'healthy';
    account.last_health_check_at = now;
    account.last_health_error = null;
    account.last_health_latency_ms = result.latency_ms;
  } else {
    account.health_status = 'unhealthy';
    account.last_health_check_at = now;
    account.last_health_error = result.error || 'Health check failed';
    account.last_health_latency_ms = result.latency_ms;
  }

  await account.save();

  return {
    id: account.id,
    name: account.name,
    health_status: account.health_status,
    latency_ms: account.last_health_latency_ms,
    error: account.last_health_error,
    last_health_check_at: account.last_health_check_at,
  };
}

export async function checkAllAccountsHealth() {
  const accounts = await SmtpAccount.findAll({
    where: { is_active: true },
  });

  const results = await Promise.allSettled(
    accounts.map((acc) => checkAccountHealth(acc.id))
  );

  let healthyCount = 0;
  let unhealthyCount = 0;

  const parsedResults = results.map((res, idx) => {
    if (res.status === 'fulfilled') {
      if (res.value.health_status === 'healthy') healthyCount++;
      else unhealthyCount++;
      return res.value;
    } else {
      unhealthyCount++;
      return {
        id: accounts[idx].id,
        name: accounts[idx].name,
        health_status: 'unhealthy',
        error: res.reason?.message || 'Check failed',
      };
    }
  });

  return {
    total: accounts.length,
    healthy: healthyCount,
    unhealthy: unhealthyCount,
    results: parsedResults,
  };
}

export async function sendTestEmail(id: string, recipientEmail: string) {
  const account = await SmtpAccount.findByPk(id);
  if (!account) {
    throw new Error('SMTP Account not found');
  }

  const password = decrypt(account.password_encrypted);
  const transporter = nodemailer.createTransport({
    host: account.host,
    port: Number(account.port),
    secure: account.secure,
    auth: {
      user: account.username,
      pass: password,
    },
    tls: {
      rejectUnauthorized: !account.ignore_tls_errors,
    },
  });

  const timestamp = new Date().toISOString();
  const fromDisplay = account.from_name ? `"${account.from_name}" <${account.from_email}>` : account.from_email;
  const subject = `[SMTP Forge] Test Email Delivery - ${account.name}`;
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 12px;">
        <h2 style="color: #1e293b; margin: 0; font-size: 20px;">⚡ SMTP Forge - Test Email</h2>
        <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Verifying live email delivery and relay permissions</p>
      </div>
      <p style="color: #334155; font-size: 15px; line-height: 1.5;">
        Congratulations! If you are reading this email, your SMTP configuration is successfully connected, authenticated, and authorized to transmit mail through <strong>${account.name}</strong>.
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; width: 140px;">Account Name:</td>
            <td style="padding: 6px 0;">${account.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Host & Port:</td>
            <td style="padding: 6px 0;">${account.host}:${account.port} (${account.secure ? 'SSL/TLS' : 'STARTTLS/Plain'})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Sender:</td>
            <td style="padding: 6px 0;">${fromDisplay}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Recipient:</td>
            <td style="padding: 6px 0;">${recipientEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Dispatched At:</td>
            <td style="padding: 6px 0;">${timestamp}</td>
          </tr>
        </table>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">
        Sent via SMTP Forge Central Mailer Gateway
      </p>
    </div>
  `;

  const start = Date.now();
  const testJobId = `test-job-${uuidv4()}`;

  try {
    const info = await transporter.sendMail({
      from: fromDisplay,
      to: recipientEmail,
      subject,
      html: htmlContent,
      text: `SMTP Forge Test Email\nAccount: ${account.name}\nHost: ${account.host}:${account.port}\nRecipient: ${recipientEmail}\nTimestamp: ${timestamp}`,
    });

    const latencyMs = Date.now() - start;

    // Log in database as EmailJob for audit trail
    await EmailJob.create({
      job_id: testJobId,
      api_key_id: null,
      smtp_account_id: account.id,
      to: [recipientEmail],
      subject,
      html: htmlContent,
      status: EMAIL_STATUS.SENT,
      smtp_response: info.response,
      latency_ms: latencyMs,
      sent_at: new Date(),
      retry_count: 0,
    });

    // Update account health status
    account.health_status = 'healthy';
    account.last_health_check_at = new Date();
    account.last_health_latency_ms = latencyMs;
    account.last_health_error = null;
    await account.save();

    return {
      success: true,
      job_id: testJobId,
      message_id: info.messageId,
      response: info.response,
      latency_ms: latencyMs,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - start;

    // Log failure in EmailJob for audit trail
    await EmailJob.create({
      job_id: testJobId,
      api_key_id: null,
      smtp_account_id: account.id,
      to: [recipientEmail],
      subject,
      html: htmlContent,
      status: EMAIL_STATUS.FAILED,
      error_message: error.message || 'Send test email failed',
      latency_ms: latencyMs,
      retry_count: 0,
    });

    // Update account health status
    account.health_status = 'unhealthy';
    account.last_health_check_at = new Date();
    account.last_health_latency_ms = latencyMs;
    account.last_health_error = error.message;
    await account.save();

    return {
      success: false,
      job_id: testJobId,
      error: error.message || 'Unknown SMTP error during transmission',
      latency_ms: latencyMs,
    };
  }
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
