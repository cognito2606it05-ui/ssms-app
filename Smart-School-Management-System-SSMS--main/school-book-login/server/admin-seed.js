import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, q } from './db.js';
import { encrypt } from './vault.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log('› Applying admin schema…');
  await q(readFileSync(join(__dirname, 'admin-schema.sql'), 'utf8'));

  console.log('› Resetting admin tables…');
  await q(`TRUNCATE transactions, settings, fee_structures, notification_templates,
           integration_credentials, holidays, login_attempts, data_export_log,
           erasure_requests, audit_log, sessions, backups RESTART IDENTITY`);

  console.log('› Settings…');
  const settings = {
    institution: { name: 'Greenwood Smart Institute', logo: '', academic_year: '2025-2026', timezone: 'Asia/Kolkata', currency: 'INR' },
    security: { session_timeout_min: 30, password_min_len: 8, force_2fa_admins: true },
  };
  for (const [k, v] of Object.entries(settings)) {
    await q('INSERT INTO settings (key, value) VALUES ($1,$2)', [k, JSON.stringify(v)]);
  }

  console.log('› Fee structures…');
  for (const f of [
    ['Tuition Fee', 45000, 'All Students', 'annual'],
    ['Transport Fee', 12000, 'Bus Users', 'annual'],
    ['Hostel Fee', 60000, 'Hostelers', 'annual'],
    ['Lab Fee', 5000, 'Science Stream', 'annual'],
    ['Exam Fee', 1500, 'All Students', 'one-time'],
  ]) await q('INSERT INTO fee_structures (name, amount, applies_to, frequency) VALUES ($1,$2,$3,$4)', f);

  console.log('› Notification templates…');
  for (const t of [
    ['email', 'Fee Reminder', 'Fee due for {{student_name}}', 'Dear {{parent_name}}, fees of {{amount}} for {{student_name}} are due on {{due_date}}.'],
    ['sms', 'Absence Alert', null, '{{student_name}} was marked absent on {{date}}.'],
    ['whatsapp', 'Exam Schedule', null, 'Hi {{parent_name}}, {{student_name}}\'s exams start {{exam_date}}.'],
  ]) await q('INSERT INTO notification_templates (channel, name, subject, body) VALUES ($1,$2,$3,$4)', t);

  console.log('› Integration credentials (encrypted)…');
  for (const [p, key] of [
    ['Razorpay', 'rzp_live_8f2k39dKEYsample1234'],
    ['Twilio SMS', 'SK9a8b7c6d5eSAMPLEtoken'],
    ['SMTP / Email', 'smtp-pass-SAMPLE-secret-99'],
  ]) await q('INSERT INTO integration_credentials (provider, key_cipher) VALUES ($1,$2)', [p, encrypt(key)]);

  console.log('› Holidays / calendar…');
  for (const h of [
    ['Independence Day', '2025-08-15', 'holiday'],
    ['Mid-Term Exams', '2025-09-22', 'exam'],
    ['Diwali Break', '2025-10-20', 'holiday'],
    ['Annual Sports Day', '2025-12-05', 'event'],
    ['Final Exams', '2026-03-10', 'exam'],
  ]) await q('INSERT INTO holidays (title, date, kind) VALUES ($1,$2,$3)', h);

  console.log('› Transactions (180)…');
  const modules = ['fees', 'canteen', 'store', 'transport', 'hostel', 'library'];
  const methods = ['card', 'upi', 'netbanking', 'cash'];
  const statuses = ['success', 'success', 'success', 'success', 'pending', 'failed'];
  for (let i = 0; i < 180; i++) {
    const daysAgo = Math.floor(rand(0, 365));
    const mod = pick(modules);
    const amt = mod === 'fees' ? Math.round(rand(5000, 60000)) : Math.round(rand(50, 3000));
    await q(
      `INSERT INTO transactions (ref, description, amount, role, module, method, status, gateway_ref, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now() - ($9 || ' days')::interval)`,
      [`TXN${100000 + i}`, `${mod} payment`, amt, pick(['parent', 'student', 'admin_staff']), mod,
       pick(methods), pick(statuses), `pay_${Math.random().toString(36).slice(2, 12)}`, daysAgo],
    );
  }

  console.log('› Login attempts (failed + geo)…');
  const countries = ['India', 'India', 'India', 'United States', 'Russia', 'Nigeria', 'Germany'];
  for (let i = 0; i < 40; i++) {
    const ok = Math.random() > 0.55;
    await q(
      `INSERT INTO login_attempts (email, ip, success, country, created_at)
       VALUES ($1,$2,$3,$4, now() - ($5 || ' hours')::interval)`,
      [pick(['super_admin@ssms.local', 'teacher@ssms.local', 'unknown@bad.com', 'attacker@evil.io']),
       `${Math.floor(rand(1, 240))}.${Math.floor(rand(1, 240))}.${Math.floor(rand(1, 240))}.${Math.floor(rand(1, 240))}`,
       ok, pick(countries), Math.floor(rand(0, 72))],
    );
  }

  console.log('› Sample audit + export log…');
  for (const a of [
    ['super_admin@ssms.local', 'super_admin', 'settings.update', 'institution', '{"field":"timezone"}'],
    ['admin_staff@ssms.local', 'admin_staff', 'user.create', 'student#1042', '{}'],
    ['management@ssms.local', 'management', 'fee.approve', 'TXN100021', '{}'],
  ]) await q('INSERT INTO audit_log (actor_email, actor_role, action, target, ip, meta) VALUES ($1,$2,$3,$4,$5,$6)',
       [a[0], a[1], a[2], a[3], '127.0.0.1', a[4]]);
  await q(`INSERT INTO data_export_log (actor_email, dataset, rows, ip) VALUES
           ('super_admin@ssms.local','transactions',180,'127.0.0.1'),
           ('admin_staff@ssms.local','students',1248,'10.0.0.5')`);

  const c = await q(`SELECT
     (SELECT count(*) FROM transactions) tx,
     (SELECT count(*) FROM login_attempts) la,
     (SELECT count(*) FROM fee_structures) fs,
     (SELECT count(*) FROM notification_templates) nt`);
  console.log('✓ Admin seed complete:', c.rows[0]);
  await pool.end();
}

main().catch((e) => { console.error('✗ admin seed failed:', e); process.exit(1); });
