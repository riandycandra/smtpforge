import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt } from '../utils/encryption';

describe('Encryption Utils', () => {
  const originalKey = process.env.SMTP_ENCRYPTION_KEY;
  const validKey = '12345678901234567890123456789012'; // 32 characters

  beforeEach(() => {
    process.env.SMTP_ENCRYPTION_KEY = validKey;
  });

  it('should encrypt and decrypt plaintext accurately', () => {
    const secret = 'super-secret-smtp-password-1234!@#$';
    const encrypted = encrypt(secret);

    expect(encrypted).not.toBe(secret);
    expect(typeof encrypted).toBe('string');

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(secret);
  });

  it('should generate distinct ciphertexts for identical plaintext due to random IV', () => {
    const text = 'identical-password';
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);

    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(text);
    expect(decrypt(enc2)).toBe(text);
  });

  it('should throw an error if SMTP_ENCRYPTION_KEY is missing or invalid length', () => {
    delete process.env.SMTP_ENCRYPTION_KEY;
    expect(() => encrypt('test')).toThrow('Encryption key must be 32 characters long');

    process.env.SMTP_ENCRYPTION_KEY = 'too-short';
    expect(() => encrypt('test')).toThrow('Encryption key must be 32 characters long');
    expect(() => decrypt('test')).toThrow('Encryption key must be 32 characters long');
  });

  it('should throw when ciphertext has been tampered with (GCM authentication check)', () => {
    const original = encrypt('tamper-test');
    const buffer = Buffer.from(original, 'base64');
    // Modify one byte of the encrypted payload
    buffer[buffer.length - 1] ^= 0xff;
    const tampered = buffer.toString('base64');

    expect(() => decrypt(tampered)).toThrow();
  });
});

