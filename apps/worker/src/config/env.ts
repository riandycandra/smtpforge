import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`\n[FATAL] Worker missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DB_HOST: requireEnv('DB_HOST'),
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER: requireEnv('DB_USER'),
  DB_PASSWORD: requireEnv('DB_PASSWORD'),
  DB_NAME: requireEnv('DB_NAME'),
  
  // Redis
  REDIS_HOST: requireEnv('REDIS_HOST'),
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),

  // Security
  SMTP_ENCRYPTION_KEY: requireEnv('SMTP_ENCRYPTION_KEY'),
  
  // Worker config
  WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY || '10', 10),
  DOWNLOAD_TIMEOUT_MS: parseInt(process.env.DOWNLOAD_TIMEOUT_MS || '15000', 10),
};

// Post-validation
if (env.SMTP_ENCRYPTION_KEY.length !== 32) {
  console.error('\n[FATAL] SMTP_ENCRYPTION_KEY must be exactly 32 characters long.');
  process.exit(1);
}
