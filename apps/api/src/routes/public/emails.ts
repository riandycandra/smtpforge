import { Router, Request, Response, NextFunction } from 'express';
import { sendEmailValidator } from '../../validators/emailValidator';
import { validate } from '../../validators/validate';
import { validateSmtpPermission } from '../../middlewares/smtpPermission';
import { sendSuccess, sendError } from '../../utils/response';
import { enqueueEmailJob } from '../../services/emailProducer.service';
import { SmtpAccount, ApiKeySmtpPermission } from '@mailer/database';

const router = Router();

router.post(
  '/',
  sendEmailValidator,
  validate,
  validateSmtpPermission,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKeyId = req.appAuth!.id;
      let smtpAccountId = req.body.smtp_account;

      // Auto-select SMTP account if not provided
      if (!smtpAccountId) {
        // Try to find an account this API key has permission for
        const permission = await ApiKeySmtpPermission.findOne({
          where: { api_key_id: apiKeyId },
          include: [{ model: SmtpAccount, where: { is_active: true } }]
        });

        if (permission) {
          smtpAccountId = permission.smtp_account_id;
        } else {
          // Fallback to any active account if no specific permissions are set
          const fallbackAccount = await SmtpAccount.findOne({ where: { is_active: true } });
          if (!fallbackAccount) {
            return sendError(res, 'No active SMTP accounts available. Please configure one in the dashboard.', [], 503);
          }
          smtpAccountId = fallbackAccount.id;
        }
      }

      // Normalize "to" to an array
      const to = Array.isArray(req.body.to) ? req.body.to : [req.body.to];

      const payload = {
        ...req.body,
        to,
        api_key_id: apiKeyId,
        smtp_account_id: smtpAccountId,
        request_id: req.requestId,
      };

      const emailJob = await enqueueEmailJob(payload);
      
      return sendSuccess(res, {
        message: 'Email queued successfully',
        job_id: emailJob.job_id,
        status: emailJob.status,
      }, 202);
    } catch (error) {
      next(error);
    }
  }
);

export const publicEmailsRouter = router;

