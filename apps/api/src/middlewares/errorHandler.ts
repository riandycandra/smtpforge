import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error('Unhandled Exception', {
    requestId: req.requestId,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle expected operational errors
  if (err.status && err.status < 500) {
    return sendError(res, err.message, err.errors || [], err.status);
  }

  // Handle syntax errors (e.g., malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    return sendError(res, 'Malformed JSON payload', [], 400);
  }

  // Generic internal server error
  return sendError(res, 'Internal Server Error', [], 500);
}
