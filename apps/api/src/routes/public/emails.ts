import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validate } from '../../validators/validate';
import { validateSmtpPermission } from '../../middlewares/smtpPermission';
import { sendSuccess, sendError } from '../../utils/response';
import { enqueueEmailJob } from '../../services/emailProducer.service';
import { SmtpAccount, ApiKeySmtpPermission } from '@mailer/database';

const router = Router();

const sendEmailValidator = [
  body('smtp_account')
    .optional()
    .isUUID()
    .withMessage('smtp_account must be a valid UUID'),

  body('to')
    .notEmpty()
    .withMessage('to is required')
    .custom((value) => {
      if (Array.isArray(value)) {
        if (value.length === 0) throw new Error('to array must have at least one recipient');
        return value.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      }
      if (typeof value === 'string') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      return false;
    })
    .withMessage('to must be a valid email string or an array of valid email addresses'),

  body('cc')
    .optional()
    .isArray()
    .withMessage('cc must be an array'),
  body('cc.*')
    .isEmail()
    .withMessage('All items in cc array must be valid email addresses')
    .isLength({ max: 255 }),

  body('bcc')
    .optional()
    .isArray()
    .withMessage('bcc must be an array'),
  body('bcc.*')
    .isEmail()
    .withMessage('All items in bcc array must be valid email addresses')
    .isLength({ max: 255 }),

  body('subject')
    .notEmpty()
    .withMessage('subject is required')
    .isString()
    .isLength({ max: 500 }),

  body('html')
    .notEmpty()
    .withMessage('html is required')
    .isString()
    .isLength({ max: 5242880 }), // 5MB max length for HTML body

  body('attachments')
    .optional()
    .isArray()
    .withMessage('attachments must be an array'),
  body('attachments.*.filename')
    .notEmpty()
    .withMessage('attachment filename is required')
    .isString()
    .isLength({ max: 255 }),
  body('attachments.*.url')
    .notEmpty()
    .withMessage('attachment url is required')
    .isURL()
    .withMessage('attachment url must be a valid URL'),
];

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

