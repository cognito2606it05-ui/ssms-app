import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';
import { pool, q } from './db.js';
import { encrypt } from './vault.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rnd = () => Math.random();

async function main() {
  console.log('› Applying attendance schema…');
  await q(readFileSync(join(__dirname, 'attendance-schema.sql'), 'utf8'));
  console.log('› Resetting attendance tables…');
  await q(`TRUNCATE attendance, attendance_sessions, attendance_audit, biometric_devices,
           biometric_sync_logs, face_enrollments, face_review_queue, notification_prefs,
           notification_queue, staff_attendance RESTART IDENTITY CASCADE`);

  const students = (await q('SELECT id, attendance_pct, class, section FROM students')).rows;
  if (!students.length) { console.error('No students — run students-seed first.'); process.exit(1); }

  console.log(`› Generating ~30 days history for ${students.length} students…`);
  let rows = 0;
  for (let d = 30; d >= 1; d--) {
    const date = new Date(); date.setDate(date.getDate() - d);
    const dow = date.getDay();
    if (dow === 0) continue; // skip Sunday
    const iso = date.toISOString().slice(0, 10);
    const mondayPenalty = dow === 1 ? 0.12 : 0;
    for (const s of students) {
      const presentRate = Math.max(0.3, Number(s.attendance_pct) / 100 - mondayPenalty);
      const r = rnd();
      let status;
      if (r < presentRate * 0.88) status = 'present';
      else if (r < presentRate) status = 'late';
      else if (r < presentRate + 0.06) status = 'leave';
      else status = 'absent';
      await q(`INSERT INTO attendance (student_id, attendance_date, period_id, status, marked_by, marking_method, ts)
               VALUES ($1, $2::date, 'P1', $3, 'system', 'manual', ($2::date + time '09:00'))
               ON CONFLICT DO NOTHING`, [s.id, iso, status]);
      rows++;
    }
  }

  console.log('› Biometric devices…');
  for (const dv of [['BIO-001', 'Main Gate Fingerprint', 'fingerprint'], ['BIO-002', 'Lab Face Scanner', 'face'], ['RFID-001', 'Library RFID', 'rfid']]) {
    await q('INSERT INTO biometric_devices (device_id, name, type, api_key) VALUES ($1,$2,$3,$4)',
      [dv[0], dv[1], dv[2], 'dev_' + crypto.randomBytes(8).toString('hex')]);
  }

  console.log('› Face enrollments (consent + encrypted template)…');
  for (const s of students.slice(0, 20)) {
    await q(`INSERT INTO face_enrollments (student_id, consent, consent_at, template_cipher, template_version)
             VALUES ($1, TRUE, now(), $2, 'v1')`,
      [s.id, encrypt('FACE_TEMPLATE_' + s.id + '_' + crypto.randomBytes(16).toString('hex'))]);
  }

  console.log('› Notification prefs…');
  for (const s of students) await q('INSERT INTO notification_prefs (student_id) VALUES ($1) ON CONFLICT DO NOTHING', [s.id]);

  const c = await q('SELECT (SELECT count(*) FROM attendance) a, (SELECT count(*) FROM biometric_devices) d, (SELECT count(*) FROM face_enrollments) f');
  console.log('✓ Attendance seed complete:', { rows, ...c.rows[0] });
  await pool.end();
}
main().catch((e) => { console.error('✗ attendance seed failed:', e); process.exit(1); });
