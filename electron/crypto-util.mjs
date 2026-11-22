import crypto from 'crypto';
import fs from 'fs';

export const BACKUP_MAGIC = 'KURUG1';
export const SCRYPT = { N: 16384, r: 8, p: 1, keyLen: 32 };

export function deriveKey(password, salt, params = SCRYPT) {
  const N = params.N ?? SCRYPT.N;
  const r = params.r ?? SCRYPT.r;
  const p = params.p ?? SCRYPT.p;
  const keyLen = params.keyLen ?? SCRYPT.keyLen;
  return crypto.scryptSync(password, salt, keyLen, { N, r, p, maxmem: 64 * 1024 * 1024 });
}

export function encryptJson(obj, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: encrypted.toString('base64'),
  };
}

export function decryptJson(payload, key) {
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const data = Buffer.from(payload.data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const text = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  return JSON.parse(text);
}

export function makeVerifier(key) {
  return crypto.createHmac('sha256', key).update('kurug-unlock-v1').digest('base64');
}

export function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function atomicWrite(filePath, content) {
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, filePath);
}

export function emptyPayload() {
  return {
    widgets: [],
    appSettings: {
      themePreset: 'dark',
      themeVars: null,
      customCss: '',
      importedThemeName: null,
    },
  };
}
