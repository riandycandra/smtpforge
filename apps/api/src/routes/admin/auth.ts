import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AdminUser } from '@mailer/database';
import { sendSuccess, sendError } from '../../utils/response';
import { env } from '../../config/env';
import { requireAdminAuth } from '../../middlewares/adminAuth';

export const adminAuthRouter = Router();

const SALT_ROUNDS = 12;
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin';

/**
 * Ensures a default admin user exists in the database.
 * Called once during API bootstrap.
 */
export async function seedDefaultAdmin(): Promise<void> {
  const existing = await AdminUser.findOne({ where: { username: DEFAULT_USERNAME } });
  if (!existing) {
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    await AdminUser.create({
      username: DEFAULT_USERNAME,
      password_hash: hash,
      must_change_password: true,
    });
  }
}

/**
 * GET /api/v1/admin/auth/status
 * Public endpoint to check if the system is in its default setup state.
 */
adminAuthRouter.get('/status', async (req, res) => {
  try {
    const defaultAdmin = await AdminUser.findOne({ where: { username: DEFAULT_USERNAME } });
    return sendSuccess(res, {
      isDefaultState: !!(defaultAdmin && defaultAdmin.must_change_password),
    });
  } catch (error) {
    return sendSuccess(res, { isDefaultState: false });
  }
});

/**
 * POST /api/v1/admin/auth/login
 * Authenticate admin user and return a JWT.
 * If the user still has the default password, the response includes `must_change_password: true`.
 */
adminAuthRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, 'Username and password are required', [], 400);
    }

    const user = await AdminUser.findOne({ where: { username } });
    if (!user) {
      return sendError(res, 'Invalid username or password', [], 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return sendError(res, 'Invalid username or password', [], 401);
    }

    const jwtSecret = env.JWT_SECRET || process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
    
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roles: ['admin'],
      },
      jwtSecret as string,
      { expiresIn: (env.JWT_EXPIRY || '24h') as jwt.SignOptions['expiresIn'] }
    );

    return sendSuccess(res, {
      token,
      must_change_password: user.must_change_password,
      user: {
        id: user.id,
        username: user.username,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return sendError(res, 'An internal error occurred during login', [], 500);
  }
});

/**
 * POST /api/v1/admin/auth/change-password
 * Requires a valid JWT. Allows the admin to set a new password.
 * Clears the `must_change_password` flag after successful change.
 */
adminAuthRouter.post('/change-password', requireAdminAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return sendError(res, 'Current password and new password are required', [], 400);
    }

    if (new_password.length < 8) {
      return sendError(res, 'New password must be at least 8 characters long', [], 400);
    }

    if (current_password === new_password) {
      return sendError(res, 'New password must be different from current password', [], 400);
    }

    const user = await AdminUser.findByPk(req.adminAuth!.userId);
    if (!user) {
      return sendError(res, 'User not found', [], 404);
    }

    const passwordMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!passwordMatch) {
      return sendError(res, 'Current password is incorrect', [], 401);
    }

    const newHash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await user.update({
      password_hash: newHash,
      must_change_password: false,
    });

    // Issue a fresh token (no longer flagged)
    const jwtSecret = env.JWT_SECRET || process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roles: ['admin'],
      },
      jwtSecret as string,
      { expiresIn: (env.JWT_EXPIRY || '24h') as jwt.SignOptions['expiresIn'] }
    );

    return sendSuccess(res, {
      message: 'Password changed successfully',
      token,
    });
  } catch (error) {
    console.error('[AUTH] Change password error:', error);
    return sendError(res, 'An internal error occurred', [], 500);
  }
});
