import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, q } from './db.js';
import { WALLET_KEY } from './wallet-ledger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
let txnSeq = 0;

async function txn(header, entries) {
  const ref = 'WTX' + Date.now() + (txnSeq++);
  const { rows } = await q(
    `INSERT INTO wallet_txns (ref, kind, student_id, module, amount, cash_part, method, vendor, location, created_by, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'seed',$10) RETURNING id`,
    [ref, header.kind, header.student_id, header.module, header.amount, 0, header.method || 'wallet', header.vendor || null, header.location || null, header.created_at]);
  for (const e of entries) await q(`INSERT INTO ledger_entries (txn_id, account_id, direction, amount, created_at) VALUES ($1,$2,$3,$4,$5)`,
    [rows[0].id, e.account_id, e.direction, e.amount, header.created_at]);
}

async function main() {
  console.log('› Applying wallet schema (+pgcrypto)…');
  await q(readFileSync(join(__dirname, 'wallet-schema.sql'), 'utf8'));
  console.log('› Resetting wallet tables…');
  await q(`TRUNCATE wallet_accounts, wallet_txns, ledger_entries, card_templates, spending_controls, fraud_alerts, disputes, refunds RESTART IDENTITY CASCADE`);

  console.log('› System accounts…');
  const sys = {};
  for (const name of ['bank', 'canteen', 'library', 'store', 'sports', 'refund_pool']) {
    sys[name] = (await q(`INSERT INTO wallet_accounts (kind, name) VALUES ('system',$1) RETURNING id`, [name])).rows[0].id;
  }

  const students = (await q('SELECT id FROM students WHERE id IN (SELECT student_id FROM id_cards)')).rows;
  console.log(`› Wallet accounts + history for ${students.length} students…`);
  const modules = ['canteen', 'canteen', 'canteen', 'library', 'store', 'sports'];
  const vendors = { canteen: 'Canteen Counter', library: 'Library Desk', store: 'Stationery Store', sports: 'Sports Room' };

  for (const s of students) {
    const acctId = (await q(`INSERT INTO wallet_accounts (student_id, kind, name) VALUES ($1,'student',NULL) RETURNING id`, [s.id])).rows[0].id;
    // 2-3 top-ups over the month
    for (let i = 0; i < ri(2, 3); i++) {
      const d = new Date(); d.setDate(d.getDate() - ri(1, 28));
      const amt = pick([200, 300, 500, 1000]);
      await txn({ kind: 'topup', student_id: s.id, module: 'bank', amount: amt, method: 'upi', created_at: d.toISOString() },
        [{ account_id: acctId, direction: 'credit', amount: amt }, { account_id: sys.bank, direction: 'debit', amount: amt }]);
    }
    // ~8-16 small purchases
    for (let i = 0; i < ri(8, 16); i++) {
      const d = new Date(); d.setDate(d.getDate() - ri(0, 28)); d.setHours(ri(8, 16), ri(0, 59));
      const mod = pick(modules);
      const amt = mod === 'canteen' ? ri(15, 60) : mod === 'store' ? ri(20, 150) : ri(10, 40);
      await txn({ kind: 'purchase', student_id: s.id, module: mod, amount: amt, vendor: vendors[mod], location: vendors[mod], created_at: d.toISOString() },
        [{ account_id: acctId, direction: 'debit', amount: amt }, { account_id: sys[mod], direction: 'credit', amount: amt }]);
    }
  }

  console.log('› Encrypting balance snapshots (pgcrypto)…');
  await q(`UPDATE wallet_accounts a SET balance_cipher = pgp_sym_encrypt(
             COALESCE((SELECT SUM(CASE direction WHEN 'credit' THEN amount ELSE -amount END) FROM ledger_entries WHERE account_id=a.id),0)::text, $1)`,
    [WALLET_KEY]);

  console.log('› Card templates + sample parental controls…');
  const layout = JSON.stringify([
    { field: 'logo', label: 'Logo', x: 250, y: 14, w: 56, h: 56 }, { field: 'photo', label: 'Photo', x: 16, y: 16, w: 84, h: 100 },
    { field: 'name', label: 'Name', x: 112, y: 22 }, { field: 'class', label: 'Class', x: 112, y: 52 }, { field: 'roll', label: 'Roll', x: 112, y: 74 },
    { field: 'qr', label: 'QR', x: 250, y: 120, w: 74, h: 74 }, { field: 'nfc', label: 'NFC', x: 16, y: 140, w: 44, h: 32 }, { field: 'emergency', label: 'Emergency', x: 16, y: 182 },
  ]);
  await q(`INSERT INTO card_templates (name, kind, layout, is_default) VALUES ('Student Standard','student',$1,TRUE),('Staff Card','staff',$1,FALSE),('Visitor Pass','visitor',$1,FALSE)`, [layout]);
  for (const s of students.slice(0, 6)) {
    await q(`INSERT INTO spending_controls (student_id, category, daily_limit, monthly_budget, blocked) VALUES ($1,'canteen',100,2000,FALSE) ON CONFLICT DO NOTHING`, [s.id]);
  }
  await q(`INSERT INTO spending_controls (student_id, category, blocked) VALUES ((SELECT id FROM students WHERE id IN (SELECT student_id FROM id_cards) LIMIT 1),'store',TRUE) ON CONFLICT (student_id,category) DO UPDATE SET blocked=TRUE`);

  const c = await q(`SELECT (SELECT count(*) FROM wallet_accounts) acc, (SELECT count(*) FROM wallet_txns) tx, (SELECT count(*) FROM ledger_entries) le`);
  console.log('✓ Wallet seed complete:', c.rows[0]);
  await pool.end();
}
main().catch((e) => { console.error('✗ wallet seed failed:', e); process.exit(1); });
