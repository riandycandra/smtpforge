import { Router } from 'express';
import { publicEmailsRouter } from './public/emails';
import { adminSmtpRouter } from './admin/smtp';
import { adminApiKeysRouter } from './admin/api-keys';
import { adminLogsRouter } from './admin/logs';
import { requireAppAuth } from '../middlewares/appAuth';
import { requireAdminAuth } from '../middlewares/adminAuth';
import { appRateLimiter } from '../middlewares/rateLimiter';

export const routes = Router();

// Public App API Routes
const publicApi = Router();
publicApi.use(requireAppAuth);
publicApi.use(appRateLimiter);
publicApi.use('/emails', publicEmailsRouter);

// Admin API Routes
const adminApi = Router();
adminApi.use(requireAdminAuth);
adminApi.use('/smtp', adminSmtpRouter);
adminApi.use('/api-keys', adminApiKeysRouter);
adminApi.use('/logs', adminLogsRouter);

// Mount namespaces
routes.use('/api/v1/admin', adminApi);
routes.use('/api/v1', publicApi);
