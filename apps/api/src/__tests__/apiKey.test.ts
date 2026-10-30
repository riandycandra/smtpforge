import { describe, it, expect } from 'vitest';
import { generateApiKey, hashApiKey, compareApiKey } from '../utils/apiKey';

describe('API Key Cryptography & Validation', () => {
  it('should generate valid prefixed API keys with high entropy', () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();

    expect(key1).toMatch(/^mlr_live_[a-f0-9]{64}$/);
    expect(key2).toMatch(/^mlr_live_[a-f0-9]{64}$/);
    expect(key1).not.toBe(key2);
  });

  it('should compute deterministic SHA-256 hash', () => {
    const key = 'mlr_live_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const hash1 = hashApiKey(key);
    const hash2 = hashApiKey(key);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('should verify matching and non-matching keys with timing safety', () => {
    const rawKey = generateApiKey();
    const storedHash = hashApiKey(rawKey);

    expect(compareApiKey(rawKey, storedHash)).toBe(true);
    expect(compareApiKey(generateApiKey(), storedHash)).toBe(false);
  });
});

