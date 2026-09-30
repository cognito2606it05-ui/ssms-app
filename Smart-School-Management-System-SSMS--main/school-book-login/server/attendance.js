import crypto from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import multer from 'multer';
import { q } from './db.js';
import { broadcast } from './ws.js';
import { encrypt } from './vault.js';
import * as ai from './attendance-ai.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FACE_DIR = join(__dirname, 'uploads', 'faces');
mkdirSync(FACE_DIR, { recursive: true });
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const VALID = ['present', 'absent', 'late', 'leave'];

const faceUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _f, cb) => cb(null, FACE_DIR),
    filename: (req, file, cb) => cb(null, `${req.body.student_id || 'x'}-${Date.now()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

async function counts(sessionId) {
  const { rows } = await q(
    `SELECT status, count(*)::int n FROM attendance WHERE session_id=$1 GROUP BY status`, [sessionId]);
  const c = { present: 0, absent: 0, late: 0, leave: 0, marked: 0 };
  for (const r of rows) { c[r.status] = r.n; c.marked += r.n; }
  return c;
}

function statusByGrace(session) {
  const cutoff = new Date(new Date(session.started_at).getTime() + session.grace_min * 60000);
  return new Date() > cutoff ? 'late' : 'present';
}

// Quiet-hours aware notification queue (21:00–07:00 held to next 07:00). Sending simulated.
async function queueNotification(studentId, channel, message) {
  const now = new Date();
  const hr = now.getHours();
  const quiet = hr >= 21 || hr < 7;
  let scheduled = now, status = 'sent';
  if (quiet) {
    scheduled = new Date(now); scheduled.setHours(7, 0, 0, 0);
    if (hr >= 21) scheduled.setDate(scheduled.getDate() + 1);
    status = 'held';
  }
  await q('INSERT INTO notification_queue (student_id, channel, message, status, scheduled_for) VALUES ($1,$2,$3,$4,$5)',
    [studentId, channel, message, status, scheduled]);
}

export function mountAttendance(app, { authenticate, requirePermission }) {
  const read = [authenticate, requirePermission('attendance', 'read')];
  const write = [authenticate, requirePermission('attendance', 'write')];
  const edit = [authenticate, requirePermission('attendance', 'edit')];

  /* ---------------- sessions ---------------- */
  app.post('/api/attendance/sessions', write, h(async (req, res) => {
    const b = req.body || {};
    let token = null, exp = null;
    if (b.mode === 'qr') { token = crypto.randomBytes(8).toString('hex'); exp = new Date(Date.now() + 5 * 60000); }
    const { rows } = await q(
      `INSERT INTO attendance_sessions (academic_year, class, section, subject, period_id, mode, grace_min, qr_token, qr_expires_at, started_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [b.academic_year || '2025-2026', b.class, b.section, b.subject, b.period_id || 'P1', b.mode || 'manual', b.grace_min ?? 10, token, exp, req.user.email]);
    res.status(201).json(rows[0]);
  }));

  app.get('/api/attendance/sessions', read, h(async (_req, res) =>
    res.json((await q('SELECT * FROM attendance_sessions ORDER BY started_at DESC LIMIT 50')).rows)));

  app.get('/api/attendance/sessions/:id', read, h(async (req, res) => {
    const session = (await q('SELECT * FROM attendance_sessions WHERE id=$1', [req.params.id])).rows[0];
    if (!session) return res.status(404).json({ message: 'not found' });
    const roster = (await q(
      `SELECT s.id, s.name, s.roll_number, s.photo_url, a.status, a.marking_method, a.ts, a.face_match_confidence
         FROM students s
         LEFT JOIN attendance a ON a.student_id=s.id AND a.session_id=$1
        WHERE s.class=$2 ${session.section ? 'AND s.section=$3' : ''}
        ORDER BY s.roll_number NULLS LAST, s.name`,
      session.section ? [session.id, session.class, session.section] : [session.id, session.class])).rows;
    res.json({ session, roster, counts: await counts(session.id), total: roster.length });
  }));

  app.post('/api/attendance/sessions/:id/qr/refresh', write, h(async (req, res) => {
    const token = crypto.randomBytes(8).toString('hex');
    const exp = new Date(Date.now() + 5 * 60000);
    await q('UPDATE attendance_sessions SET qr_token=$2, qr_expires_at=$3 WHERE id=$1', [req.params.id, token, exp]);
    broadcast(req.params.id, { type: 'qr_refresh' });
    res.json({ qr_token: token, qr_expires_at: exp });
  }));

  app.post('/api/attendance/sessions/:id/close', write, h(async (req, res) => {
    const session = (await q('UPDATE attendance_sessions SET status=$2, closed_at=now() WHERE id=$1 RETURNING *', [req.params.id, 'closed']).then((r) => r.rows[0]));
    if (!session) return res.status(404).json({ message: 'not found' });
    // notify parents of absent students
    const absent = (await q(`SELECT s.id, s.name FROM students s JOIN attendance a ON a.student_id=s.id AND a.session_id=$1 WHERE a.status='absent'`, [session.id])).rows;
    for (const a of absent) {
      const prefs = (await q('SELECT * FROM notification_prefs WHERE student_id=$1', [a.id])).rows[0] || { sms: true, whatsapp: true };
      if (prefs.sms) await queueNotification(a.id, 'sms', `${a.name} was marked ABSENT for ${session.subject || 'class'} on ${new Date().toLocaleDateString()}.`);
      if (prefs.whatsapp) await queueNotification(a.id, 'whatsapp', `${a.name} was marked ABSENT today.`);
    }
    const c = await counts(session.id);
    broadcast(session.id, { type: 'closed', counts: c });
    res.json({ ok: true, summary: c, notifiedAbsent: absent.length, note: 'Parent SMS/WhatsApp sending is simulated (quiet hours respected).' });
  }));

  /* ---------------- manual marking ---------------- */
  async function mark(sessionId, studentId, status, method, by, extra = {}) {
    const prev = (await q('SELECT id, status FROM attendance WHERE session_id=$1 AND student_id=$2', [sessionId, studentId])).rows[0];
    const cols = ['session_id', 'student_id', 'status', 'marking_method', 'marked_by', 'face_match_confidence', 'camera_device_id', 'face_template_version', 'liveness_verified', 'location_hash', 'device_info'];
    const vals = [sessionId, studentId, status, method, by, extra.confidence ?? null, extra.camera ?? null, extra.tplVersion ?? null, extra.liveness ?? null, extra.locationHash ?? null, extra.deviceInfo ?? null];
    await q(
      `INSERT INTO attendance (${cols.join(',')}) VALUES (${cols.map((_, i) => '$' + (i + 1)).join(',')})
       ON CONFLICT (session_id, student_id) DO UPDATE SET status=$3, marking_method=$4, marked_by=$5, ts=now(),
         face_match_confidence=$6, camera_device_id=$7, face_template_version=$8, liveness_verified=$9, location_hash=$10, device_info=$11`,
      vals);
    await q('INSERT INTO attendance_audit (student_id, session_id, old_status, new_status, changed_by, reason) VALUES ($1,$2,$3,$4,$5,$6)',
      [studentId, sessionId, prev?.status || null, status, by, extra.reason || method]);
    return prev;
  }

  app.post('/api/attendance/sessions/:id/mark', write, h(async (req, res) => {
    const { student_id, status } = req.body || {};
    if (!VALID.includes(status)) return res.status(400).json({ message: 'invalid status' });
    await mark(req.params.id, student_id, status, 'manual', req.user.email, { reason: req.body.reason });
    const c = await counts(req.params.id);
    broadcast(req.params.id, { type: 'mark', student_id, status, counts: c });
    res.json({ ok: true, counts: c });
  }));

  app.post('/api/attendance/sessions/:id/mark-all-present', write, h(async (req, res) => {
    const session = (await q('SELECT * FROM attendance_sessions WHERE id=$1', [req.params.id])).rows[0];
    const roster = (await q(`SELECT s.id FROM students s WHERE s.class=$1 ${session.section ? 'AND s.section=$2' : ''}`,
      session.section ? [session.class, session.section] : [session.class])).rows;
    for (const r of roster) await mark(session.id, r.id, 'present', 'manual', req.user.email, { reason: 'mark-all-present' });
    const c = await counts(session.id);
    broadcast(session.id, { type: 'bulk', counts: c });
    res.json({ ok: true, counts: c });
  }));

  app.put('/api/attendance/:id', edit, h(async (req, res) => {
    const { status, reason } = req.body || {};
    if (!VALID.includes(status)) return res.status(400).json({ message: 'invalid status' });
    const row = (await q('SELECT * FROM attendance WHERE id=$1', [req.params.id])).rows[0];
    if (!row) return res.status(404).json({ message: 'not found' });
    await q('UPDATE attendance SET status=$2, marked_by=$3, ts=now() WHERE id=$1', [req.params.id, status, req.user.email]);
    await q('INSERT INTO attendance_audit (attendance_id, student_id, session_id, old_status, new_status, changed_by, reason) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [row.id, row.student_id, row.session_id, row.status, status, req.user.email, reason || 'override']);
    if (row.session_id) broadcast(row.session_id, { type: 'override', counts: await counts(row.session_id) });
    res.json({ ok: true });
  }));

  app.get('/api/attendance/:id/audit', read, h(async (req, res) =>
    res.json((await q('SELECT * FROM attendance_audit WHERE attendance_id=$1 OR (student_id=$2) ORDER BY created_at DESC LIMIT 50', [req.params.id, req.params.id])).rows)));

  /* ---------------- QR scan (capability via token; student side) ---------------- */
  app.post('/api/attendance/qr/scan', authenticate, h(async (req, res) => {
    const { token, student_id, device_info, location_hash } = req.body || {};
    const session = (await q('SELECT * FROM attendance_sessions WHERE qr_token=$1', [token])).rows[0];
    if (!session) return res.status(404).json({ error: 'invalid_token', message: 'QR session not found.' });
    if (session.status !== 'open') return res.status(409).json({ error: 'closed', message: 'Session is closed.' });
    if (new Date(session.qr_expires_at) < new Date()) return res.status(410).json({ error: 'expired', message: 'QR code expired — ask teacher to refresh.' });
    const dup = (await q('SELECT id FROM attendance WHERE session_id=$1 AND student_id=$2', [session.id, student_id])).rows[0];
    if (dup) return res.status(409).json({ error: 'duplicate', message: 'Already marked for this session.' });
    const status = statusByGrace(session);
    await mark(session.id, student_id, status, 'qr', 'qr-scan', { deviceInfo: device_info, locationHash: location_hash, reason: 'qr scan' });
    const c = await counts(session.id);
    broadcast(session.id, { type: 'scan', student_id, status, device: device_info, counts: c });
    res.json({ ok: true, status, counts: c });
  }));

  /* ---------------- Face ID (recognition simulated; data model real) ---------------- */
  app.post('/api/attendance/face/enroll', write, faceUpload.single('image'), h(async (req, res) => {
    const { student_id, consent } = req.body || {};
    const tpl = encrypt('FACE_TEMPLATE_' + student_id + '_' + crypto.randomBytes(16).toString('hex'));
    await q(`INSERT INTO face_enrollments (student_id, consent, consent_at, template_cipher, template_version, image_filename)
             VALUES ($1,$2, CASE WHEN $2 THEN now() END,$3,'v1',$4)
             ON CONFLICT (student_id) DO UPDATE SET consent=$2, consent_at=CASE WHEN $2 THEN now() END, template_cipher=$3, image_filename=$4, enrolled_at=now()`,
      [student_id, consent === 'true' || consent === true, tpl, req.file?.filename || null]);
    res.status(201).json({ ok: true, note: 'Face template encrypted at rest (AES-256-GCM). Recognition is simulated.' });
  }));
  app.get('/api/attendance/face/enrollments', read, h(async (_req, res) =>
    res.json((await q(`SELECT e.student_id, s.name, e.consent, e.template_version, e.enrolled_at FROM face_enrollments e JOIN students s ON s.id=e.student_id ORDER BY e.enrolled_at DESC`)).rows)));

  // simulate one recognition pass: pick an unmarked, consented, enrolled student in the class
  app.post('/api/attendance/sessions/:id/face/detect', write, h(async (req, res) => {
    const session = (await q('SELECT * FROM attendance_sessions WHERE id=$1', [req.params.id])).rows[0];
    if (!session) return res.status(404).json({ message: 'not found' });
    const threshold = Number(req.body?.threshold ?? 90);
    const camera = req.body?.camera || 'CAM-CLASS-01';
    // unknown face event ~12% of the time
    if (Math.random() < 0.12) {
      await q(`INSERT INTO face_review_queue (session_id, student_id, confidence, reason) VALUES ($1,NULL,$2,'unknown_face')`, [session.id, Math.round(40 + Math.random() * 30)]);
      broadcast(session.id, { type: 'face_unknown', camera });
      return res.json({ event: 'unknown_face', message: 'Unknown face — sent to review queue.' });
    }
    const cand = (await q(
      `SELECT s.id, s.name FROM students s JOIN face_enrollments e ON e.student_id=s.id AND e.consent=TRUE
        WHERE s.class=$1 ${session.section ? 'AND s.section=$2' : ''}
          AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.session_id=$3 AND a.student_id=s.id)
        ORDER BY random() LIMIT 1`,
      session.section ? [session.class, session.section, session.id] : [session.class, session.id])).rows[0];
    if (!cand) return res.json({ event: 'none', message: 'All enrolled students already recognised.' });
    const confidence = Math.round((70 + Math.random() * 29) * 10) / 10;
    const liveness = Math.random() > 0.05; // 5% liveness fail (spoof)
    if (!liveness) {
      await q(`INSERT INTO face_review_queue (session_id, student_id, confidence, reason) VALUES ($1,$2,$3,'low_confidence')`, [session.id, cand.id, confidence]);
      broadcast(session.id, { type: 'face_spoof', student_id: cand.id });
      return res.json({ event: 'liveness_failed', student: cand.name, message: 'Liveness check failed (possible spoof) — sent to review.' });
    }
    if (confidence < threshold) {
      await q(`INSERT INTO face_review_queue (session_id, student_id, confidence, reason) VALUES ($1,$2,$3,'low_confidence')`, [session.id, cand.id, confidence]);
      broadcast(session.id, { type: 'face_review', student_id: cand.id, confidence });
      return res.json({ event: 'low_confidence', student: cand.name, confidence, message: `Below ${threshold}% — sent to manual review.` });
    }
    const status = statusByGrace(session);
    await mark(session.id, cand.id, status, 'face', req.user.email, { confidence, camera, tplVersion: 'v1', liveness: true, reason: 'face recognition' });
    const c = await counts(session.id);
    broadcast(session.id, { type: 'face_match', student_id: cand.id, student: cand.name, confidence, status, counts: c });
    res.json({ event: 'matched', student: cand.name, confidence, status, counts: c });
  }));

  app.get('/api/attendance/face/review-queue', read, h(async (_req, res) =>
    res.json((await q(`SELECT r.*, s.name FROM face_review_queue r LEFT JOIN students s ON s.id=r.student_id WHERE r.status='pending' ORDER BY r.created_at DESC`)).rows)));
  app.post('/api/attendance/face/review/:id/resolve', write, h(async (req, res) => {
    const { approve } = req.body || {};
    const item = (await q('SELECT * FROM face_review_queue WHERE id=$1', [req.params.id])).rows[0];
    if (!item) return res.status(404).json({ message: 'not found' });
    if (approve && item.student_id && item.session_id) {
      const session = (await q('SELECT * FROM attendance_sessions WHERE id=$1', [item.session_id])).rows[0];
      await mark(item.session_id, item.student_id, statusByGrace(session), 'face', req.user.email, { confidence: item.confidence, liveness: true, reason: 'manual review approve' });
    }
    await q('UPDATE face_review_queue SET status=$2 WHERE id=$1', [req.params.id, approve ? 'approved' : 'rejected']);
    res.json({ ok: true });
  }));
  app.get('/api/attendance/face/analytics', read, h(async (_req, res) => {
    const acc = await q(`SELECT round(avg(face_match_confidence),1) avg_conf, count(*)::int n FROM attendance WHERE marking_method='face'`);
    const low = await q(`SELECT count(*)::int n FROM face_review_queue WHERE reason='low_confidence'`);
    const unknown = await q(`SELECT count(*)::int n FROM face_review_queue WHERE reason='unknown_face'`);
    const rejects = await q(`SELECT count(*)::int n FROM face_review_queue WHERE status='rejected'`);
    res.json({
      avgConfidence: acc.rows[0].avg_conf, faceMarks: acc.rows[0].n,
      lowConfidence: low.rows[0].n, unknownFaces: unknown.rows[0].n, falsePositiveProxy: rejects.rows[0].n,
      note: 'Recognition simulated — analytics computed from generated events.',
    });
  }));

  /* ---------------- Biometric webhook (device API-key auth) ---------------- */
  app.post('/api/v1/attendance/biometric-webhook', h(async (req, res) => {
    const key = req.headers['x-api-key'];
    const device = (await q('SELECT * FROM biometric_devices WHERE api_key=$1 AND active=TRUE', [key])).rows[0];
    const logFail = (payload, err) => q('INSERT INTO biometric_sync_logs (device_id, payload, status, error) VALUES ($1,$2,$3,$4)', [req.body?.device_id, payload, 'failed', err]);
    if (!device) { await logFail(req.body, 'invalid_api_key'); return res.status(401).json({ error: 'unauthorized', message: 'Invalid device API key.' }); }
    const { student_id, timestamp, verification_type } = req.body || {};
    const student = (await q('SELECT id FROM students WHERE admission_number=$1 OR id::text=$1', [String(student_id)])).rows[0];
    if (!student) { await logFail(req.body, 'student_not_found'); return res.status(422).json({ error: 'student_not_found', message: 'Unknown student — will retry.', retryable: true }); }
    const today = (timestamp || new Date().toISOString()).slice(0, 10);
    const dup = (await q(`SELECT id FROM attendance WHERE student_id=$1 AND attendance_date=$2 AND marking_method='biometric'`, [student.id, today])).rows[0];
    if (!dup) {
      await q(`INSERT INTO attendance (student_id, attendance_date, period_id, status, marked_by, marking_method, camera_device_id, ts)
               VALUES ($1,$2,'P1','present',$3,'biometric',$4,$5)`, [student.id, today, device.device_id, device.device_id, timestamp || new Date()]);
    }
    await q('INSERT INTO biometric_sync_logs (device_id, payload, status) VALUES ($1,$2,$3)', [device.device_id, req.body, 'ok']);
    broadcast('live', { type: 'biometric', student_id: student.id, device: device.device_id, verification_type });
    res.json({ ok: true, marked: !dup, duplicate: !!dup });
  }));

  app.get('/api/attendance/devices', read, h(async (_req, res) =>
    res.json((await q('SELECT id, device_id, name, type, active, created_at FROM biometric_devices ORDER BY device_id')).rows)));
  app.post('/api/attendance/devices', write, h(async (req, res) => {
    const { device_id, name, type } = req.body || {};
    const apiKey = 'dev_' + crypto.randomBytes(8).toString('hex');
    await q('INSERT INTO biometric_devices (device_id, name, type, api_key) VALUES ($1,$2,$3,$4)', [device_id, name, type, apiKey]);
    res.status(201).json({ ok: true, device_id, api_key: apiKey, note: 'Store this API key on the device; it is shown once.' });
  }));
  app.get('/api/attendance/devices/sync-logs', read, h(async (_req, res) =>
    res.json((await q('SELECT * FROM biometric_sync_logs ORDER BY created_at DESC LIMIT 100')).rows)));

  /* ---------------- CSV bulk import ---------------- */
  async function resolveStudent(idLike) {
    return (await q('SELECT id, name FROM students WHERE admission_number=$1 OR id::text=$1', [String(idLike)])).rows[0];
  }
  app.post('/api/attendance/import/validate', write, h(async (req, res) => {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const seen = new Set();
    const report = { total: rows.length, valid: 0, invalid: [], duplicates: [], preview: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]; const sid = r.student_id ?? r['Student ID']; const st = String(r.status ?? r['Attendance Status'] ?? '').toLowerCase();
      if (!VALID.includes(st)) { report.invalid.push({ row: i + 1, error: `invalid status '${st}'` }); continue; }
      const stu = await resolveStudent(sid);
      if (!stu) { report.invalid.push({ row: i + 1, error: `student '${sid}' not found` }); continue; }
      if (seen.has(stu.id)) { report.duplicates.push({ row: i + 1, student: stu.name }); continue; }
      seen.add(stu.id); report.valid++;
      report.preview.push({ student_id: stu.id, name: stu.name, status: st });
    }
    res.json(report);
  }));
  app.post('/api/attendance/import/commit', write, h(async (req, res) => {
    const { date, period_id, rows } = req.body || {};
    let created = 0;
    for (const r of rows || []) {
      const stu = await resolveStudent(r.student_id);
      const st = String(r.status).toLowerCase();
      if (!stu || !VALID.includes(st)) continue;
      await q(`INSERT INTO attendance (student_id, attendance_date, period_id, status, marked_by, marking_method)
               VALUES ($1,$2,$3,$4,$5,'csv')
               ON CONFLICT DO NOTHING`, [stu.id, date || new Date().toISOString().slice(0, 10), period_id || 'P1', st, req.user.email]);
      created++;
    }
    res.json({ ok: true, committed: created });
  }));

  /* ---------------- reporting ---------------- */
  app.get('/api/attendance/reports/daily', read, h(async (req, res) => {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const cls = req.query.class;
    const rows = (await q(
      `SELECT s.id, s.name, s.roll_number, s.class, s.section,
              COALESCE(a.status,'—') status, a.marking_method
         FROM students s LEFT JOIN attendance a ON a.student_id=s.id AND a.attendance_date=$1
        ${cls ? 'WHERE s.class=$2' : ''} ORDER BY s.class, s.section, s.roll_number NULLS LAST`,
      cls ? [date, cls] : [date])).rows;
    res.json({ date, rows });
  }));
  app.get('/api/attendance/reports/monthly', read, h(async (req, res) => {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const cls = req.query.class;
    const rows = (await q(
      `SELECT s.id, s.name, s.class, s.section,
              count(*) FILTER (WHERE a.status='present') present_days,
              count(*) FILTER (WHERE a.status='absent') absent_days,
              count(*) FILTER (WHERE a.status='late') late_days,
              count(*) FILTER (WHERE a.status='leave') leave_days,
              count(a.*) total_days
         FROM students s LEFT JOIN attendance a ON a.student_id=s.id AND to_char(a.attendance_date,'YYYY-MM')=$1
        ${cls ? 'WHERE s.class=$2' : ''} GROUP BY s.id ORDER BY s.class, s.name`,
      cls ? [month, cls] : [month])).rows;
    const out = rows.map((r) => {
      const present = Number(r.present_days) + Number(r.late_days);
      const total = Number(r.total_days) || 0;
      const pct = total ? Math.round((present / total) * 100) : 0;
      return { ...r, attendance_pct: pct, color: pct > 85 ? 'green' : pct >= 75 ? 'amber' : 'red' };
    });
    res.json({ month, rows: out });
  }));
  app.get('/api/attendance/reports/subjectwise', read, h(async (_req, res) => {
    const rows = (await q(
      `SELECT COALESCE(ses.subject,'(unassigned)') subject, ses.started_by AS faculty,
              count(*) FILTER (WHERE a.status IN ('present','late')) present, count(a.*) total
         FROM attendance a JOIN attendance_sessions ses ON ses.id=a.session_id
        GROUP BY ses.subject, ses.started_by ORDER BY subject`)).rows;
    res.json(rows.map((r) => ({ ...r, pct: r.total ? Math.round((r.present / r.total) * 100) : 0 })));
  }));
  app.get('/api/attendance/reports/cumulative', read, h(async (req, res) => {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const trend = (await q(
      `SELECT attendance_date::text date, round(avg(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END)*100) present_pct
         FROM attendance WHERE attendance_date > current_date - ($1||' days')::interval
        GROUP BY attendance_date ORDER BY attendance_date`, [days])).rows;
    const dist = (await q(`SELECT status, count(*)::int n FROM attendance WHERE attendance_date > current_date - ($1||' days')::interval GROUP BY status`, [days])).rows;
    res.json({ days, trend, distribution: dist });
  }));
  app.get('/api/attendance/reports/staff', read, h(async (_req, res) => {
    const rows = (await q(`SELECT staff_kind, count(*) FILTER (WHERE status='present') present, count(*) total FROM staff_attendance GROUP BY staff_kind`)).rows;
    res.json({ rows, note: 'Staff attendance supports QR/Face/Biometric; seed currently empty — mark via the same session flow with staff sessions.' });
  }));

  /* ---------------- AI & predictive ---------------- */
  app.get('/api/attendance/ai/anomalies', read, h(async (_req, res) => res.json(await ai.anomalies())));
  app.get('/api/attendance/ai/patterns', read, h(async (_req, res) => res.json(await ai.patterns())));
  app.get('/api/attendance/ai/predictions', read, h(async (_req, res) => res.json({ predictions: await ai.predictions(), note: 'Heuristic risk model (no trained ML model connected).' })));
  app.get('/api/attendance/ai/correlations', read, h(async (_req, res) => res.json(await ai.correlations())));

  /* ---------------- notifications ---------------- */
  app.get('/api/attendance/notify/prefs/:studentId', read, h(async (req, res) =>
    res.json((await q('SELECT * FROM notification_prefs WHERE student_id=$1', [req.params.studentId])).rows[0] || { student_id: Number(req.params.studentId), sms: true, whatsapp: true, email: true, push: false })));
  app.put('/api/attendance/notify/prefs/:studentId', write, h(async (req, res) => {
    const b = req.body || {};
    await q(`INSERT INTO notification_prefs (student_id, sms, whatsapp, email, push) VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (student_id) DO UPDATE SET sms=$2, whatsapp=$3, email=$4, push=$5`,
      [req.params.studentId, !!b.sms, !!b.whatsapp, !!b.email, !!b.push]);
    res.json({ ok: true });
  }));
  app.get('/api/attendance/notify/queue', read, h(async (_req, res) =>
    res.json((await q(`SELECT n.*, s.name FROM notification_queue n LEFT JOIN students s ON s.id=n.student_id ORDER BY n.created_at DESC LIMIT 100`)).rows)));
  app.post('/api/attendance/notify/process', write, h(async (_req, res) => {
    const r = await q(`UPDATE notification_queue SET status='sent' WHERE status='held' AND scheduled_for <= now()`);
    res.json({ ok: true, delivered: r.rowCount, note: 'Quiet-hours queue processed (sending simulated).' });
  }));
}
