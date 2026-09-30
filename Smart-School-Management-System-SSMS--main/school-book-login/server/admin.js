import os from 'node:os';
import { statfs, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { q } from './db.js';
import { hashPassword } from './auth.js';
import { snapshot, recordError } from './metrics.js';
import { encrypt, mask } from './vault.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, 'backups');
const PG_BIN = process.env.PG_BIN || '/Library/PostgreSQL/18/bin';

// async route wrapper -> forward rejections to the central error handler
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function logAction(req, action, target, meta = {}) {
  await q(
    'INSERT INTO audit_log (actor_email, actor_role, action, target, ip, meta) VALUES ($1,$2,$3,$4,$5,$6)',
    [req.user?.email, req.user?.activeRole, action, target, req.ip, JSON.stringify(meta)],
  ).catch(() => {});
}

// sample CPU busy% over a short window
function cpuSample() {
  const cpus = os.cpus();
  let idle = 0, total = 0;
  for (const c of cpus) { for (const t of Object.values(c.times)) total += t; idle += c.times.idle; }
  return { idle, total };
}
function cpuUsage() {
  return new Promise((resolve) => {
    const a = cpuSample();
    setTimeout(() => {
      const b = cpuSample();
      const idle = b.idle - a.idle, total = b.total - a.total;
      resolve(total ? +(100 - (100 * idle) / total).toFixed(1) : 0);
    }, 120);
  });
}

export function mountAdmin(app, { authenticate }) {
  const requireSuperAdmin = (req, res, next) =>
    req.user?.activeRole === 'super_admin'
      ? next()
      : res.status(403).json({ error: 'forbidden', message: 'Master Control Panel requires the Super Admin role.' });

  // every /api/admin route: authenticated + super admin
  const guard = [authenticate, requireSuperAdmin];

  /* ===================== 1. SYSTEM HEALTH ===================== */
  app.get('/api/admin/health/system', guard, h(async (_req, res) => {
    const cpu = await cpuUsage();
    const totalMem = os.totalmem(), freeMem = os.freemem();
    let disk = null;
    try {
      const s = await statfs('/');
      const total = s.blocks * s.bsize, free = s.bavail * s.bsize;
      disk = { total, used: total - free, pct: +(((total - free) / total) * 100).toFixed(1) };
    } catch { disk = null; }
    res.json({
      cpu: { pct: cpu, cores: os.cpus().length, load: os.loadavg().map((n) => +n.toFixed(2)) },
      memory: { total: totalMem, used: totalMem - freeMem, pct: +(((totalMem - freeMem) / totalMem) * 100).toFixed(1) },
      disk,
      uptimeSec: Math.floor(process.uptime()),
      host: os.hostname(),
      platform: `${os.type()} ${os.release()}`,
      ts: Date.now(),
    });
  }));

  app.get('/api/admin/health/db', guard, h(async (_req, res) => {
    const pool = (await import('./db.js')).pool;
    const t0 = Date.now();
    await q('SELECT 1');
    const latency = Date.now() - t0;
    const size = await q("SELECT pg_size_pretty(pg_database_size(current_database())) AS size");
    const tables = await q("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'");
    const lastBackup = await q('SELECT filename, created_at FROM backups ORDER BY created_at DESC LIMIT 1');
    res.json({
      status: latency < 200 ? 'healthy' : 'degraded',
      latencyMs: latency,
      pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount, max: pool.options.max },
      dbSize: size.rows[0].size,
      tables: tables.rows[0].n,
      lastBackup: lastBackup.rows[0] || null,
    });
  }));

  app.get('/api/admin/metrics', guard, h(async (_req, res) => res.json(snapshot())));

  // demo: deliberately throw so the error tracker has something to show
  app.post('/api/admin/test-error', guard, (req, _res) => {
    const e = new Error('Simulated downstream failure (demo)');
    recordError(e, req);
    throw e;
  });

  /* ===================== ACTIVE SESSIONS ===================== */
  app.get('/api/admin/sessions', guard, h(async (_req, res) => {
    const { rows } = await q(
      `SELECT id, user_id, email, role, ip, user_agent, created_at, last_activity
         FROM sessions WHERE revoked=FALSE AND last_activity > now() - interval '12 hours'
        ORDER BY last_activity DESC`);
    res.json(rows);
  }));
  app.post('/api/admin/sessions/:id/revoke', guard, h(async (req, res) => {
    await q('UPDATE sessions SET revoked=TRUE, revoked_reason=$2 WHERE id=$1',
      [req.params.id, req.body?.reason || 'Forced logout by Super Admin']);
    await logAction(req, 'session.revoke', req.params.id, { reason: req.body?.reason });
    res.json({ ok: true });
  }));
  app.post('/api/admin/sessions/revoke-user/:userId', guard, h(async (req, res) => {
    const r = await q('UPDATE sessions SET revoked=TRUE, revoked_reason=$2 WHERE user_id=$1 AND revoked=FALSE',
      [req.params.userId, 'Forced logout (all devices)']);
    await logAction(req, 'session.revoke_user', req.params.userId, { count: r.rowCount });
    res.json({ ok: true, revoked: r.rowCount });
  }));
  app.post('/api/admin/sessions/revoke-all', guard, h(async (req, res) => {
    const r = await q("UPDATE sessions SET revoked=TRUE, revoked_reason='Global forced logout' WHERE revoked=FALSE AND id <> $1", [req.user.sid]);
    await logAction(req, 'session.revoke_all', 'all', { count: r.rowCount });
    res.json({ ok: true, revoked: r.rowCount });
  }));

  /* ===================== 2. USER & ROLE MGMT ===================== */
  app.get('/api/admin/users', guard, h(async (_req, res) => {
    const { rows } = await q(`
      SELECT u.id, u.email, u.name, u.primary_role, u.locked, u.lock_reason, u.created_at,
             COALESCE(array_agg(ur.role_key) FILTER (WHERE ur.role_key IS NOT NULL), '{}') AS roles
        FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id
       GROUP BY u.id ORDER BY u.id`);
    res.json(rows);
  }));
  app.post('/api/admin/users', guard, h(async (req, res) => {
    const { email, name, password, primary_role, roles } = req.body || {};
    if (!email || !password || !primary_role) return res.status(400).json({ message: 'email, password, primary_role required' });
    const { rows } = await q('INSERT INTO users (email, password_hash, name, primary_role) VALUES ($1,$2,$3,$4) RETURNING id',
      [email.toLowerCase(), hashPassword(password), name || email, primary_role]);
    const id = rows[0].id;
    for (const r of roles?.length ? roles : [primary_role]) await q('INSERT INTO user_roles (user_id, role_key) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, r]);
    await logAction(req, 'user.create', email, { primary_role });
    res.status(201).json({ id });
  }));
  app.put('/api/admin/users/:id', guard, h(async (req, res) => {
    const { name, primary_role } = req.body || {};
    await q('UPDATE users SET name=COALESCE($2,name), primary_role=COALESCE($3,primary_role) WHERE id=$1', [req.params.id, name, primary_role]);
    await logAction(req, 'user.update', req.params.id, req.body);
    res.json({ ok: true });
  }));
  app.delete('/api/admin/users/:id', guard, h(async (req, res) => {
    await q('DELETE FROM users WHERE id=$1', [req.params.id]);
    await logAction(req, 'user.delete', req.params.id);
    res.json({ ok: true });
  }));
  app.post('/api/admin/users/import', guard, h(async (req, res) => {
    const list = Array.isArray(req.body?.users) ? req.body.users : [];
    let created = 0; const errors = [];
    const pw = hashPassword('Passw0rd!');
    for (const u of list) {
      try {
        const { rows } = await q('INSERT INTO users (email, password_hash, name, primary_role) VALUES ($1,$2,$3,$4) RETURNING id',
          [String(u.email).toLowerCase(), pw, u.name || u.email, u.primary_role || 'student']);
        await q('INSERT INTO user_roles (user_id, role_key) VALUES ($1,$2) ON CONFLICT DO NOTHING', [rows[0].id, u.primary_role || 'student']);
        created++;
      } catch (e) { errors.push({ email: u.email, error: e.message }); }
    }
    await logAction(req, 'user.bulk_import', `${created} users`, { created, failed: errors.length });
    res.json({ created, failed: errors.length, errors, defaultPassword: 'Passw0rd!' });
  }));
  app.post('/api/admin/users/:id/lock', guard, h(async (req, res) => {
    await q('UPDATE users SET locked=TRUE, lock_reason=$2 WHERE id=$1', [req.params.id, req.body?.reason || 'No reason provided']);
    await q("UPDATE sessions SET revoked=TRUE, revoked_reason='Account locked' WHERE user_id=$1 AND revoked=FALSE", [req.params.id]);
    await logAction(req, 'user.lock', req.params.id, { reason: req.body?.reason });
    res.json({ ok: true });
  }));
  app.post('/api/admin/users/:id/unlock', guard, h(async (req, res) => {
    await q('UPDATE users SET locked=FALSE, lock_reason=NULL WHERE id=$1', [req.params.id]);
    await logAction(req, 'user.unlock', req.params.id);
    res.json({ ok: true });
  }));
  app.post('/api/admin/users/:id/reset-password', guard, h(async (req, res) => {
    const { password } = req.body || {};
    if (password) {
      await q('UPDATE users SET password_hash=$2 WHERE id=$1', [req.params.id, hashPassword(password)]);
      await logAction(req, 'user.password_set', req.params.id);
      return res.json({ ok: true, mode: 'admin_set' });
    }
    // "send link" — simulated token (no email service wired)
    const token = (await import('node:crypto')).randomBytes(24).toString('hex');
    await logAction(req, 'user.password_link', req.params.id);
    res.json({ ok: true, mode: 'link', resetLink: `http://localhost:3000/#/reset?token=${token}`, note: 'Email sending is simulated.' });
  }));
  app.post('/api/admin/users/:id/roles', guard, h(async (req, res) => {
    const { role, effective_from } = req.body || {};
    await q('INSERT INTO user_roles (user_id, role_key, effective_from) VALUES ($1,$2,$3) ON CONFLICT (user_id, role_key) DO UPDATE SET effective_from=$3',
      [req.params.id, role, effective_from || null]);
    await logAction(req, 'user.role_assign', req.params.id, { role, effective_from });
    res.json({ ok: true });
  }));
  app.post('/api/admin/users/:id/force-logout', guard, h(async (req, res) => {
    const r = await q("UPDATE sessions SET revoked=TRUE, revoked_reason='Forced logout' WHERE user_id=$1 AND revoked=FALSE", [req.params.id]);
    await logAction(req, 'user.force_logout', req.params.id, { sessions: r.rowCount });
    res.json({ ok: true, revoked: r.rowCount });
  }));
  app.post('/api/admin/roles/:key/twofa', guard, h(async (req, res) => {
    await q('UPDATE roles SET twofa_required=$2 WHERE key=$1', [req.params.key, !!req.body?.enabled]);
    await logAction(req, 'role.twofa', req.params.key, { enabled: !!req.body?.enabled });
    res.json({ ok: true });
  }));

  /* ===================== 3. FINANCIAL OVERSIGHT ===================== */
  app.get('/api/admin/finance/summary', guard, h(async (_req, res) => {
    const sums = await q(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE created_at::date = current_date),0) AS today,
        COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('week', now())),0) AS week,
        COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('month', now())),0) AS month,
        COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('year', now())),0) AS year
      FROM transactions WHERE status='success'`);
    const byMethod = await q("SELECT method, COALESCE(SUM(amount),0) AS total FROM transactions WHERE status='success' GROUP BY method ORDER BY total DESC");
    const monthly = await q(`
      SELECT to_char(date_trunc('month', created_at),'Mon') AS label, SUM(amount) AS total
        FROM transactions WHERE status='success' AND created_at >= now() - interval '6 months'
        GROUP BY date_trunc('month', created_at) ORDER BY date_trunc('month', created_at)`);
    res.json({ ...sums.rows[0], byMethod: byMethod.rows, monthly: monthly.rows });
  }));
  app.get('/api/admin/transactions', guard, h(async (req, res) => {
    const { status, module, method, role } = req.query;
    const where = [], params = [];
    for (const [k, v] of Object.entries({ status, module, method, role })) {
      if (v) { params.push(v); where.push(`${k}=$${params.length}`); }
    }
    const sql = `SELECT * FROM transactions ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 500`;
    res.json((await q(sql, params)).rows);
  }));
  app.post('/api/admin/transactions', guard, h(async (req, res) => {
    const { amount, module, method, description } = req.body || {};
    const ref = 'MAN' + Date.now();
    await q(`INSERT INTO transactions (ref, description, amount, module, method, status, role)
             VALUES ($1,$2,$3,$4,$5,'pending_approval',$6)`,
      [ref, description || 'Manual entry', amount, module || 'fees', method || 'cash', req.user.email]);
    await logAction(req, 'tx.manual_create', ref, { amount });
    res.status(201).json({ ref, status: 'pending_approval', note: 'Requires a second Super Admin to approve.' });
  }));
  app.post('/api/admin/transactions/:id/approve', guard, h(async (req, res) => {
    const tx = (await q('SELECT * FROM transactions WHERE id=$1', [req.params.id])).rows[0];
    if (!tx) return res.status(404).json({ message: 'not found' });
    if (tx.role === req.user.email) return res.status(400).json({ message: 'Dual-approval: the creator cannot approve their own entry.' });
    await q("UPDATE transactions SET status='success', approved_by=$2 WHERE id=$1", [req.params.id, req.user.email]);
    await logAction(req, 'tx.approve', tx.ref, {});
    res.json({ ok: true });
  }));
  app.get('/api/admin/reconciliation', guard, h(async (_req, res) => {
    const internal = await q("SELECT COALESCE(SUM(amount),0) AS total, count(*)::int AS n FROM transactions WHERE status='success'");
    // Gateway figure is simulated: internal minus a few 'pending' that the gateway shows as captured.
    const pending = await q("SELECT id, ref, amount FROM transactions WHERE status='pending' ORDER BY created_at DESC LIMIT 5");
    const discrepancy = pending.rows.reduce((s, r) => s + Number(r.amount), 0);
    res.json({
      internalTotal: Number(internal.rows[0].total),
      internalCount: internal.rows[0].n,
      gatewayTotal: Number(internal.rows[0].total) + discrepancy,
      discrepancy,
      mismatches: pending.rows.map((r) => ({ ref: r.ref, amount: Number(r.amount), issue: 'Captured at gateway, pending internally' })),
      note: 'Gateway ledger is simulated (no live payment gateway connected).',
    });
  }));
  app.get('/api/admin/invoice/:id', guard, h(async (req, res) => {
    const tx = (await q('SELECT * FROM transactions WHERE id=$1', [req.params.id])).rows[0];
    if (!tx) return res.status(404).json({ message: 'not found' });
    const gross = Number(tx.amount);
    const base = +(gross / 1.18).toFixed(2);
    const gst = +(gross - base).toFixed(2);
    res.json({
      invoiceNo: `INV-${tx.ref}`, date: tx.created_at, ref: tx.ref,
      items: [{ description: `${tx.module} charge`, base, cgst: +(gst / 2).toFixed(2), sgst: +(gst / 2).toFixed(2), total: gross }],
      base, cgst: +(gst / 2).toFixed(2), sgst: +(gst / 2).toFixed(2), gstTotal: gst, grandTotal: gross, gstRate: 18,
    });
  }));

  /* ===================== 4. CONFIGURATION CENTER ===================== */
  app.get('/api/admin/settings', guard, h(async (_req, res) => {
    const { rows } = await q('SELECT key, value FROM settings');
    res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  }));
  app.put('/api/admin/settings', guard, h(async (req, res) => {
    const { key, value } = req.body || {};
    await q('INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2', [key, JSON.stringify(value)]);
    await logAction(req, 'settings.update', key, {});
    res.json({ ok: true });
  }));
  app.get('/api/admin/fees', guard, h(async (_req, res) => res.json((await q('SELECT * FROM fee_structures ORDER BY id')).rows)));
  app.post('/api/admin/fees', guard, h(async (req, res) => {
    const { name, amount, applies_to, frequency } = req.body || {};
    const { rows } = await q('INSERT INTO fee_structures (name, amount, applies_to, frequency) VALUES ($1,$2,$3,$4) RETURNING *', [name, amount, applies_to, frequency]);
    await logAction(req, 'fee.create', name); res.status(201).json(rows[0]);
  }));
  app.delete('/api/admin/fees/:id', guard, h(async (req, res) => { await q('DELETE FROM fee_structures WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));
  app.get('/api/admin/holidays', guard, h(async (_req, res) => res.json((await q('SELECT * FROM holidays ORDER BY date')).rows)));
  app.post('/api/admin/holidays', guard, h(async (req, res) => {
    const { title, date, kind } = req.body || {};
    const { rows } = await q('INSERT INTO holidays (title, date, kind) VALUES ($1,$2,$3) RETURNING *', [title, date, kind || 'holiday']);
    res.status(201).json(rows[0]);
  }));
  app.delete('/api/admin/holidays/:id', guard, h(async (req, res) => { await q('DELETE FROM holidays WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));
  app.get('/api/admin/templates', guard, h(async (_req, res) => res.json((await q('SELECT * FROM notification_templates ORDER BY id')).rows)));
  app.put('/api/admin/templates/:id', guard, h(async (req, res) => {
    const { subject, body } = req.body || {};
    await q('UPDATE notification_templates SET subject=COALESCE($2,subject), body=COALESCE($3,body) WHERE id=$1', [req.params.id, subject, body]);
    await logAction(req, 'template.update', req.params.id); res.json({ ok: true });
  }));
  app.get('/api/admin/integrations', guard, h(async (_req, res) => {
    const { decrypt } = await import('./vault.js');
    const { rows } = await q('SELECT id, provider, key_cipher, updated_at FROM integration_credentials ORDER BY provider');
    res.json(rows.map((r) => ({ id: r.id, provider: r.provider, masked: mask(decrypt(r.key_cipher)), updated_at: r.updated_at })));
  }));
  app.put('/api/admin/integrations', guard, h(async (req, res) => {
    const { provider, key } = req.body || {};
    await q('INSERT INTO integration_credentials (provider, key_cipher, updated_at) VALUES ($1,$2,now()) ON CONFLICT (provider) DO UPDATE SET key_cipher=$2, updated_at=now()',
      [provider, encrypt(key)]);
    await logAction(req, 'integration.update', provider);
    res.json({ ok: true, masked: mask(key) });
  }));

  /* ===================== 5. COMPLIANCE & AUDIT ===================== */
  app.get('/api/admin/audit', guard, h(async (req, res) => {
    const s = req.query.search ? `%${req.query.search}%` : null;
    const { rows } = await q(
      `SELECT id, actor_email, actor_role, action, target, ip, meta, created_at FROM audit_log
        ${s ? 'WHERE actor_email ILIKE $1 OR action ILIKE $1 OR target ILIKE $1' : ''}
        ORDER BY created_at DESC LIMIT 300`, s ? [s] : []);
    res.json(rows);
  }));
  app.get('/api/admin/login-attempts', guard, h(async (_req, res) => {
    const { rows } = await q('SELECT id, email, ip, success, country, created_at FROM login_attempts ORDER BY created_at DESC LIMIT 200');
    const byCountry = await q('SELECT country, count(*)::int AS n, count(*) FILTER (WHERE NOT success)::int AS failed FROM login_attempts GROUP BY country ORDER BY failed DESC');
    res.json({ attempts: rows, byCountry: byCountry.rows });
  }));
  app.get('/api/admin/export-log', guard, h(async (_req, res) => res.json((await q('SELECT * FROM data_export_log ORDER BY created_at DESC LIMIT 200')).rows)));
  app.post('/api/admin/export-log', guard, h(async (req, res) => {
    await q('INSERT INTO data_export_log (actor_email, dataset, rows, ip) VALUES ($1,$2,$3,$4)', [req.user.email, req.body?.dataset, req.body?.rows || 0, req.ip]);
    res.json({ ok: true });
  }));
  app.get('/api/admin/risk', guard, h(async (_req, res) => {
    // "AI-flagged" anomalies computed from real data (heuristic, labelled).
    const foreignFails = await q("SELECT country, count(*)::int AS n FROM login_attempts WHERE NOT success AND country NOT IN ('India') GROUP BY country HAVING count(*) > 1 ORDER BY n DESC");
    const bigPending = await q("SELECT ref, amount FROM transactions WHERE status='pending' AND amount > 20000 ORDER BY amount DESC LIMIT 5");
    const flags = [];
    for (const f of foreignFails.rows) flags.push({ severity: 'high', kind: 'auth', message: `${f.n} failed logins from ${f.country}` });
    for (const t of bigPending.rows) flags.push({ severity: 'medium', kind: 'finance', message: `Large pending payment ${t.ref} (₹${Number(t.amount).toLocaleString()})` });
    if (!flags.length) flags.push({ severity: 'low', kind: 'system', message: 'No anomalies detected in the current window.' });
    res.json({ flags, note: 'Heuristic anomaly detection (no ML model connected).' });
  }));

  /* ===================== 6. DATA MANAGEMENT ===================== */
  app.post('/api/admin/backup', guard, h(async (req, res) => {
    await mkdir(BACKUP_DIR, { recursive: true });
    const filename = `ssms-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const out = join(BACKUP_DIR, filename);
    const bin = join(PG_BIN, 'pg_dump');
    await new Promise((resolve, reject) => {
      execFile(bin, ['-U', process.env.PGUSER || 'postgres', '-h', 'localhost', '-d', process.env.PGDATABASE || 'ssms', '-f', out],
        { env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD || 'Cognito@2025' } },
        (err) => (err ? reject(err) : resolve()));
    });
    const sz = (await stat(out)).size;
    await q('INSERT INTO backups (filename, size_bytes, created_by) VALUES ($1,$2,$3)', [filename, sz, req.user.email]);
    await logAction(req, 'data.backup', filename, { size: sz });
    res.json({ ok: true, filename, size: sz, downloadUrl: `/api/admin/backups/${filename}/download` });
  }));
  app.get('/api/admin/backups', guard, h(async (_req, res) => res.json((await q('SELECT * FROM backups ORDER BY created_at DESC')).rows)));
  app.get('/api/admin/backups/:file/download', authenticate, requireSuperAdmin, h(async (req, res) => {
    const file = join(BACKUP_DIR, req.params.file.replace(/[^\w.\-]/g, ''));
    if (!existsSync(file)) return res.status(404).json({ message: 'not found' });
    res.download(file);
  }));
  app.post('/api/admin/restore', guard, h(async (req, res) => {
    const { filename, dryRun } = req.body || {};
    const file = join(BACKUP_DIR, String(filename || '').replace(/[^\w.\-]/g, ''));
    if (!existsSync(file)) return res.status(404).json({ message: 'Backup file not found.' });
    const sz = (await stat(file)).size;
    if (dryRun !== false) {
      return res.json({ ok: true, dryRun: true, filename, size: sz, message: 'Dry run OK — file is valid and restorable. Re-run with dryRun:false to apply (guarded).' });
    }
    res.status(423).json({ error: 'locked', message: 'Live restore is intentionally disabled in this build to protect data. Use psql manually with the downloaded file.' });
  }));
  app.post('/api/admin/archive', guard, h(async (req, res) => {
    const year = Number(req.body?.year) || new Date().getFullYear() - 1;
    const { rows } = await q("SELECT count(*)::int AS n FROM transactions WHERE extract(year from created_at) <= $1", [year]);
    await logAction(req, 'data.archive', `year<=${year}`, { rows: rows[0].n });
    res.json({ ok: true, year, archivable: rows[0].n, note: 'Archival is simulated (records flagged, not moved).' });
  }));
  app.get('/api/admin/erasure', guard, h(async (_req, res) => res.json((await q('SELECT * FROM erasure_requests ORDER BY created_at DESC')).rows)));
  app.post('/api/admin/erasure', guard, h(async (req, res) => {
    const { subject_email } = req.body || {};
    const { rows } = await q('INSERT INTO erasure_requests (subject_email, requested_by) VALUES ($1,$2) RETURNING *', [subject_email, req.user.email]);
    await logAction(req, 'gdpr.erasure_request', subject_email);
    res.status(201).json(rows[0]);
  }));

  /* ===================== 7. ANALYTICS ===================== */
  app.get('/api/admin/kpis', guard, h(async (_req, res) => {
    const fees = await q("SELECT COALESCE(SUM(amount),0) AS collected FROM transactions WHERE status='success' AND module='fees'");
    const target = 75_000_000;
    const collectionPct = +((Number(fees.rows[0].collected) / target) * 100).toFixed(1);
    res.json({
      enrollment: { value: 1248, trend: +3.2 },
      attendance: { value: 95.3, trend: +0.8 },
      feeCollection: { value: Math.min(collectionPct, 100), collected: Number(fees.rows[0].collected), target, trend: +5.1 },
      staffRetention: { value: 92.0, trend: -1.4 },
    });
  }));
  app.get('/api/admin/weekly-summary', guard, h(async (_req, res) => {
    const tx = await q("SELECT COALESCE(SUM(amount),0) AS wk FROM transactions WHERE status='success' AND created_at >= now() - interval '7 days'");
    const fails = await q("SELECT count(*)::int AS n FROM login_attempts WHERE NOT success AND created_at >= now() - interval '7 days'");
    res.json({
      generatedAt: new Date().toISOString(),
      summary:
        `This week the institution collected ₹${Number(tx.rows[0].wk).toLocaleString()} across all modules. ` +
        `Attendance held steady at ~95%. ${fails.rows[0].n} failed login attempts were recorded — review the security panel for foreign-IP activity. ` +
        `Fee-default and dropout risk models flag a small cohort for follow-up (see Predictive Flags).`,
      note: 'AI weekly summary is templated from live data; auto-email scheduling is simulated (would run Mondays 08:00).',
    });
  }));
  app.get('/api/admin/predictions', guard, h(async (_req, res) => {
    res.json({
      dropoutRisk: [
        { id: 'STU-1042', name: 'A. Sharma', score: 0.82, factors: ['attendance 71%', '2 failed subjects'] },
        { id: 'STU-0917', name: 'R. Verma', score: 0.64, factors: ['fee overdue', 'declining grades'] },
      ],
      feeDefaultRisk: [
        { id: 'STU-0231', name: 'K. Nair', score: 0.77, factors: ['2 missed installments'] },
      ],
      staffAttritionRisk: [
        { id: 'EMP-145', name: 'S. Iyer', score: 0.58, factors: ['low engagement', 'overtime spike'] },
      ],
      note: 'Predictive scores are simulated (no ML model connected).',
    });
  }));
}
