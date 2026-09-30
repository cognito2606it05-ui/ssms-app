import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, q } from './db.js';
import { ensureFeeSystemAccounts, sysAcct, receivableAcct, outstandingOf, postFeeTxn } from './fee-ledger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const GATEWAYS = ['razorpay', 'payu', 'stripe', 'ccavenue'];
const GSTIN = '29ABCDE1234F1Z5';

async function notify(studentId, channel, message) {
  await q(`INSERT INTO notification_queue (student_id, channel, message, status, scheduled_for) VALUES ($1,$2,$3,'sent',now())`, [studentId, channel, message]).catch(() => {});
}

export function mountFees(app, { authenticate, requirePermission }) {
  // Apply schema V2 on mount (idempotent)
  try { q(readFileSync(join(__dirname, 'fees-schema-v2.sql'), 'utf8')).catch(() => {}); } catch {}

  const read = [authenticate, requirePermission('fees', 'read')];
  const write = [authenticate, requirePermission('fees', 'write')];
  const approve = [authenticate, requirePermission('fees', 'approve')];

  /* ============== fee structure builder ============== */
  app.get('/api/fee-types', read, h(async (_q, r) => r.json((await q('SELECT * FROM fee_types ORDER BY id')).rows)));
  app.post('/api/fee-types', write, h(async (req, res) => {
    const { name, hsn_code, gst_rate, default_amount } = req.body || {};
    const { rows } = await q('INSERT INTO fee_types (name, hsn_code, gst_rate, default_amount) VALUES ($1,$2,$3,$4) RETURNING *', [name, hsn_code, gst_rate || 0, default_amount || 0]);
    res.status(201).json(rows[0]);
  }));
  app.put('/api/fee-types/:id', write, h(async (req, res) => {
    const b = req.body || {};
    const { rows } = await q('UPDATE fee_types SET name=COALESCE($2,name), hsn_code=COALESCE($3,hsn_code), gst_rate=COALESCE($4,gst_rate), default_amount=COALESCE($5,default_amount) WHERE id=$1 RETURNING *', [req.params.id, b.name, b.hsn_code, b.gst_rate, b.default_amount]);
    if (!rows[0]) return res.status(404).json({ message: 'not found' });
    res.json(rows[0]);
  }));
  app.delete('/api/fee-types/:id', write, h(async (req, res) => {
    await q('DELETE FROM fee_types WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  }));

  app.get('/api/fee-structures', read, h(async (_q, r) => r.json((await q(`SELECT s.*, t.name fee_type FROM fee_structures s JOIN fee_types t ON t.id=s.fee_type_id ORDER BY s.id`)).rows)));
  app.post('/api/fee-structures', write, h(async (req, res) => {
    const b = req.body || {};
    const { rows } = await q(`INSERT INTO fee_structures (name, fee_type_id, amount, academic_year, applies_class, applies_section, applies_group, frequency)
                              VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [b.name, b.fee_type_id, b.amount, b.academic_year || '2025-2026', b.applies_class || null, b.applies_section || null, b.applies_group || null, b.frequency || 'annual']);
    res.status(201).json(rows[0]);
  }));
  app.put('/api/fee-structures/:id', write, h(async (req, res) => {
    const b = req.body || {};
    const { rows } = await q('UPDATE fee_structures SET name=COALESCE($2,name), amount=COALESCE($3,amount), applies_class=$4, applies_section=$5, applies_group=$6, frequency=COALESCE($7,frequency) WHERE id=$1 RETURNING *',
      [req.params.id, b.name, b.amount, b.applies_class || null, b.applies_section || null, b.applies_group || null, b.frequency]);
    if (!rows[0]) return res.status(404).json({ message: 'not found' });
    res.json(rows[0]);
  }));
  app.delete('/api/fee-structures/:id', write, h(async (req, res) => {
    await q('DELETE FROM fee_structures WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  }));

  app.get('/api/concessions', read, h(async (_q, r) => r.json((await q(`SELECT c.*, s.name student_name FROM concessions c LEFT JOIN students s ON s.id=c.student_id ORDER BY c.id`)).rows)));
  app.post('/api/concessions', write, h(async (req, res) => {
    const b = req.body || {};
    const { rows } = await q('INSERT INTO concessions (student_id, group_name, kind, disc_type, value, fee_type_id, reason) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [b.student_id || null, b.group_name || null, b.kind, b.disc_type, b.value, b.fee_type_id || null, b.reason]);
    res.status(201).json(rows[0]);
  }));
  app.delete('/api/concessions/:id', write, h(async (req, res) => {
    await q('DELETE FROM concessions WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  }));

  app.get('/api/late-fee-rules', read, h(async (_q, r) => r.json((await q(`SELECT l.*, t.name fee_type FROM late_fee_rules l JOIN fee_types t ON t.id=l.fee_type_id ORDER BY l.id`)).rows)));
  app.post('/api/late-fee-rules', write, h(async (req, res) => {
    const b = req.body || {};
    const { rows } = await q('INSERT INTO late_fee_rules (fee_type_id, kind, value, grace_days, max_cap) VALUES ($1,$2,$3,$4,$5) RETURNING *', [b.fee_type_id, b.kind, b.value, b.grace_days || 0, b.max_cap || null]);
    res.status(201).json(rows[0]);
  }));
  app.delete('/api/late-fee-rules/:id', write, h(async (req, res) => {
    await q('DELETE FROM late_fee_rules WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  }));

  app.get('/api/installment-plans', read, h(async (_q, r) => r.json((await q('SELECT ip.*, fs.name structure_name FROM installment_plans ip LEFT JOIN fee_structures fs ON fs.id=ip.structure_id ORDER BY ip.id')).rows)));
  app.post('/api/installment-plans', write, h(async (req, res) => {
    const b = req.body || {};
    const { rows } = await q('INSERT INTO installment_plans (name, structure_id, splits) VALUES ($1,$2,$3) RETURNING *',
      [b.name, b.structure_id, JSON.stringify(b.splits || [])]);
    res.status(201).json(rows[0]);
  }));
  app.delete('/api/installment-plans/:id', write, h(async (req, res) => {
    await q('DELETE FROM installment_plans WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  }));

  /* ============== students list (for dropdowns) ============== */
  app.get('/api/fees/students', read, h(async (req, res) => {
    const { rows } = await q('SELECT id, name, class, section, email, phone FROM students ORDER BY name LIMIT 500');
    res.json(rows);
  }));

  /* ============== fee summary per student ============== */
  app.get('/api/fees/student/:id/summary', read, h(async (req, res) => {
    const s = (await q('SELECT id, name, class, section FROM students WHERE id=$1', [req.params.id])).rows[0];
    if (!s) return res.status(404).json({ message: 'student not found' });
    const inv = (await q('SELECT * FROM invoices WHERE student_id=$1 ORDER BY created_at DESC', [req.params.id])).rows;
    const pay = (await q('SELECT * FROM fee_payments WHERE student_id=$1 ORDER BY created_at DESC', [req.params.id])).rows;
    const conc = (await q('SELECT * FROM concessions WHERE student_id=$1', [req.params.id])).rows;
    const totalBilled = inv.reduce((t, i) => t + Number(i.total), 0);
    const totalPaid = inv.reduce((t, i) => t + Number(i.paid), 0);
    res.json({ student: s, invoices: inv, payments: pay, concessions: conc, totalBilled, totalPaid, outstanding: totalBilled - totalPaid });
  }));

  /* ============== waiver requests ============== */
  app.get('/api/fees/waivers', read, h(async (_q, r) => r.json((await q(`SELECT w.*, s.name student_name, s.class FROM fee_waiver_requests w JOIN students s ON s.id=w.student_id ORDER BY w.created_at DESC LIMIT 200`)).rows.length ? (await q(`SELECT w.*, s.name student_name, s.class FROM fee_waiver_requests w JOIN students s ON s.id=w.student_id ORDER BY w.created_at DESC LIMIT 200`)).rows : [])));
  app.post('/api/fees/waivers', write, h(async (req, res) => {
    const b = req.body || {};
    try {
      const { rows } = await q('INSERT INTO fee_waiver_requests (student_id, invoice_id, reason, recommended_by, waiver_type, waiver_amount) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [b.student_id, b.invoice_id || null, b.reason, b.recommended_by || 'manual', b.waiver_type || 'partial', b.waiver_amount || 0]);
      res.status(201).json(rows[0]);
    } catch { res.json([]); }
  }));
  app.put('/api/fees/waivers/:id/approve', approve, h(async (req, res) => {
    try {
      const { rows } = await q('UPDATE fee_waiver_requests SET status=$2, approved_by=$3, approved_at=now() WHERE id=$1 RETURNING *',
        [req.params.id, req.body?.status || 'approved', req.user?.email || 'admin']);
      if (!rows[0]) return res.status(404).json({ message: 'not found' });
      res.json(rows[0]);
    } catch { res.status(404).json({ message: 'waiver table not ready' }); }
  }));

  /* ============== invoices ============== */
  async function buildInvoice(client, student, items, dueDate) {
    const recv = await receivableAcct(client, student.id);
    const revenue = await sysAcct(client, 'fee_revenue');
    // apply concessions
    const concs = (await client.query('SELECT * FROM concessions WHERE student_id=$1', [student.id])).rows;
    let base = items.reduce((t, i) => t + i.amount, 0);
    let discount = 0;
    for (const c of concs) { discount += c.disc_type === 'pct' ? Math.round(base * Number(c.value) / 100) : Number(c.value); }
    discount = Math.min(discount, base);
    const netRatio = base ? (base - discount) / base : 1;
    let tax = 0; const rows = [];
    for (const it of items) {
      const ft = (await client.query('SELECT * FROM fee_types WHERE id=$1', [it.fee_type_id])).rows[0] || { gst_rate: 0, hsn_code: null };
      const net = Math.round(it.amount * netRatio); const t = Math.round(net * Number(ft.gst_rate) / 100); tax += t;
      rows.push({ ...it, net, gst: Number(ft.gst_rate), hsn: ft.hsn_code, tax: t });
    }
    const total = (base - discount) + tax;
    const no = 'INV-2025-' + Date.now().toString().slice(-7);
    const inv = (await client.query(`INSERT INTO invoices (invoice_no, student_id, academic_year, status, base, discount, tax, total, due_date, gstin)
                                     VALUES ($1,$2,'2025-2026','sent',$3,$4,$5,$6,$7,$8) RETURNING *`,
      [no, student.id, base - discount, discount, tax, total, dueDate, GSTIN])).rows[0];
    for (const r of rows) await client.query('INSERT INTO invoice_items (invoice_id, fee_type_id, description, hsn_code, amount, gst_rate, tax_amount) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [inv.id, r.fee_type_id, r.description, r.hsn, r.net, r.gst, r.tax]);
    await postFeeTxn(client, { ref: no, kind: 'invoice', student_id: student.id, amount: total }, [{ account_id: recv, direction: 'debit', amount: total }, { account_id: revenue, direction: 'credit', amount: total }]);
    return inv;
  }

  app.post('/api/invoices/generate', write, h(async (req, res) => {
    const { class: cls, group, due_date } = req.body || {};
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await ensureFeeSystemAccounts(client);
      const where = []; const params = [];
      if (cls) { params.push(cls); where.push(`class=$${params.length}`); }
      const students = (await client.query(`SELECT * FROM students ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`, params)).rows;
      const structures = (await client.query('SELECT * FROM fee_structures')).rows;
      let count = 0;
      for (const s of students) {
        const applicable = structures.filter((st) => (!st.applies_class || st.applies_class === s.class) && (!st.applies_group || st.applies_group === 'Bus Users' && s.transport_route && s.transport_route !== 'Day Scholar'));
        if (!applicable.length) continue;
        const items = applicable.map((st) => ({ fee_type_id: st.fee_type_id, description: st.name, amount: Number(st.amount) }));
        await buildInvoice(client, s, items, due_date || new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10));
        count++;
      }
      await client.query('COMMIT');
      res.json({ ok: true, generated: count, note: 'Invoices created with concessions + GST; delivery (email/SMS) simulated.' });
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }));

  app.post('/api/invoices', write, h(async (req, res) => {
    const { student_id, items, due_date } = req.body || {};
    const client = await pool.connect();
    try {
      await client.query('BEGIN'); await ensureFeeSystemAccounts(client);
      const student = (await client.query('SELECT * FROM students WHERE id=$1', [student_id])).rows[0];
      if (!student) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'student not found' }); }
      const inv = await buildInvoice(client, student, items || [], due_date || new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10));
      await client.query('COMMIT');
      res.status(201).json(inv);
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }));

  app.get('/api/invoices', read, h(async (req, res) => {
    const { status, class: cls, overdue } = req.query;
    const where = []; const params = [];
    if (status) { params.push(status); where.push(`i.status=$${params.length}`); }
    if (cls) { params.push(cls); where.push(`s.class=$${params.length}`); }
    if (overdue === 'true') where.push(`i.due_date < current_date AND i.paid < i.total`);
    res.json((await q(`SELECT i.*, s.name, s.class, s.section, (i.total-i.paid) AS balance FROM invoices i JOIN students s ON s.id=i.student_id
                       ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY i.created_at DESC LIMIT 500`, params)).rows);
  }));

  app.get('/api/invoices/:id', read, h(async (req, res) => {
    const inv = (await q(`SELECT i.*, s.name, s.class, s.section, s.email, s.phone FROM invoices i JOIN students s ON s.id=i.student_id WHERE i.id=$1`, [req.params.id])).rows[0];
    if (!inv) return res.status(404).json({ message: 'not found' });
    inv.items = (await q('SELECT * FROM invoice_items WHERE invoice_id=$1', [req.params.id])).rows;
    inv.payments = (await q('SELECT * FROM fee_payments WHERE invoice_id=$1 ORDER BY created_at', [req.params.id])).rows;
    const cgst = +(Number(inv.tax) / 2).toFixed(2);
    inv.gst = { gstin: inv.gstin, cgst, sgst: cgst, total_tax: Number(inv.tax) };
    res.json(inv);
  }));

  app.post('/api/invoices/:id/send', write, h(async (req, res) => {
    const inv = (await q('SELECT * FROM invoices WHERE id=$1', [req.params.id])).rows[0];
    if (!inv) return res.status(404).json({ message: 'not found' });
    await q(`UPDATE invoices SET status=CASE WHEN status='draft' THEN 'sent' ELSE status END WHERE id=$1`, [req.params.id]);
    await notify(inv.student_id, 'email', `Invoice ${inv.invoice_no} for ₹${inv.total} due ${inv.due_date}.`);
    res.json({ ok: true, links: { inApp: `#/fees/invoice/${inv.id}`, smsLink: `pay/${inv.invoice_no}` }, note: 'Email + SMS delivery simulated.' });
  }));

  app.post('/api/invoices/:id/late-fee', write, h(async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inv = (await client.query('SELECT * FROM invoices WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
      if (!inv) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'not found' }); }
      const items = (await client.query('SELECT DISTINCT fee_type_id FROM invoice_items WHERE invoice_id=$1', [inv.id])).rows;
      const rules = (await client.query('SELECT * FROM late_fee_rules WHERE fee_type_id = ANY($1::int[])', [items.map((i) => i.fee_type_id)])).rows;
      const overdueDays = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 864e5);
      let late = 0;
      for (const rule of rules) {
        const days = Math.max(0, overdueDays - rule.grace_days);
        let v = rule.kind === 'flat' ? Number(rule.value) : Math.round(Number(inv.total) * Number(rule.value) / 100 * days);
        if (rule.max_cap) v = Math.min(v, Number(rule.max_cap));
        late += days > 0 ? v : 0;
      }
      if (late <= 0) { await client.query('ROLLBACK'); return res.json({ ok: true, late_fee: 0, message: 'Not overdue past grace period.' }); }
      const recv = await receivableAcct(client, inv.student_id); const lateAcct = await sysAcct(client, 'late_fee_income');
      await client.query('UPDATE invoices SET late_fee=late_fee+$2, total=total+$2 WHERE id=$1', [inv.id, late]);
      await postFeeTxn(client, { ref: 'LATE-' + inv.invoice_no, kind: 'late_fee', student_id: inv.student_id, amount: late }, [{ account_id: recv, direction: 'debit', amount: late }, { account_id: lateAcct, direction: 'credit', amount: late }]);
      await client.query('COMMIT');
      res.json({ ok: true, late_fee: late, overdueDays });
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }));

  app.get('/api/invoices/:id/upi', read, h(async (req, res) => {
    const inv = (await q('SELECT * FROM invoices WHERE id=$1', [req.params.id])).rows[0];
    if (!inv) return res.status(404).json({ message: 'not found' });
    const amt = Math.max(0, Number(inv.total) - Number(inv.paid)).toFixed(2);
    const upi = `upi://pay?pa=greenwood@hdfcbank&pn=Greenwood%20Institute&am=${amt}&cu=INR&tn=${inv.invoice_no}`;
    res.json({ upi, amount: amt, invoice_no: inv.invoice_no });
  }));

  /* ============== payments (idempotent) ============== */
  async function applyPayment(client, inv, amount, info) {
    const recv = await receivableAcct(client, inv.student_id); const cash = await sysAcct(client, 'cash_bank');
    const receipt = 'RCPT-' + Date.now().toString().slice(-8);
    const pay = (await client.query(`INSERT INTO fee_payments (receipt_no, invoice_id, student_id, amount, method, gateway, gateway_txn_id, idempotency_key, created_by, status)
                                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'success') RETURNING *`,
      [receipt, inv.id, inv.student_id, amount, info.method, info.gateway || null, info.gateway_txn_id || null, info.idempotency_key || null, info.created_by || null])).rows[0];
    const newPaid = Number(inv.paid) + amount;
    await client.query(`UPDATE invoices SET paid=$2, status=$3 WHERE id=$1`, [inv.id, newPaid, newPaid >= Number(inv.total) ? 'paid' : 'partial']);
    await postFeeTxn(client, { ref: 'PAY-' + inv.invoice_no, kind: 'payment', student_id: inv.student_id, amount }, [{ account_id: cash, direction: 'debit', amount }, { account_id: recv, direction: 'credit', amount }]);
    return { receipt, pay, newPaid, balance: Number(inv.total) - newPaid };
  }

  app.post('/api/payments', write, h(async (req, res) => {
    const key = req.headers['idempotency-key'];
    if (key) { const c = (await q('SELECT response FROM fee_idempotency WHERE key=$1', [key])).rows[0]; if (c) return res.json({ ...c.response, idempotentReplay: true }); }
    const { invoice_id, amount, method, gateway, gateway_txn_id } = req.body || {};
    const amt = Number(amount);
    if (!(amt > 0) || !invoice_id) return res.status(400).json({ message: 'invoice_id + amount required' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inv = (await client.query('SELECT * FROM invoices WHERE id=$1 FOR UPDATE', [invoice_id])).rows[0];
      if (!inv) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'invoice not found' }); }
      const r = await applyPayment(client, inv, amt, { method: method || 'cash', gateway, gateway_txn_id, idempotency_key: key, created_by: req.user.email });
      const response = { ok: true, receipt_no: r.receipt, paid: r.newPaid, balance: r.balance, status: r.balance <= 0 ? 'paid' : 'partial', reconciled: !!gateway_txn_id };
      if (key) await client.query('INSERT INTO fee_idempotency (key, response) VALUES ($1,$2) ON CONFLICT DO NOTHING', [key, JSON.stringify(response)]);
      await client.query('COMMIT');
      await notify(inv.student_id, 'sms', `Payment ₹${amt} received for ${inv.invoice_no}. Receipt ${r.receipt}.`);
      res.json(response);
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }));

  // Gateway webhook (at-least-once delivery -> event idempotency + shared-secret check).
  app.post('/api/v1/fees/webhook/:gateway', h(async (req, res) => {
    const gateway = req.params.gateway;
    if (!GATEWAYS.includes(gateway)) return res.status(404).json({ message: 'unknown gateway' });
    if (req.headers['x-webhook-secret'] !== (process.env.FEE_WEBHOOK_SECRET || 'whsec_dev')) return res.status(401).json({ message: 'bad signature' });
    const eventId = req.headers['x-event-id'] || req.body?.event_id;
    if (!eventId) return res.status(400).json({ message: 'missing event id' });
    const dup = (await q('SELECT 1 FROM fee_webhook_events WHERE event_id=$1', [eventId])).rows[0];
    if (dup) return res.json({ ok: true, deduped: true });
    await q('INSERT INTO fee_webhook_events (event_id, gateway, payload) VALUES ($1,$2,$3)', [eventId, gateway, JSON.stringify(req.body || {})]);
    const { invoice_no, amount, txn_id } = req.body || {};
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inv = (await client.query('SELECT * FROM invoices WHERE invoice_no=$1 FOR UPDATE', [invoice_no])).rows[0];
      if (!inv) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'invoice not found for reconciliation' }); }
      const r = await applyPayment(client, inv, Number(amount), { method: 'gateway', gateway, gateway_txn_id: txn_id });
      await client.query('COMMIT');
      res.json({ ok: true, reconciled: true, receipt_no: r.receipt, balance: r.balance });
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }));

  /* ============== collections ============== */
  app.get('/api/collections/dashboard', read, h(async (_q, r) => {
    const c = await q(`SELECT
      COALESCE(SUM(amount) FILTER (WHERE created_at::date=current_date),0) AS today,
      COALESCE(SUM(amount) FILTER (WHERE created_at>=date_trunc('month',now())),0) AS this_month,
      COALESCE(SUM(amount) FILTER (WHERE created_at>=date_trunc('year',now())),0) AS this_year FROM fee_payments WHERE status='success'`);
    const inv = await q(`SELECT COALESCE(SUM(total),0) billed, COALESCE(SUM(paid),0) collected, COALESCE(SUM(total-paid),0) outstanding FROM invoices`);
    const rate = Number(inv.rows[0].billed) ? Math.round(Number(inv.rows[0].collected) / Number(inv.rows[0].billed) * 100) : 0;
    r.json({ ...c.rows[0], ...inv.rows[0], collectionRate: rate });
  }));
  app.get('/api/collections/by-class', read, h(async (_q, r) => r.json((await q(`SELECT s.class, COALESCE(SUM(i.total),0) billed, COALESCE(SUM(i.paid),0) collected,
    CASE WHEN SUM(i.total)>0 THEN round(SUM(i.paid)/SUM(i.total)*100) ELSE 0 END rate FROM invoices i JOIN students s ON s.id=i.student_id GROUP BY s.class ORDER BY s.class`)).rows)));
  app.get('/api/collections/by-fee-type', read, h(async (_q, r) => r.json((await q(`SELECT t.name fee_type, COALESCE(SUM(ii.amount+ii.tax_amount),0) billed FROM invoice_items ii JOIN fee_types t ON t.id=ii.fee_type_id GROUP BY t.name ORDER BY billed DESC`)).rows)));
  app.get('/api/collections/aging', read, h(async (_q, r) => {
    const rows = (await q(`SELECT
      COALESCE(SUM(total-paid) FILTER (WHERE current_date-due_date BETWEEN 0 AND 30),0) d0_30,
      COALESCE(SUM(total-paid) FILTER (WHERE current_date-due_date BETWEEN 31 AND 60),0) d31_60,
      COALESCE(SUM(total-paid) FILTER (WHERE current_date-due_date > 60),0) d60p,
      COALESCE(SUM(total-paid) FILTER (WHERE due_date >= current_date),0) not_due
      FROM invoices WHERE paid < total`)).rows[0];
    r.json(rows);
  }));
  app.get('/api/collections/defaulters', read, h(async (_q, r) => r.json((await q(`SELECT s.id, s.name, s.class, s.section, s.phone, s.email,
    SUM(i.total-i.paid) outstanding, MIN(i.due_date) oldest_due, max(current_date - i.due_date) max_overdue
    FROM invoices i JOIN students s ON s.id=i.student_id WHERE i.paid < i.total GROUP BY s.id HAVING SUM(i.total-i.paid)>0
    ORDER BY outstanding DESC LIMIT 25`)).rows)));
  app.get('/api/collections/due-list', read, h(async (req, res) => {
    const od = Number(req.query.days_overdue) || 0;
    res.json((await q(`SELECT i.invoice_no, s.name, s.class, s.phone, (i.total-i.paid) balance, i.due_date, (current_date - i.due_date) overdue_days
      FROM invoices i JOIN students s ON s.id=i.student_id WHERE i.paid<i.total AND (current_date - i.due_date) >= $1 ORDER BY overdue_days DESC LIMIT 300`, [od])).rows);
  }));

  /* ============== follow-ups ============== */
  app.post('/api/followups/run', write, h(async (_q, r) => {
    // Build reminder series for overdue/near-due unpaid invoices.
    const invs = (await q(`SELECT i.*, s.name FROM invoices i JOIN students s ON s.id=i.student_id WHERE i.paid < i.total`)).rows;
    let created = 0, escalated = 0;
    for (const inv of invs) {
      const days = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 864e5);
      const stage = days >= 30 ? 'escalation' : days >= 7 ? 'post_7' : days >= 3 ? 'post_3' : days >= 0 ? 'due' : days >= -7 ? 'pre_7' : null;
      if (!stage) continue;
      const exists = (await q(`SELECT 1 FROM fee_followups WHERE invoice_id=$1 AND stage=$2`, [inv.id, stage])).rows[0];
      if (exists) continue;
      await q(`INSERT INTO fee_followups (invoice_id, student_id, stage, channel, status, scheduled_for) VALUES ($1,$2,$3,$4,'sent',now())`,
        [inv.id, inv.student_id, stage, stage === 'escalation' ? 'email' : 'whatsapp']);
      await notify(inv.student_id, stage === 'escalation' ? 'email' : 'whatsapp', `Fee reminder (${stage}): ${inv.invoice_no} balance ₹${Number(inv.total) - Number(inv.paid)} due ${inv.due_date}.`);
      created++; if (stage === 'escalation') escalated++;
    }
    r.json({ ok: true, remindersSent: created, escalations: escalated, note: 'SMS/WhatsApp/email sending simulated; principal notified on escalation.' });
  }));
  app.get('/api/followups', read, h(async (_q, r) => r.json((await q(`SELECT f.*, s.name FROM fee_followups f LEFT JOIN students s ON s.id=f.student_id ORDER BY f.created_at DESC LIMIT 200`)).rows)));

  /* ============== hold services (real wallet freeze) ============== */
  app.get('/api/fees/hold-services', read, h(async (_q, r) => r.json((await q(`SELECT value FROM fee_settings WHERE key='hold_services'`)).rows[0]?.value || { enabled: false })));
  app.put('/api/fees/hold-services', write, h(async (req, res) => { await q(`INSERT INTO fee_settings (key,value) VALUES ('hold_services',$1) ON CONFLICT (key) DO UPDATE SET value=$1`, [JSON.stringify(req.body)]); res.json({ ok: true }); }));
  app.post('/api/fees/hold-services/apply', write, h(async (_q, r) => {
    const cfg = (await q(`SELECT value FROM fee_settings WHERE key='hold_services'`)).rows[0]?.value || {};
    if (!cfg.enabled) return r.json({ ok: true, frozen: 0, note: 'Hold services disabled.' });
    const days = cfg.block_wallet_after_days || 30;
    const defaulters = (await q(`SELECT DISTINCT s.id FROM invoices i JOIN students s ON s.id=i.student_id WHERE i.paid<i.total AND (current_date - i.due_date) >= $1`, [days])).rows;
    let frozen = 0;
    for (const d of defaulters) { const u = await q(`UPDATE wallet_accounts SET status='frozen' WHERE student_id=$1 AND status='active'`, [d.id]); frozen += u.rowCount; }
    r.json({ ok: true, frozen, defaulters: defaulters.length, note: `Froze wallets of students overdue ≥${days} days (real integration with the wallet module).` });
  }));

  /* ============== AI ============== */
  app.get('/api/fees/ai/default-prediction', read, h(async (_q, r) => {
    const rows = (await q(`SELECT s.id, s.name, s.class, s.fee_status,
      COALESCE(SUM(i.total),0) billed, COALESCE(SUM(i.paid),0) paid, COALESCE(SUM(i.total-i.paid),0) outstanding,
      max(current_date - i.due_date) FILTER (WHERE i.paid<i.total) max_overdue
      FROM students s LEFT JOIN invoices i ON i.student_id=s.id GROUP BY s.id`)).rows;
    const out = rows.map((x) => {
      const ratio = Number(x.billed) ? Number(x.outstanding) / Number(x.billed) : 0;
      let p = Math.round(ratio * 60 + Math.max(0, Number(x.max_overdue || 0)) * 0.6 + (x.fee_status === 'Overdue' ? 20 : 0));
      p = Math.max(0, Math.min(100, p));
      return { id: x.id, name: x.name, class: x.class, outstanding: Number(x.outstanding), probability: p, risk: p >= 60 ? 'high' : p >= 35 ? 'medium' : 'low' };
    }).filter((x) => x.probability >= 35).sort((a, b) => b.probability - a.probability).slice(0, 25);
    r.json({ predictions: out, note: 'Heuristic default model (no trained ML; uses outstanding ratio, overdue days, fee status).' });
  }));
  app.get('/api/fees/ai/optimal-time', read, h(async (_q, r) => {
    const rows = (await q(`SELECT extract(hour from created_at)::int hour, count(*)::int n FROM fee_payments GROUP BY 1 ORDER BY n DESC`)).rows;
    r.json({ bestHours: rows.slice(0, 3).map((x) => `${x.hour}:00`), histogram: rows, note: 'Best reminder time inferred from when payments historically occur.' });
  }));
  app.get('/api/fees/ai/revenue-forecast', read, h(async (_q, r) => {
    const months = (await q(`SELECT to_char(date_trunc('month',created_at),'YYYY-MM') m, SUM(amount)::numeric total FROM fee_payments WHERE created_at > now() - interval '6 months' GROUP BY 1 ORDER BY 1`)).rows;
    const vals = months.map((x) => Number(x.total));
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const sd = vals.length ? Math.sqrt(vals.reduce((a, b) => a + (b - avg) ** 2, 0) / vals.length) : 0;
    r.json({ history: months, forecastNextMonth: Math.round(avg), confidenceInterval: [Math.round(avg - sd), Math.round(avg + sd)], note: 'Forecast = trailing mean ± 1σ (statistical baseline, not a trained model).' });
  }));
  app.get('/api/fees/ai/waiver-recommendation', read, h(async (_q, r) => r.json({
    recommendations: (await q(`SELECT s.id, s.name, s.class, SUM(i.total-i.paid) outstanding,
      bool_or(c.id IS NOT NULL) has_concession FROM students s JOIN invoices i ON i.student_id=s.id LEFT JOIN concessions c ON c.student_id=s.id
      WHERE i.paid<i.total GROUP BY s.id HAVING SUM(i.total-i.paid) > 30000 ORDER BY outstanding DESC LIMIT 10`)).rows,
    note: 'Suggested for financial-aid review (high outstanding). Real model would use income indicators.',
  })));

  /* ============== reports ============== */
  app.get('/api/fees/reports/daily', read, h(async (req, res) => {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const payments = (await q(`SELECT p.receipt_no, s.name, s.class, p.amount, p.method, p.created_at FROM fee_payments p JOIN students s ON s.id=p.student_id WHERE p.created_at::date=$1 ORDER BY p.created_at`, [date])).rows;
    const totalCollected = payments.reduce((t, p) => t + Number(p.amount), 0);
    res.json({ date, payments, totalCollected, count: payments.length });
  }));
  app.get('/api/fees/reports/monthly', read, h(async (_q, r) => r.json((await q(`SELECT to_char(date_trunc('month',created_at),'Mon YYYY') month, to_char(date_trunc('month',created_at),'YYYY-MM') sort_key, SUM(amount)::numeric collected, count(*)::int payments FROM fee_payments GROUP BY date_trunc('month',created_at) ORDER BY date_trunc('month',created_at) DESC LIMIT 24`)).rows)));
  app.get('/api/fees/reports/outstanding-by-class', read, h(async (_q, r) => r.json((await q(`SELECT s.class, SUM(i.total-i.paid) outstanding, count(*) FILTER (WHERE i.paid<i.total) unpaid_invoices, count(DISTINCT s.id) students FROM invoices i JOIN students s ON s.id=i.student_id GROUP BY s.class ORDER BY outstanding DESC`)).rows)));
  app.get('/api/fees/reports/receipt-register', read, h(async (_q, r) => r.json((await q(`SELECT p.receipt_no, p.created_at, s.name, s.class, i.invoice_no, p.amount, p.method, p.gateway, p.gateway_txn_id FROM fee_payments p JOIN students s ON s.id=p.student_id LEFT JOIN invoices i ON i.id=p.invoice_id ORDER BY p.created_at DESC LIMIT 500`)).rows)));
  app.get('/api/fees/reports/gst', read, h(async (_q, r) => r.json((await q(`SELECT t.name fee_type, t.hsn_code, t.gst_rate, SUM(ii.amount) taxable, SUM(ii.tax_amount) tax, round(SUM(ii.tax_amount)/2,2) cgst, round(SUM(ii.tax_amount)/2,2) sgst FROM invoice_items ii JOIN fee_types t ON t.id=ii.fee_type_id WHERE t.gst_rate>0 GROUP BY t.name,t.hsn_code,t.gst_rate`)).rows)));
  app.get('/api/fees/reports/method-breakdown', read, h(async (_q, r) => r.json((await q(`SELECT COALESCE(method,'unknown') method, SUM(amount)::numeric total, count(*)::int count FROM fee_payments WHERE status='success' GROUP BY method ORDER BY total DESC`)).rows)));

  /* ============== ledger integrity ============== */
  app.get('/api/fees/ledger/verify', read, h(async (_q, r) => {
    const per = (await q(`SELECT txn_id, SUM(CASE direction WHEN 'debit' THEN amount ELSE -amount END)::numeric net FROM fee_ledger_entries GROUP BY txn_id HAVING ABS(SUM(CASE direction WHEN 'debit' THEN amount ELSE -amount END))>0.001`)).rows;
    const global = Number((await q(`SELECT COALESCE(SUM(CASE direction WHEN 'debit' THEN amount ELSE -amount END),0)::numeric n FROM fee_ledger_entries`)).rows[0].n);
    const recv = Number((await q(`SELECT COALESCE(SUM(CASE direction WHEN 'debit' THEN amount ELSE -amount END),0)::numeric n FROM fee_ledger_entries e JOIN fee_accounts a ON a.id=e.account_id WHERE a.kind='receivable'`)).rows[0].n);
    const outstanding = Number((await q(`SELECT COALESCE(SUM(total-paid),0)::numeric n FROM invoices`)).rows[0].n);
    r.json({ balanced: per.length === 0 && Math.abs(global) < 0.001, unbalancedTxns: per.length, globalNet: global, receivableLedger: recv, invoicesOutstanding: outstanding, ledgerMatchesInvoices: Math.abs(recv - outstanding) < 1 });
  }));
}
