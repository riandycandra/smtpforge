import crypto from 'crypto';

/**
 * Generates a secure random API key with a standard prefix.
 * Example: mlr_live_xxxxxxxxxxxxxxxxx
 */
export function generateApiKey(): string {
  const randomString = crypto.randomBytes(32).toString('hex');
  return `mlr_live_${randomString}`;
}

/**
 * Hashes an API key using SHA-256 for secure storage.
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Timing-safe comparison of a plaintext API key against a stored hash.
 */
export function compareApiKey(apiKey: string, hashedApiKey: string): boolean {
  const hash = hashApiKey(apiKey);
  const hashBuffer = Buffer.from(hash);
  const storedHashBuffer = Buffer.from(hashedApiKey);
  
  if (hashBuffer.length !== storedHashBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(hashBuffer, storedHashBuffer);
}
