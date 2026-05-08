import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const latency = Date.now() - start;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      latencyMs: latency,
      appId: req.appAuth?.id || null,
      adminId: req.adminAuth?.userId || null,
    };

    if (res.statusCode >= 400) {
      logger.warn('API Request Failed', logData);
    } else {
      logger.info('API Request Success', logData);
    }
  });

  next();
}
