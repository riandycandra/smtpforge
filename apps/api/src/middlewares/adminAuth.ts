import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Missing or invalid Authorization header', [], 401);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Bearer token is missing', [], 401);
  }

  try {
    // Phase 3: Foundation only. Do NOT implement actual JWT validation yet.
    // In the future:
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // For now, we simulate success if the token is "admin_token_placeholder" just to allow basic flow testing
    // In production Phase X, replace with real JWT validation
    if (token !== 'admin_token_placeholder' && process.env.NODE_ENV !== 'development') {
        return sendError(res, 'Invalid token', [], 401);
    }

    req.adminAuth = {
      userId: 'placeholder-admin-id',
      roles: ['admin'],
    };

    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', [], 401);
  }
}
