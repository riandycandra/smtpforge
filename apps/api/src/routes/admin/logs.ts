import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { validate } from '../../validators/validate';
import { paginationValidator } from '../../validators/adminValidator';
import { getPagination, getPagingData } from '../../utils/pagination';
import * as logsService from '../../services/logs.service';
import { logger } from '../../utils/logger';

const router = Router();

router.get('/', paginationValidator, validate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, page } = getPagination(req);
    
    const filters = {
      status: req.query.status as string,
      api_key_id: req.query.api_key_id as string,
      smtp_account_id: req.query.smtp_account_id as string,
      recipient: req.query.recipient as string,
      subject: req.query.subject as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    const data = await logsService.queryLogs(filters, limit, offset);
    return sendSuccess(res, getPagingData(data, page, limit));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/resend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newJob = await logsService.resendLog(req.params.id);
    logger.info('Admin Action: Resend Triggered', { adminId: req.adminAuth?.userId, originalJobId: req.params.id, newJobId: newJob.id });
    return sendSuccess(res, {
      message: 'Email enqueued for resend',
      new_job_id: newJob.job_id,
      email_job_id: newJob.id,
    }, 201);
  } catch (error: any) {
    if (error.message === 'Email log not found') {
      return sendError(res, 'Email log not found', [], 404);
    }
    next(error);
  }
});

export const adminLogsRouter = router;
