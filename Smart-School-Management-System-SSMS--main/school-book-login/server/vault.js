import crypto from 'node:crypto';

// AES-256-GCM encryption for the integration credentials vault.
// Key derived from env VAULT_KEY (dev default provided).
const KEY = crypto.createHash('sha256')
  .update(process.env.VAULT_KEY || 'ssms-dev-vault-key-change-me')
  .digest();

export function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decrypt(blob) {
  try {
    const [ivH, tagH, dataH] = String(blob).split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivH, 'hex'));
    decipher.setAuthTag(Buffer.from(tagH, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(dataH, 'hex')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

// Mask a secret for display: show last 4 chars only.
export function mask(secret) {
  if (!secret) return '';
  const s = String(secret);
  return s.length <= 4 ? '••••' : '••••••••' + s.slice(-4);
}
