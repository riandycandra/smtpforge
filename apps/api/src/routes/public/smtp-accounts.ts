import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { SmtpAccount, ApiKeySmtpPermission } from '@mailer/database';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKeyId = req.appAuth!.id;

    // Only return active accounts explicitly assigned to this API key
    const permissions = await ApiKeySmtpPermission.findAll({
      where: { api_key_id: apiKeyId },
      include: [{ 
        model: SmtpAccount, 
        where: { is_active: true },
        attributes: ['id', 'name', 'host', 'port', 'from_email', 'from_name']
      }]
    });

    const accounts = permissions
      .map(p => (p as any).SmtpAccount)
      .filter(Boolean);

    return sendSuccess(res, accounts);
  } catch (error) {
    next(error);
  }
});

export const publicSmtpAccountsRouter = router;
