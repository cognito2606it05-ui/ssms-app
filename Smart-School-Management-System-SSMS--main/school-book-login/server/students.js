import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import multer from 'multer';
import { q } from './db.js';
import { computeScores, detectAnomalies } from './student-ai.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = join(__dirname, 'uploads', 'students');
mkdirSync(UPLOAD_DIR, { recursive: true });

const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// disk storage (S3-compatible bucket not wired -> local disk)
const storage = multer.diskStorage({
  destination: (req, _f, cb) => {
    const dir = join(UPLOAD_DIR, String(req.params.id || 'misc'));
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = /pdf|jpeg|jpg|png|webp/.test(file.mimetype);
    cb(ok ? null : new Error('Only PDF/JPG/PNG/WEBP up to 5MB allowed'), ok);
  },
});

async function profileOf(id) {
  const s = (await q('SELECT * FROM students WHERE id=$1', [id])).rows[0];
  if (!s) return null;
  s.guardians = (await q('SELECT * FROM student_guardians WHERE student_id=$1', [id])).rows;
  s.documents = (await q('SELECT id, kind, filename, original_name, mime, size_bytes, uploaded_at FROM student_documents WHERE student_id=$1 ORDER BY uploaded_at DESC', [id])).rows;
  s.card = (await q('SELECT * FROM id_cards WHERE student_id=$1', [id])).rows[0] || null;
  s.ai = (await q('SELECT * FROM student_ai_scores WHERE student_id=$1', [id])).rows[0] || null;
  s.alerts = (await q('SELECT * FROM anomaly_alerts WHERE student_id=$1 ORDER BY created_at DESC', [id])).rows;
  if (s.card) s.cardTxns = (await q('SELECT * FROM card_transactions WHERE card_id=$1 ORDER BY created_at DESC LIMIT 20', [s.card.id])).rows;
  return s;
}

async function upsertAi(student) {
  const sc = computeScores(student);
  await q(
    `INSERT INTO student_ai_scores (student_id, dropout_risk, engagement, predicted_grade, learning_style, recommendations, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6, now())
     ON CONFLICT (student_id) DO UPDATE SET dropout_risk=$2, engagement=$3, predicted_grade=$4, learning_style=$5, recommendations=$6, updated_at=now()`,
    [student.id, sc.dropout_risk, sc.engagement, sc.predicted_grade, sc.learning_style, JSON.stringify(sc.recommendations)],
  );
  return sc;
}

// In-process "BullMQ worker" stand-in: periodically recompute AI scores.
function startAiWorker() {
  const run = async () => {
    try {
      const { rows } = await q('SELECT * FROM students');
      for (const s of rows) await upsertAi(s);
    } catch (e) { /* db may be resetting */ }
  };
  setInterval(run, 90_000);
  console.log('AI scoring worker started (in-process, 90s interval — Redis/BullMQ not wired).');
}

export function mountStudents(app, { authenticate, requirePermission }) {
  const canRead = [authenticate, requirePermission('students', 'read')];
  const canWrite = [authenticate, requirePermission('students', 'write')];
  const canEdit = [authenticate, requirePermission('students', 'edit')];
  const canDelete = [authenticate, requirePermission('students', 'delete')];
  const canExport = [authenticate, requirePermission('students', 'export')];

  /* ---------- list / search / filter ---------- */
  app.get('/api/students', canRead, h(async (req, res) => {
    const { qy, class: cls, section, gender, blood_group, transport_route, fee_status, min_attendance, status } = req.query;
    const where = [], params = [];
    const add = (cond, val) => { params.push(val); where.push(cond.replace('?', `$${params.length}`)); };
    if (qy) { params.push(`%${qy}%`); where.push(`(s.name ILIKE $${params.length} OR s.roll_number ILIKE $${params.length} OR s.admission_number ILIKE $${params.length} OR EXISTS (SELECT 1 FROM student_guardians g WHERE g.student_id=s.id AND g.phone ILIKE $${params.length}))`); }
    if (cls) add('s.class=?', cls);
    if (section) add('s.section=?', section);
    if (gender) add('s.gender=?', gender);
    if (blood_group) add('s.blood_group=?', blood_group);
    if (transport_route) add('s.transport_route=?', transport_route);
    if (fee_status) add('s.fee_status=?', fee_status);
    if (status) add('s.status=?', status);
    if (min_attendance) add('s.attendance_pct >= ?', Number(min_attendance));
    const sql = `
      SELECT s.id, s.admission_number, s.roll_number, s.name, s.class, s.section, s.gender,
             s.blood_group, s.transport_route, s.fee_status, s.attendance_pct, s.status, s.photo_url,
             a.dropout_risk, c.status AS card_status, c.wallet_balance
        FROM students s
        LEFT JOIN student_ai_scores a ON a.student_id=s.id
        LEFT JOIN id_cards c ON c.student_id=s.id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY s.class, s.section, s.name LIMIT 1000`;
    res.json((await q(sql, params)).rows);
  }));

  app.get('/api/students/stats', canRead, h(async (_req, res) => {
    const byStatus = await q('SELECT status, count(*)::int n FROM students GROUP BY status');
    const byClass = await q('SELECT class, count(*)::int n FROM students GROUP BY class ORDER BY class');
    const atRisk = await q('SELECT count(*)::int n FROM student_ai_scores WHERE dropout_risk >= 65');
    const total = await q('SELECT count(*)::int n FROM students');
    res.json({ total: total.rows[0].n, byStatus: byStatus.rows, byClass: byClass.rows, atRisk: atRisk.rows[0].n });
  }));

  /* ---------- saved filters ---------- */
  app.get('/api/students/filters', canRead, h(async (req, res) =>
    res.json((await q('SELECT * FROM saved_filters WHERE user_email=$1 ORDER BY created_at DESC', [req.user.email])).rows)));
  app.post('/api/students/filters', canRead, h(async (req, res) => {
    const { name, filter } = req.body || {};
    const { rows } = await q('INSERT INTO saved_filters (user_email, name, filter) VALUES ($1,$2,$3) RETURNING *', [req.user.email, name, JSON.stringify(filter)]);
    res.status(201).json(rows[0]);
  }));
  app.delete('/api/students/filters/:id', canRead, h(async (req, res) => { await q('DELETE FROM saved_filters WHERE id=$1 AND user_email=$2', [req.params.id, req.user.email]); res.json({ ok: true }); }));

  /* ---------- create (wizard submit) ---------- */
  app.post('/api/students', canWrite, h(async (req, res) => {
    const b = req.body || {};
    const adm = b.admission_number || `ADM${Date.now()}`;
    const { rows } = await q(
      `INSERT INTO students (admission_number, roll_number, name, dob, gender, nationality, religion, blood_group,
         address, phone, email, emergency1_name, emergency1_phone, emergency2_name, emergency2_phone,
         class, section, admission_date, prev_school, prev_tc_number, prev_percentage, status, transport_route, fee_status, attendance_pct)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,'Active',$22,$23,$24) RETURNING *`,
      [adm, b.roll_number, b.name, b.dob || null, b.gender, b.nationality || 'Indian', b.religion, b.blood_group,
       b.address, b.phone, b.email, b.emergency1_name, b.emergency1_phone, b.emergency2_name, b.emergency2_phone,
       b.class, b.section, b.admission_date || null, b.prev_school, b.prev_tc_number, b.prev_percentage || null,
       b.transport_route || 'Day Scholar', b.fee_status || 'Paid', b.attendance_pct ?? 100]);
    const s = rows[0];
    // guardian
    if (b.guardian?.name || b.guardian?.parent_user_id) {
      await q('INSERT INTO student_guardians (student_id, parent_user_id, name, relation, phone, email, is_primary) VALUES ($1,$2,$3,$4,$5,$6,TRUE)',
        [s.id, b.guardian.parent_user_id || null, b.guardian.name, b.guardian.relation, b.guardian.phone, b.guardian.email]);
    }
    // auto-issue card + ai
    await q('INSERT INTO id_cards (student_id, card_no, expires_at) VALUES ($1,$2,$3)', [s.id, `SSMS-${100000 + s.id}`, '2027-03-31']);
    await upsertAi(s);
    res.status(201).json({ id: s.id, admission_number: adm });
  }));

  app.get('/api/students/:id', canRead, h(async (req, res) => {
    const p = await profileOf(req.params.id);
    if (!p) return res.status(404).json({ message: 'not found' });
    res.json(p);
  }));
  app.put('/api/students/:id', canEdit, h(async (req, res) => {
    const allowed = ['name', 'roll_number', 'class', 'section', 'phone', 'email', 'address', 'status', 'transport_route', 'fee_status', 'attendance_pct', 'blood_group', 'gender'];
    const sets = [], params = [];
    for (const k of allowed) if (k in (req.body || {})) { params.push(req.body[k]); sets.push(`${k}=$${params.length}`); }
    if (sets.length) { params.push(req.params.id); await q(`UPDATE students SET ${sets.join(', ')} WHERE id=$${params.length}`, params); }
    const s = (await q('SELECT * FROM students WHERE id=$1', [req.params.id])).rows[0];
    if (s) await upsertAi(s);
    res.json({ ok: true });
  }));
  app.delete('/api/students/:id', canDelete, h(async (req, res) => { await q('DELETE FROM students WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));

  /* ---------- documents / photo (local disk) ---------- */
  app.post('/api/students/:id/photo', canWrite, upload.single('file'), h(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'no file' });
    const url = `/api/students/files/${req.params.id}/${req.file.filename}`;
    await q('UPDATE students SET photo_url=$2 WHERE id=$1', [req.params.id, url]);
    await q('INSERT INTO student_documents (student_id, kind, filename, original_name, mime, size_bytes) VALUES ($1,$2,$3,$4,$5,$6)',
      [req.params.id, 'photo', req.file.filename, req.file.originalname, req.file.mimetype, req.file.size]);
    res.json({ ok: true, photo_url: url });
  }));
  app.post('/api/students/:id/documents', canWrite, upload.single('file'), h(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'no file' });
    const { rows } = await q('INSERT INTO student_documents (student_id, kind, filename, original_name, mime, size_bytes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [req.params.id, req.body.kind || 'other', req.file.filename, req.file.originalname, req.file.mimetype, req.file.size]);
    res.status(201).json({ id: rows[0].id, name: req.file.originalname });
  }));
  app.get('/api/students/files/:id/:file', canRead, h(async (req, res) => {
    const f = join(UPLOAD_DIR, String(req.params.id), req.params.file.replace(/[^\w.\-]/g, ''));
    if (!existsSync(f)) return res.status(404).json({ message: 'not found' });
    res.sendFile(f);
  }));

  /* ---------- guardians ---------- */
  app.post('/api/students/:id/guardians', canWrite, h(async (req, res) => {
    const b = req.body || {};
    const { rows } = await q('INSERT INTO student_guardians (student_id, parent_user_id, name, relation, phone, email, is_primary) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.params.id, b.parent_user_id || null, b.name, b.relation, b.phone, b.email, !!b.is_primary]);
    res.status(201).json(rows[0]);
  }));

  /* ---------- AI ---------- */
  app.get('/api/students/:id/ai', canRead, h(async (req, res) =>
    res.json((await q('SELECT * FROM student_ai_scores WHERE student_id=$1', [req.params.id])).rows[0] || null)));
  app.post('/api/students/:id/ai/recompute', canWrite, h(async (req, res) => {
    const s = (await q('SELECT * FROM students WHERE id=$1', [req.params.id])).rows[0];
    if (!s) return res.status(404).json({ message: 'not found' });
    const sc = await upsertAi(s);
    // refresh anomaly alerts
    await q('DELETE FROM anomaly_alerts WHERE student_id=$1 AND acknowledged=FALSE', [s.id]);
    for (const a of detectAnomalies(s)) await q('INSERT INTO anomaly_alerts (student_id, kind, severity, message) VALUES ($1,$2,$3,$4)', [s.id, a.kind, a.severity, a.message]);
    res.json({ ok: true, ...sc, note: 'Heuristic scoring (no ML model connected).' });
  }));

  /* ---------- ID card / wallet ---------- */
  app.post('/api/students/:id/card/issue', canWrite, h(async (req, res) => {
    const { rows } = await q(
      `INSERT INTO id_cards (student_id, card_no, status, expires_at) VALUES ($1,$2,'active',$3)
       ON CONFLICT (student_id) DO UPDATE SET status='active', issued_at=now(), expires_at=$3, card_no=EXCLUDED.card_no RETURNING *`,
      [req.params.id, `SSMS-${100000 + Number(req.params.id)}`, '2027-03-31']);
    res.json(rows[0]);
  }));
  app.post('/api/students/:id/card/topup', canEdit, h(async (req, res) => {
    const amount = Number(req.body?.amount);
    if (!(amount > 0)) return res.status(400).json({ message: 'amount must be > 0' });
    const card = (await q('SELECT * FROM id_cards WHERE student_id=$1', [req.params.id])).rows[0];
    if (!card) return res.status(404).json({ message: 'no card — issue one first' });
    const bal = Number(card.wallet_balance) + amount;
    await q('UPDATE id_cards SET wallet_balance=$2 WHERE id=$1', [card.id, bal]);
    await q('INSERT INTO card_transactions (card_id, type, amount, balance_after, note) VALUES ($1,$2,$3,$4,$5)', [card.id, 'topup', amount, bal, 'Wallet top-up']);
    res.json({ ok: true, balance: bal });
  }));

  /* ---------- bulk operations ---------- */
  app.post('/api/students/bulk/import', canWrite, h(async (req, res) => {
    const rows = Array.isArray(req.body?.students) ? req.body.students : [];
    const report = { total: rows.length, created: 0, failed: 0, errors: [], warnings: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.name) { report.failed++; report.errors.push({ row: i + 1, error: 'missing name' }); continue; }
      const adm = r.admission_number || `ADM${Date.now()}${i}`;
      if (!r.class) report.warnings.push({ row: i + 1, warning: 'no class — left blank' });
      try {
        const ins = await q('INSERT INTO students (admission_number, roll_number, name, class, section, gender, fee_status, attendance_pct) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
          [adm, r.roll_number || null, r.name, r.class || null, r.section || null, r.gender || null, r.fee_status || 'Paid', r.attendance_pct ?? 100]);
        await q('INSERT INTO id_cards (student_id, card_no, expires_at) VALUES ($1,$2,$3)', [ins.rows[0].id, `SSMS-${100000 + ins.rows[0].id}`, '2027-03-31']);
        await upsertAi(ins.rows[0]);
        report.created++;
      } catch (e) { report.failed++; report.errors.push({ row: i + 1, error: e.message }); }
    }
    res.json(report);
  }));
  app.post('/api/students/bulk/promote', canEdit, h(async (req, res) => {
    const { fromClass, toClass, exceptions } = req.body || {};
    const ex = Array.isArray(exceptions) ? exceptions : [];
    const r = await q(`UPDATE students SET class=$2 WHERE class=$1 AND status='Active' AND NOT (id = ANY($3::int[]))`, [fromClass, toClass, ex]);
    res.json({ ok: true, promoted: r.rowCount, detained: ex.length });
  }));
  app.post('/api/students/bulk/tc', canExport, h(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const { rows } = await q('SELECT id, name, admission_number, class, section, admission_date FROM students WHERE id = ANY($1::int[])', [ids]);
    const certs = rows.map((s) => ({ ...s, tc_number: `TC/2025/${String(s.id).padStart(4, '0')}`, issued: new Date().toISOString().slice(0, 10) }));
    res.json({ count: certs.length, certificates: certs });
  }));
  app.post('/api/students/bulk/notify', canWrite, h(async (req, res) => {
    const { ids, channel, message } = req.body || {};
    res.json({ ok: true, sent: (ids || []).length, channel: channel || 'email', preview: message, note: 'Sending is simulated (no SMS/email provider connected).' });
  }));

  startAiWorker();
}
