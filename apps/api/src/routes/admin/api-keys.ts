import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { apiKeyCreateValidator, apiKeyUpdateValidator, assignPermissionValidator, paginationValidator } from '../../validators/adminValidator';
import { validate } from '../../validators/validate';
import { getPagination, getPagingData } from '../../utils/pagination';
import * as apiKeyService from '../../services/apiKey.service';
import { logger } from '../../utils/logger';

const router = Router();

router.get('/', paginationValidator, validate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, page } = getPagination(req);
    const data = await apiKeyService.getApiKeys(limit, offset);
    return sendSuccess(res, getPagingData(data, page, limit));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await apiKeyService.getApiKey(req.params.id);
    if (!data) return sendError(res, 'API Key not found', [], 404);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
});

router.post('/', apiKeyCreateValidator, validate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await apiKeyService.createApiKey(req.body);
    logger.info('Admin Action: API Key created', { adminId: req.adminAuth?.userId, entityId: data.id });
    return sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', apiKeyUpdateValidator, validate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await apiKeyService.updateApiKey(req.params.id, req.body);
    if (!data) return sendError(res, 'API Key not found', [], 404);
    logger.info('Admin Action: API Key updated', { adminId: req.adminAuth?.userId, entityId: req.params.id });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await apiKeyService.deleteApiKey(req.params.id);
    if (!success) return sendError(res, 'API Key not found', [], 404);
    logger.info('Admin Action: API Key deleted', { adminId: req.adminAuth?.userId, entityId: req.params.id });
    return sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
});

// Permissions Management
router.get('/:id/smtp-permissions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await apiKeyService.getSmtpPermissions(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/smtp-permissions', assignPermissionValidator, validate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await apiKeyService.assignSmtpPermission(req.params.id, req.body.smtp_account_id);
    logger.info('Admin Action: SMTP Permission Assigned', { adminId: req.adminAuth?.userId, apiKeyId: req.params.id, smtpId: req.body.smtp_account_id });
    return sendSuccess(res, data, 201);
  } catch (error: any) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return sendError(res, 'API Key or SMTP Account does not exist', [], 400);
    }
    next(error);
  }
});

router.delete('/:id/smtp-permissions/:smtpId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await apiKeyService.removeSmtpPermission(req.params.id, req.params.smtpId);
    if (!success) return sendError(res, 'Permission not found', [], 404);
    logger.info('Admin Action: SMTP Permission Removed', { adminId: req.adminAuth?.userId, apiKeyId: req.params.id, smtpId: req.params.smtpId });
    return sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
});

export const adminApiKeysRouter = router;
