import { EmailJob } from '@mailer/database';
import { Op } from 'sequelize';
import { enqueueEmailJob } from './emailProducer.service';
import { sequelize } from '@mailer/database';

export async function queryLogs(filters: any, limit: number, offset: number) {
  const where: any = {};

  if (filters.status) where.status = filters.status;
  if (filters.api_key_id) where.api_key_id = filters.api_key_id;
  if (filters.smtp_account_id) where.smtp_account_id = filters.smtp_account_id;
  if (filters.subject) where.subject = { [Op.iLike]: `%${filters.subject}%` };
  
  if (filters.recipient) {
    where.to = {
      [Op.contains]: [filters.recipient]
    };
  }

  if (filters.start_date || filters.end_date) {
    where.created_at = {};
    if (filters.start_date) where.created_at[Op.gte] = new Date(filters.start_date);
    if (filters.end_date) where.created_at[Op.lte] = new Date(filters.end_date);
  }

  const result = await EmailJob.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });

  return result;
}

export async function resendLog(id: string) {
  return await sequelize.transaction(async (t) => {
    const originalLog = await EmailJob.findByPk(id, { transaction: t });
    if (!originalLog) {
      throw new Error('Email log not found');
    }

    // Prepare payload
    const payload = {
      api_key_id: originalLog.api_key_id,
      smtp_account_id: originalLog.smtp_account_id,
      to: originalLog.to,
      cc: originalLog.cc || undefined,
      bcc: originalLog.bcc || undefined,
      subject: originalLog.subject,
      html: originalLog.html,
      attachments: originalLog.attachments || undefined,
    };

    // We enqueue via the existing producer. Note that it will create a NEW row.
    // We do NOT mutate the historical record to preserve audit.
    const newJob = await enqueueEmailJob(payload);
    return newJob;
  });
}
