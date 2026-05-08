"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const logger_1 = require("./logger");
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY = env_1.env.SMTP_ENCRYPTION_KEY;
if (!KEY || Buffer.from(KEY).length !== 32) {
    logger_1.logger.warn('SMTP_ENCRYPTION_KEY is not set or not exactly 32 bytes. Encryption may fail or be insecure.');
}
/**
 * Encrypts a plaintext string using AES-256-GCM.
 */
function encrypt(text) {
    if (!text)
        return text;
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const salt = crypto_1.default.randomBytes(SALT_LENGTH);
    const keyBuffer = Buffer.from(KEY);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, keyBuffer, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}
/**
 * Decrypts a base64 encoded AES-256-GCM encrypted string.
 */
function decrypt(encryptedText) {
    if (!encryptedText)
        return encryptedText;
    const buffer = Buffer.from(encryptedText, 'base64');
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const keyBuffer = Buffer.from(KEY);
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
}
