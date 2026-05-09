import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response';
import { env } from '../config/env';

interface JwtPayload {
  userId: string;
  username: string;
  roles: string[];
}

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
    const jwtSecret = (env.JWT_SECRET || process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production') as string;
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    req.adminAuth = {
      userId: decoded.userId,
      roles: decoded.roles,
    };

    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', [], 401);
  }
}
