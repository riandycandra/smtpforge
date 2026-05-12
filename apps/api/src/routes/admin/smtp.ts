import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { smtpCreateValidator, smtpUpdateValidator, smtpTestValidator, paginationValidator } from '../../validators/adminValidator';
import { validate } from '../../validators/validate';
import { getPagination, getPagingData } from '../../utils/pagination';
import * as smtpService from '../../services/smtp.service';
import { logger } from '../../utils/logger';

const router = Router();

router.get('/', paginationValidator, validate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, page } = getPagination(req);
    const data = await smtpService.getSmtpAccounts(limit, offset);
    return sendSuccess(res, getPagingData(data, page, limit));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await smtpService.getSmtpAccount(req.params.id);
    if (!data) return sendError(res, 'SMTP Account not found', [], 404);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
});

router.post('/', smtpCreateValidator, validate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await smtpService.createSmtpAccount(req.body);
    logger.info('Admin Action: SMTP created', { adminId: req.adminAuth?.userId, entityId: data.id });
    return sendSuccess(res, data, 201);
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'SMTP Account name must be unique', [], 400);
    }
    next(error);
  }
});

router.post('/test', smtpTestValidator, validate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await smtpService.testSmtpConnectionConfig(req.body);
    logger.info('Admin Action: SMTP draft tested', { adminId: req.adminAuth?.userId, success: result.success });
    if (!result.success) {
      return sendError(res, result.error || 'Test failed', [{ latency: result.latency_ms }], 400);
    }
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', smtpUpdateValidator, validate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await smtpService.updateSmtpAccount(req.params.id, req.body);
    if (!data) return sendError(res, 'SMTP Account not found', [], 404);
    logger.info('Admin Action: SMTP updated', { adminId: req.adminAuth?.userId, entityId: req.params.id });
    return sendSuccess(res, data);
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'SMTP Account name must be unique', [], 400);
    }
    next(error);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await smtpService.deleteSmtpAccount(req.params.id);
    if (!success) return sendError(res, 'SMTP Account not found', [], 404);
    logger.info('Admin Action: SMTP deleted', { adminId: req.adminAuth?.userId, entityId: req.params.id });
    return sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await smtpService.testSmtpConnection(req.params.id);
    logger.info('Admin Action: SMTP tested', { adminId: req.adminAuth?.userId, entityId: req.params.id, success: result.success });
    if (!result.success) {
      return sendError(res, result.error || 'Test failed', [{ latency: result.latency_ms }], 400);
    }
    return sendSuccess(res, result);
  } catch (error: any) {
    if (error.message === 'SMTP Account not found') {
      return sendError(res, 'SMTP Account not found', [], 404);
    }
    next(error);
  }
});

export const adminSmtpRouter = router;
