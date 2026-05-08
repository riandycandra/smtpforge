import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`\n[FATAL] Missing required environment variable: ${key}`);
    console.error(`Please set ${key} before starting the application.\n`);
    process.exit(1);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

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

  // Security
  SMTP_ENCRYPTION_KEY: requireEnv('SMTP_ENCRYPTION_KEY'),
  
  // App specific limits
  MAX_ATTACHMENT_SIZE_MB: parseInt(process.env.MAX_ATTACHMENT_SIZE_MB || '10', 10),
  RETENTION_DAYS: parseInt(process.env.RETENTION_DAYS || '90', 10),
};

// Post-validation
if (env.SMTP_ENCRYPTION_KEY.length !== 32) {
  console.error('\n[FATAL] SMTP_ENCRYPTION_KEY must be exactly 32 characters long for AES-256-GCM.');
  process.exit(1);
}
