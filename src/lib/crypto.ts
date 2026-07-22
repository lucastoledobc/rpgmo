// arquivo: criptografa e descriptografa a chave da API
// local: src/lib/crypto.ts

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET = process.env.ENCRYPTION_SECRET!; // 32 bytes, em .env.local

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(SECRET, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decrypt(encoded: string): string {
  const data = Buffer.from(encoded, 'base64');
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const key = crypto.scryptSync(SECRET, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}