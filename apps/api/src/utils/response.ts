import { Response } from 'express';

export function sendSuccess(res: Response, data: any = {}, statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendError(res: Response, message: string, errors: any[] = [], statusCode: number = 400) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
