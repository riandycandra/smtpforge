import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { ApiKeySmtpPermission } from '@mailer/database';

export async function validateSmtpPermission(req: Request, res: Response, next: NextFunction) {
  const { smtp_account } = req.body;
  const apiKeyId = req.appAuth?.id;

  if (!apiKeyId) {
    return sendError(res, 'Unauthorized context', [], 401);
  }

  if (!smtp_account) {
    // Let express-validator handle missing fields later, but we need it here
    return next();
  }

  try {
    const permission = await ApiKeySmtpPermission.findOne({
      where: {
        api_key_id: apiKeyId,
        smtp_account_id: smtp_account,
      }
    });

    if (!permission) {
      return sendError(res, 'This API Key does not have permission to use the requested SMTP account', [], 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}
