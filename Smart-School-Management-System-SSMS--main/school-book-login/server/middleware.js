import { q } from './db.js';
import { verify } from './auth.js';

const ACTION_COLUMN = {
  read: 'can_read',
  write: 'can_write',
  edit: 'can_edit',
  delete: 'can_delete',
  approve: 'can_approve',
  export: 'can_export',
};

// Verify the access token and attach the decoded identity to req.user.
export async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing_token', message: 'Authentication required.' });
  try {
    req.user = verify(token);
    if (req.user.type === 'refresh') throw new Error('refresh token used as access token');
  } catch {
    return res.status(401).json({ error: 'invalid_token', message: 'Session expired or invalid. Please sign in again.' });
  }
  // Session revocation check (enables real forced logout).
  if (req.user.sid) {
    const { rows } = await q('SELECT revoked, revoked_reason FROM sessions WHERE id=$1', [req.user.sid]);
    if (rows[0]?.revoked) {
      return res.status(401).json({ error: 'session_revoked', message: rows[0].revoked_reason || 'Your session was ended by an administrator.' });
    }
    q('UPDATE sessions SET last_activity=now() WHERE id=$1', [req.user.sid]).catch(() => {});
  }
  next();
}

async function logDenial(req, moduleKey, action, reason) {
  try {
    await q(
      `INSERT INTO audit_denials (user_id, email, active_role, module_key, action, method, path, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [req.user?.sub || null, req.user?.email || null, req.user?.activeRole || null,
       moduleKey, action, req.method, req.originalUrl, reason],
    );
  } catch (e) {
    console.error('audit log failed:', e.message);
  }
}

// Route guard: require `action` on `moduleKey` for the caller's ACTIVE role.
// On denial -> records an audit row and returns 403 with role context.
export function requirePermission(moduleKey, action) {
  const column = ACTION_COLUMN[action];
  return async (req, res, next) => {
    const role = req.user?.activeRole;
    if (!role || !column) {
      await logDenial(req, moduleKey, action, 'no_active_role_or_bad_action');
      return res.status(403).json({ error: 'forbidden', message: 'No active role context.' });
    }
    const { rows } = await q(
      `SELECT ${column} AS allowed FROM role_permissions WHERE role_key=$1 AND module_key=$2`,
      [role, moduleKey],
    );
    const allowed = rows[0]?.allowed === true;
    if (!allowed) {
      const reason = rows.length ? 'flag_false' : 'no_module_grant';
      await logDenial(req, moduleKey, action, reason);
      return res.status(403).json({
        error: 'forbidden',
        role,
        module: moduleKey,
        action,
        message: `Access denied: role '${role}' is not permitted to '${action}' on '${moduleKey}'.`,
      });
    }
    next();
  };
}
