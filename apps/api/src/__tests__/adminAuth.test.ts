import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { requireAdminAuth } from '../middlewares/adminAuth';

describe('Admin Authentication Middleware', () => {
  const secret = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';

  function createMockContext(authHeader?: string) {
    const req: any = {
      headers: authHeader ? { authorization: authHeader } : {},
    };
    const res: any = {
      statusCode: 200,
      jsonData: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.jsonData = data;
        return this;
      },
    };
    const next = vi.fn();
    return { req, res, next };
  }

  it('should reject requests without Authorization header with 401', async () => {
    const { req, res, next } = createMockContext();

    await requireAdminAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.jsonData.success).toBe(false);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject malformed Authorization headers (not starting with Bearer)', async () => {
    const { req, res, next } = createMockContext('Basic 12345');

    await requireAdminAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should accept valid JWT and attach admin user to request', async () => {
    const token = jwt.sign(
      { userId: 'admin-uuid-1', username: 'admin', roles: ['admin'] },
      secret,
      { expiresIn: '1h' }
    );
    const { req, res, next } = createMockContext(`Bearer ${token}`);

    await requireAdminAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.adminAuth).toBeDefined();
    expect(req.adminAuth.userId).toBe('admin-uuid-1');
  });

  it('should reject expired JWT tokens with 401', async () => {
    const expiredToken = jwt.sign(
      { userId: 'admin-uuid-1', username: 'admin', roles: ['admin'] },
      secret,
      { expiresIn: '-1s' }
    );
    const { req, res, next } = createMockContext(`Bearer ${expiredToken}`);

    await requireAdminAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject forged JWT signed with an invalid secret', async () => {
    const forgedToken = jwt.sign(
      { userId: 'admin-uuid-1', username: 'admin', roles: ['admin'] },
      'wrong-secret'
    );
    const { req, res, next } = createMockContext(`Bearer ${forgedToken}`);

    await requireAdminAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});

