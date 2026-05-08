import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { ApiKey } from '@mailer/database';
import { hashApiKey, compareApiKey } from '../utils/apiKey';

export async function requireAppAuth(req: Request, res: Response, next: NextFunction) {
  const apiKeyHeader = req.headers['x-mailer-api-key'];

  if (!apiKeyHeader || typeof apiKeyHeader !== 'string') {
    return sendError(res, 'Missing or invalid X-Mailer-Api-Key header', [], 401);
  }

  try {
    const hashedKey = hashApiKey(apiKeyHeader);
    
    // We search by the hash, as the hash is deterministic
    const apiKeyRecord = await ApiKey.findOne({
      where: { api_key_hash: hashedKey }
    });

    if (!apiKeyRecord) {
      return sendError(res, 'Invalid API Key', [], 401);
    }

    if (!apiKeyRecord.is_active) {
      return sendError(res, 'API Key is inactive', [], 403);
    }

    // Attach to context
    req.appAuth = {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      rate_limit_per_hour: apiKeyRecord.rate_limit_per_hour,
    };

    next();
  } catch (error) {
    next(error);
  }
}
