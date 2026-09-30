import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'ssms-dev-secret-change-me';
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

// --- password hashing (scrypt, no native deps) ---
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(pw, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(test, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// --- JWTs ---
// Access token carries identity + the ACTIVE role + all held roles + tier + session id.
export function signAccess(user, activeRole, sid) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      activeRole,
      roles: user.roles,
      tier: user.tier,
      sid,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL },
  );
}

export function signRefresh(user) {
  return jwt.sign({ sub: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TTL });
}

export function verify(token) {
  return jwt.verify(token, JWT_SECRET);
}
