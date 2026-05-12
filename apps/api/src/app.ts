import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestIdMiddleware } from './middlewares/requestId';
import { requestLogger } from './middlewares/logger';
import { errorHandler } from './middlewares/errorHandler';
import { routes } from './routes';
import { healthRouter } from './routes/health';
import { docsRouter } from './routes/docs';

export const app = express();

// Public API docs are intentionally available without authentication.
app.use('/docs', docsRouter);

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Request parsing with oversized payload protection
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Tracking and observability
app.use(requestIdMiddleware);
app.use(requestLogger);

// Mount healthcheck directly at root /health (no auth)
app.use('/health', healthRouter);

// Mount API routes
app.use(routes);

// Centralized error handler
app.use(errorHandler);
