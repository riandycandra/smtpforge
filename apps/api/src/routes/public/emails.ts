import { Router, Request, Response, NextFunction } from 'express';
import { sendEmailValidator } from '../../validators/emailValidator';
import { validate } from '../../validators/validate';
import { validateSmtpPermission } from '../../middlewares/smtpPermission';
import { sendSuccess } from '../../utils/response';
import { enqueueEmailJob } from '../../services/emailProducer.service';

const router = Router();

router.post(
  '/',
  sendEmailValidator,
  validate,
  validateSmtpPermission,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKeyId = req.appAuth!.id;
      const payload = {
        ...req.body,
        api_key_id: apiKeyId,
        smtp_account_id: req.body.smtp_account,
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

