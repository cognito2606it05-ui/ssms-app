import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, q } from './db.js';
import { ensureFeeSystemAccounts, sysAcct, receivableAcct, postFeeTxn } from './fee-ledger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const FEE_TYPES = [
  ['Tuition', '999293', 0, 45000], ['Transport', '996412', 0, 12000], ['Hostel', '996311', 0, 60000],
  ['Library', '999293', 0, 1500], ['Lab', '999293', 18, 5000], ['Sports', '999293', 0, 2000], ['Miscellaneous', '999799', 18, 1000],
];

async function main() {
  console.log('› Applying fee schema…');
  await q(readFileSync(join(__dirname, 'fees-schema.sql'), 'utf8'));
  console.log('› Resetting fee tables…');
  await q(`TRUNCATE fee_types, fee_structures, concessions, late_fee_rules, installment_plans, invoices, invoice_items,
           fee_payments, fee_idempotency, fee_webhook_events, fee_accounts, fee_ledger_txns, fee_ledger_entries,
           fee_followups, fee_settings RESTART IDENTITY CASCADE`);

  const client = await pool.connect();
  try {
    await ensureFeeSystemAccounts(client);
    const revenue = await sysAcct(client, 'fee_revenue'), cash = await sysAcct(client, 'cash_bank');

    console.log('› Fee types + structures…');
    const typeId = {};
    for (const [name, hsn, gst, amt] of FEE_TYPES) {
      typeId[name] = (await q('INSERT INTO fee_types (name, hsn_code, gst_rate, default_amount) VALUES ($1,$2,$3,$4) RETURNING id', [name, hsn, gst, amt])).rows[0].id;
    }
    for (const cls of ['8', '9', '10', '11', '12']) {
      await q('INSERT INTO fee_structures (name, fee_type_id, amount, academic_year, applies_class, frequency) VALUES ($1,$2,$3,$4,$5,$6)',
        [`Tuition ${cls}`, typeId.Tuition, 40000 + Number(cls) * 1000, '2025-2026', cls, 'annual']);
    }
    await q('INSERT INTO fee_structures (name, fee_type_id, amount, academic_year, applies_group, frequency) VALUES ($1,$2,$3,$4,$5,$6)',
      ['Transport (bus users)', typeId.Transport, 12000, '2025-2026', 'Bus Users', 'annual']);
    await q('INSERT INTO late_fee_rules (fee_type_id, kind, value, grace_days, max_cap) VALUES ($1,$2,$3,$4,$5)', [typeId.Tuition, 'pct_per_day', 0.5, 5, 5000]);
    await q(`INSERT INTO installment_plans (name, structure_id, splits) VALUES ('Quarterly', 1, $1)`,
      [JSON.stringify([{ label: 'Q1', pct: 25, due_date: '2025-07-10' }, { label: 'Q2', pct: 25, due_date: '2025-10-10' }, { label: 'Q3', pct: 25, due_date: '2026-01-10' }, { label: 'Q4', pct: 25, due_date: '2026-04-10' }])]);
    await q(`INSERT INTO fee_settings (key, value) VALUES ('hold_services', $1)`, [JSON.stringify({ enabled: true, block_wallet_after_days: 30, modules: ['canteen', 'library'] })]);

    console.log('› Concessions…');
    const students = (await q('SELECT id, name, class, section, transport_route FROM students')).rows;
    for (const s of students.slice(0, 5)) {
      const dt = pick(['pct', 'flat']);
      const val = dt === 'pct' ? pick([10, 15, 25]) : pick([5000, 2000, 8000]);
      await q('INSERT INTO concessions (student_id, kind, disc_type, value, reason) VALUES ($1,$2,$3,$4,$5)',
        [s.id, pick(['scholarship', 'staff_ward', 'sibling']), dt, val, 'seed concession']);
    }
    const concMap = {};
    for (const c of (await q('SELECT * FROM concessions')).rows) concMap[c.student_id] = c;

    console.log(`› Invoices + payments for ${students.length} students…`);
    let invNo = 1000;
    for (const s of students) {
      const recv = await receivableAcct(client, s.id);
      // build items: tuition + (transport if bus) + occasional lab
      const items = [{ type: 'Tuition', amount: 40000 + Number(s.class || 9) * 1000 }];
      if (s.transport_route && s.transport_route !== 'Day Scholar') items.push({ type: 'Transport', amount: 12000 });
      if (Math.random() < 0.4) items.push({ type: 'Lab', amount: 5000 });
      let base = items.reduce((t, i) => t + i.amount, 0);
      // concession
      let discount = 0; const c = concMap[s.id];
      if (c) discount = c.disc_type === 'pct' ? Math.round(base * Number(c.value) / 100) : Number(c.value);
      discount = Math.min(discount, base);
      const netBase = base - discount;
      // tax per item (proportional on net)
      let tax = 0; const itemRows = [];
      for (const it of items) {
        const ft = FEE_TYPES.find((f) => f[0] === it.type); const gst = ft[2];
        const itemNet = Math.round(it.amount * (netBase / base));
        const t = Math.round(itemNet * gst / 100); tax += t;
        itemRows.push({ type: it.type, hsn: ft[1], net: itemNet, gst, tax: t });
      }
      const total = netBase + tax;
      const overdueDays = pick([-20, -5, 10, 35, 70, 0, 0]); // negative = future due
      const due = new Date(); due.setDate(due.getDate() - overdueDays);
      const created = new Date(); created.setDate(created.getDate() - Math.max(0, overdueDays) - 10);
      const inv = (await q(`INSERT INTO invoices (invoice_no, student_id, academic_year, status, base, discount, tax, total, due_date, gstin, created_at)
                            VALUES ($1,$2,'2025-2026','sent',$3,$4,$5,$6,$7,'29ABCDE1234F1Z5',$8) RETURNING *`,
        [`INV-2025-${invNo++}`, s.id, netBase, discount, tax, total, due.toISOString().slice(0, 10), created.toISOString()])).rows[0];
      for (const ir of itemRows) await q('INSERT INTO invoice_items (invoice_id, fee_type_id, description, hsn_code, amount, gst_rate, tax_amount) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [inv.id, typeId[ir.type], ir.type + ' fee', ir.hsn, ir.net, ir.gst, ir.tax]);
      // ledger: invoice raised
      await postFeeTxn(client, { ref: inv.invoice_no, kind: 'invoice', student_id: s.id, amount: total }, [{ account_id: recv, direction: 'debit', amount: total }, { account_id: revenue, direction: 'credit', amount: total }]);

      // payment: ~60% pay full, ~20% partial, ~20% none
      const r = Math.random();
      let paid = 0;
      if (r < 0.6) paid = total; else if (r < 0.8) paid = Math.round(total * pick([0.3, 0.5, 0.7]));
      if (paid > 0) {
        await q(`INSERT INTO fee_payments (receipt_no, invoice_id, student_id, amount, method, status, created_by) VALUES ($1,$2,$3,$4,$5,'success','seed')`,
          [`RCPT-${invNo}`, inv.id, s.id, paid, pick(['upi', 'cash', 'card'])]);
        await q(`UPDATE invoices SET paid=$2, status=$3 WHERE id=$1`, [inv.id, paid, paid >= total ? 'paid' : 'partial']);
        await postFeeTxn(client, { ref: 'PAY-' + inv.invoice_no, kind: 'payment', student_id: s.id, amount: paid }, [{ account_id: cash, direction: 'debit', amount: paid }, { account_id: recv, direction: 'credit', amount: paid }]);
      }
      if (paid < total && overdueDays > 0) await q(`UPDATE invoices SET status='overdue' WHERE id=$1 AND paid<total`, [inv.id]);
    }
  } finally { client.release(); }

  const c = await q(`SELECT (SELECT count(*) FROM invoices) inv, (SELECT count(*) FROM fee_payments) pay,
                     (SELECT count(*) FROM fee_ledger_entries) le, (SELECT count(*) FROM fee_types) ft`);
  console.log('✓ Fee seed complete:', c.rows[0]);
  await pool.end();
}
main().catch((e) => { console.error('✗ fee seed failed:', e); process.exit(1); });
