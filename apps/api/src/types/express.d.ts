import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      appAuth?: {
        id: string;
        name: string;
        rate_limit_per_hour: number | null;
      };
      adminAuth?: {
        userId: string;
        roles: string[];
      };
    }
  }
}
