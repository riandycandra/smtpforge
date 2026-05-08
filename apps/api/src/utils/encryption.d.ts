/**
 * Encrypts a plaintext string using AES-256-GCM.
 */
export declare function encrypt(text: string): string;
/**
 * Decrypts a base64 encoded AES-256-GCM encrypted string.
 */
export declare function decrypt(encryptedText: string): string;
