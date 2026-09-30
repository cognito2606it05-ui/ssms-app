import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, q } from './db.js';
import { computeScores, detectAnomalies } from './student-ai.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

const FIRST = ['Aarav', 'Diya', 'Vivaan', 'Ananya', 'Aditya', 'Ishaan', 'Saanvi', 'Kabir', 'Myra', 'Reyansh', 'Aadhya', 'Arjun', 'Kiara', 'Vihaan', 'Anika', 'Rohan', 'Sara', 'Dhruv', 'Pari', 'Krish'];
const LAST = ['Sharma', 'Verma', 'Nair', 'Iyer', 'Patel', 'Reddy', 'Khan', 'Gupta', 'Mehta', 'Das'];
const CLASSES = ['8', '9', '10', '11', '12'];
const SECTIONS = ['A', 'B', 'C'];
const BLOOD = ['A+', 'B+', 'O+', 'AB+', 'A-', 'O-'];
const ROUTES = ['Route 1 - North', 'Route 2 - East', 'Route 3 - South', 'Day Scholar'];
const FEE = ['Paid', 'Paid', 'Partial', 'Overdue'];
const STATUS = ['Active', 'Active', 'Active', 'Inactive', 'Transferred'];

async function main() {
  console.log('› Applying students schema…');
  await q(readFileSync(join(__dirname, 'students-schema.sql'), 'utf8'));

  console.log('› Resetting student tables…');
  await q(`TRUNCATE students, student_documents, student_guardians, id_cards,
           card_transactions, student_ai_scores, anomaly_alerts, saved_filters RESTART IDENTITY CASCADE`);

  // a parent user to link guardians to (from RBAC seed)
  const parent = (await q("SELECT id FROM users WHERE email='parent@ssms.local'")).rows[0];

  console.log('› Seeding 30 students…');
  for (let i = 1; i <= 30; i++) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    const cls = pick(CLASSES), sec = pick(SECTIONS);
    const att = ri(45, 100);
    const fee = pick(FEE);
    const status = pick(STATUS);
    const { rows } = await q(
      `INSERT INTO students
        (admission_number, roll_number, name, dob, gender, nationality, religion, blood_group,
         address, phone, email, emergency1_name, emergency1_phone, class, section, admission_date,
         prev_school, prev_percentage, status, transport_route, fee_status, attendance_pct)
       VALUES ($1,$2,$3,$4,$5,'Indian',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [`ADM2025${String(1000 + i)}`, String(ri(1, 40)), name,
       `${ri(2007, 2016)}-${String(ri(1, 12)).padStart(2, '0')}-${String(ri(1, 28)).padStart(2, '0')}`,
       pick(['Male', 'Female']), pick(['Hindu', 'Muslim', 'Christian', 'Sikh']), pick(BLOOD),
       `${ri(1, 99)} Park Street, Bengaluru`, `9${ri(100000000, 999999999)}`, `${name.split(' ')[0].toLowerCase()}@student.ssms.local`,
       `${pick(FIRST)} ${pick(LAST)}`, `9${ri(100000000, 999999999)}`, cls, sec,
       `2025-06-${String(ri(1, 28)).padStart(2, '0')}`, pick(['St. Mary\'s', 'DPS', 'Greenfield', null]), ri(55, 95),
       status, pick(ROUTES), fee, att],
    );
    const s = rows[0];

    // guardian
    await q('INSERT INTO student_guardians (student_id, parent_user_id, name, relation, phone, is_primary) VALUES ($1,$2,$3,$4,$5,TRUE)',
      [s.id, i % 4 === 0 && parent ? parent.id : null, `${pick(FIRST)} ${name.split(' ')[1]}`, pick(['Father', 'Mother', 'Guardian']), `9${ri(100000000, 999999999)}`]);

    // id card + wallet
    const bal = ri(0, 2000);
    const card = (await q(
      `INSERT INTO id_cards (student_id, card_no, status, wallet_balance, expires_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [s.id, `SSMS-${String(100000 + i)}`, pick(['active', 'active', 'active', 'blocked', 'expired']), bal, '2027-03-31'],
    )).rows[0];
    if (bal > 0) await q('INSERT INTO card_transactions (card_id, type, amount, balance_after, note) VALUES ($1,$2,$3,$4,$5)', [card.id, 'topup', bal, bal, 'Initial top-up']);

    // ai scores + anomalies
    const sc = computeScores(s);
    await q(`INSERT INTO student_ai_scores (student_id, dropout_risk, engagement, predicted_grade, learning_style, recommendations)
             VALUES ($1,$2,$3,$4,$5,$6)`, [s.id, sc.dropout_risk, sc.engagement, sc.predicted_grade, sc.learning_style, JSON.stringify(sc.recommendations)]);
    for (const a of detectAnomalies(s)) await q('INSERT INTO anomaly_alerts (student_id, kind, severity, message) VALUES ($1,$2,$3,$4)', [s.id, a.kind, a.severity, a.message]);
  }

  const c = await q('SELECT (SELECT count(*) FROM students) s, (SELECT count(*) FROM id_cards) c, (SELECT count(*) FROM anomaly_alerts) a');
  console.log('✓ Students seed complete:', c.rows[0]);
  await pool.end();
}
main().catch((e) => { console.error('✗ students seed failed:', e); process.exit(1); });
