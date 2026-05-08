import { Router } from 'express';
import { sendSuccess, sendError } from '../../utils/response';

export const adminAuthRouter = Router();

adminAuthRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Simple static check as requested: admin/admin
  if (username === 'admin' && password === 'admin') {
    return sendSuccess(res, {
      token: 'admin_token_placeholder',
      user: {
        id: 'placeholder-admin-id',
        username: 'admin',
        role: 'admin'
      }
    });
  }

  return sendError(res, 'Invalid username or password', [], 401);
});
