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
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : []),
  process.env.WEB_URL,
  'http://localhost:3001',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is in the allowed origins list
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    // In development, allow localhost, 127.0.0.1, or private network IP addresses
    if (process.env.NODE_ENV === 'development') {
      if (/^https?:\/\/(localhost|127\.0\.0\.1|::1|\[::1\])(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      // Matches private IPv4 ranges:
      // - 10.x.x.x (10.0.0.0/8)
      // - 172.16.x.x to 172.31.x.x (172.16.0.0/12)
      // - 192.168.x.x (192.168.0.0/16)
      const privateIpRegex = /^https?:\/\/(?:10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/;
      if (privateIpRegex.test(origin)) {
        return callback(null, true);
      }
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
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
