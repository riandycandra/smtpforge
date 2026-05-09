import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { SmtpAccount, ApiKeySmtpPermission } from '@mailer/database';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKeyId = req.appAuth!.id;

    // Check if there are specific permissions for this API key
    const permissions = await ApiKeySmtpPermission.findAll({
      where: { api_key_id: apiKeyId },
      include: [{ 
        model: SmtpAccount, 
        where: { is_active: true },
        attributes: ['id', 'name', 'host', 'port', 'from_email', 'from_name']
      }]
    });

    if (permissions.length > 0) {
      const accounts = permissions.map(p => (p as any).SmtpAccount);
      return sendSuccess(res, accounts);
    }

    // Fallback: If no specific permissions are set, all active accounts are available
    const accounts = await SmtpAccount.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'host', 'port', 'from_email', 'from_name']
    });

    return sendSuccess(res, accounts);
  } catch (error) {
    next(error);
  }
});

export const publicSmtpAccountsRouter = router;
