/**
 * crypto.util.js
 * AES-256-GCM encryption and decryption utility for storing sensitive tokens (e.g. Google OAuth refresh token).
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES-GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from ENCRYPTION_KEY or JWT_SECRET
 */
function getDerivedKey() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'opptrack-default-secure-secret-key-32b';
  return crypto.createHash('sha256').update(String(secret)).digest();
}

/**
 * Encrypts a string into iv:authTag:encryptedHex format
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted string
 */
function encrypt(text) {
  if (!text) return '';
  const key = getDerivedKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string formatted as iv:authTag:encryptedHex
 * @param {string} cipherText - Encrypted string
 * @returns {string} Plain text
 */
function decrypt(cipherText) {
  if (!cipherText) return '';
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getDerivedKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
};
