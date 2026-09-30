import { pool, q } from './db.js';
import { ensureSystemAccounts, systemAccountId, balanceOf, decryptedBalance, postTxn } from './wallet-ledger.js';

const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const ACTION_COL = { read: 'can_read', write: 'can_write', edit: 'can_edit', delete: 'can_delete', approve: 'can_approve', export: 'can_export' };

const DEFAULT_LAYOUT = [
  { field: 'logo', label: 'Institution Logo', x: 250, y: 14, w: 56, h: 56 },
  { field: 'photo', label: 'Photo', x: 16, y: 16, w: 84, h: 100 },
  { field: 'name', label: 'Name', x: 112, y: 22 },
  { field: 'class', label: 'Class', x: 112, y: 52 },
  { field: 'roll', label: 'Roll No', x: 112, y: 74 },
  { field: 'qr', label: 'QR Code', x: 250, y: 120, w: 74, h: 74 },
  { field: 'nfc', label: 'NFC Chip', x: 16, y: 140, w: 44, h: 32 },
  { field: 'emergency', label: 'Emergency Contact', x: 16, y: 182 },
];

async function notify(studentId, channel, message) {
  await q(`INSERT INTO notification_queue (student_id, channel, message, status, scheduled_for) VALUES ($1,$2,$3,'sent',now())`,
    [studentId, channel, message]).catch(() => {});
}
async function raiseFraud(studentId, txnId, kind, severity, message) {
  await q(`INSERT INTO fraud_alerts (student_id, txn_id, kind, severity, message) VALUES ($1,$2,$3,$4,$5)`,
    [studentId, txnId, kind, severity, message]).catch(() => {});
}

export function mountWallet(app, { authenticate, requirePermission }) {
  const read = [authenticate, requirePermission('fees', 'read')];
  const write = [authenticate, requirePermission('fees', 'write')];
  const approve = [authenticate, requirePermission('fees', 'approve')];
  const exportg = [authenticate, requirePermission('fees', 'export')];

  // POS guard: the active role must be able to WRITE the module being charged
  // (so canteen_staff can run the canteen POS, store_staff the store, etc.).
  const guardModule = (action) => async (req, res, next) => {
    const module = req.body?.module || req.params?.module || 'fees';
    const col = ACTION_COL[action];
    const { rows } = await q(`SELECT ${col} AS a FROM role_permissions WHERE role_key=$1 AND module_key=$2`, [req.user.activeRole, module]);
    if (rows[0]?.a === true) return next();
    res.status(403).json({ error: 'forbidden', message: `Role '${req.user.activeRole}' cannot ${action} on '${module}'.` });
  };
  const posGuard = [authenticate, guardModule('write')];
  // Scan just reveals name + balance to the operator; allow any role that can
  // write at least one POS module (or read fees).
  const posScanGuard = [authenticate, async (req, res, next) => {
    const { rows } = await q(
      `SELECT 1 FROM role_permissions WHERE role_key=$1 AND ((module_key IN ('canteen','store','library','sports') AND can_write) OR (module_key='fees' AND can_read)) LIMIT 1`,
      [req.user.activeRole]);
    if (rows[0]) return next();
    res.status(403).json({ error: 'forbidden', message: 'No POS access for this role.' });
  }];

  /* ---------------- wallet profile / balance ---------------- */
  app.get('/api/wallet/:studentId', read, h(async (req, res) => {
    const sid = Number(req.params.studentId);
    const client = await pool.connect();
    try {
      const acct = (await client.query('SELECT * FROM wallet_accounts WHERE student_id=$1', [sid])).rows[0];
      if (!acct) return res.status(404).json({ message: 'no wallet for student' });
      const ledgerBal = await balanceOf(client, acct.id);
      const snapshot = await decryptedBalance(client, acct.id);
      const student = (await client.query('SELECT id, name, class, section, roll_number, photo_url FROM students WHERE id=$1', [sid])).rows[0];
      const card = (await client.query('SELECT * FROM id_cards WHERE student_id=$1', [sid])).rows[0];
      const controls = (await client.query('SELECT * FROM spending_controls WHERE student_id=$1', [sid])).rows;
      const txns = (await client.query('SELECT * FROM wallet_txns WHERE student_id=$1 ORDER BY created_at DESC LIMIT 30', [sid])).rows;
      const alerts = (await client.query('SELECT * FROM fraud_alerts WHERE student_id=$1 AND NOT resolved ORDER BY created_at DESC LIMIT 10', [sid])).rows;
      res.json({
        student, account: { id: acct.id, status: acct.status, low_balance_threshold: Number(acct.low_balance_threshold) },
        balance: ledgerBal, encryptedSnapshot: snapshot, snapshotMatches: snapshot != null && Math.abs(snapshot - ledgerBal) < 0.001,
        card, controls, txns, alerts,
      });
    } finally { client.release(); }
  }));

  app.post('/api/wallet/:studentId/topup', write, h(async (req, res) => {
    const sid = Number(req.params.studentId);
    const amount = Number(req.body?.amount);
    const method = req.body?.method || 'upi';
    if (!(amount > 0)) return res.status(400).json({ message: 'amount must be > 0' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const acct = (await client.query('SELECT * FROM wallet_accounts WHERE student_id=$1 FOR UPDATE', [sid])).rows[0];
      if (!acct) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'no wallet' }); }
      const bank = await systemAccountId(client, 'bank');
      const txn = await postTxn(client, { kind: 'topup', student_id: sid, module: 'bank', amount, method, created_by: req.user.email, location: 'gateway' },
        [{ account_id: acct.id, direction: 'credit', amount }, { account_id: bank, direction: 'debit', amount }]);
      const bal = await balanceOf(client, acct.id);
      await client.query('COMMIT');
      await notify(sid, 'sms', `₹${amount} added to wallet via ${method}. Balance ₹${bal}.`);
      res.json({ ok: true, ref: txn.ref, balance: bal, note: 'Payment gateway (Razorpay/UPI) is simulated; ledger credit is real.' });
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }));

  app.post('/api/wallet/:studentId/freeze', write, h(async (req, res) => {
    const frozen = !!req.body?.frozen;
    await q('UPDATE wallet_accounts SET status=$2 WHERE student_id=$1', [req.params.studentId, frozen ? 'frozen' : 'active']);
    res.json({ ok: true, status: frozen ? 'frozen' : 'active' });
  }));

  app.get('/api/wallet/:studentId/controls', read, h(async (req, res) =>
    res.json((await q('SELECT * FROM spending_controls WHERE student_id=$1', [req.params.studentId])).rows)));
  app.put('/api/wallet/:studentId/controls', write, h(async (req, res) => {
    const sid = Number(req.params.studentId);
    for (const c of (req.body?.controls || [])) {
      await q(`INSERT INTO spending_controls (student_id, category, daily_limit, weekly_limit, monthly_budget, blocked)
               VALUES ($1,$2,$3,$4,$5,$6)
               ON CONFLICT (student_id, category) DO UPDATE SET daily_limit=$3, weekly_limit=$4, monthly_budget=$5, blocked=$6`,
        [sid, c.category, c.daily_limit ?? null, c.weekly_limit ?? null, c.monthly_budget ?? null, !!c.blocked]);
    }
    res.json({ ok: true });
  }));

  app.get('/api/wallet/:studentId/analytics', read, h(async (req, res) => {
    const sid = Number(req.params.studentId);
    const byCat = (await q(`SELECT module AS category, SUM(amount)::numeric total, count(*)::int n
                            FROM wallet_txns WHERE student_id=$1 AND kind='purchase' GROUP BY module ORDER BY total DESC`, [sid])).rows;
    const trend = (await q(`SELECT created_at::date::text date, SUM(amount)::numeric spent
                            FROM wallet_txns WHERE student_id=$1 AND kind='purchase' AND created_at > current_date - interval '30 days'
                            GROUP BY created_at::date ORDER BY 1`, [sid])).rows;
    res.json({ byCategory: byCat, trend });
  }));

  /* ---------------- POS scan + charge (locking + controls + fraud) ---------------- */
  app.get('/api/pos/scan/:cardNo', posScanGuard, h(async (req, res) => {
    const card = (await q('SELECT * FROM id_cards WHERE card_no=$1', [req.params.cardNo])).rows[0];
    if (!card) return res.status(404).json({ message: 'card not found' });
    const student = (await q('SELECT id, name, class, section, roll_number, photo_url FROM students WHERE id=$1', [card.student_id])).rows[0];
    const acct = (await q('SELECT * FROM wallet_accounts WHERE student_id=$1', [card.student_id])).rows[0];
    const client = await pool.connect();
    let bal = 0; try { bal = acct ? await balanceOf(client, acct.id) : 0; } finally { client.release(); }
    res.json({ student, card_status: card.status, account_status: acct?.status, balance: bal });
  }));

  app.post('/api/pos/charge', posGuard, h(async (req, res) => {
    const { student_id, module, amount: amt, allow_cash, vendor, location } = req.body || {};
    const sid = Number(student_id); const amount = Number(amt);
    if (!(amount > 0) || !module) return res.status(400).json({ message: 'amount>0 and module required' });

    // pre-checks that don't need the lock (velocity / duplicate)
    const recent = (await q(`SELECT created_at, amount, module, location FROM wallet_txns
                             WHERE student_id=$1 AND kind='purchase' AND created_at > now() - interval '10 minutes' ORDER BY created_at DESC`, [sid])).rows;
    if (recent.length >= 5) {
      await q(`UPDATE wallet_accounts SET status='frozen' WHERE student_id=$1`, [sid]);
      await raiseFraud(sid, null, 'velocity', 'high', `Velocity: ${recent.length} txns in 10 min — card auto-locked.`);
      await notify(sid, 'sms', 'Card auto-locked: unusual transaction velocity detected.');
      return res.status(429).json({ error: 'velocity_lock', message: 'Too many transactions — card auto-locked. Contact admin.' });
    }
    const dup = recent.find((r) => Number(r.amount) === amount && r.module === module && (Date.now() - new Date(r.created_at).getTime()) < 60000);
    if (dup) { await raiseFraud(sid, null, 'duplicate', 'medium', `Duplicate ₹${amount} on ${module} within 60s.`); return res.status(409).json({ error: 'duplicate', message: 'Duplicate transaction blocked (same amount/vendor within 60s).' }); }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const acct = (await client.query('SELECT * FROM wallet_accounts WHERE student_id=$1 FOR UPDATE', [sid])).rows[0]; // row lock
      if (!acct) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'no wallet' }); }
      if (acct.status === 'frozen') { await client.query('ROLLBACK'); return res.status(423).json({ error: 'frozen', message: 'Card is frozen.' }); }

      const ctrl = (await client.query('SELECT * FROM spending_controls WHERE student_id=$1 AND category=$2', [sid, module])).rows[0];
      if (ctrl?.blocked) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'module_blocked', message: `Parent has blocked ${module} spending.` }); }
      if (ctrl?.daily_limit != null) {
        const today = Number((await client.query(`SELECT COALESCE(SUM(amount),0) s FROM wallet_txns WHERE student_id=$1 AND module=$2 AND kind='purchase' AND created_at::date=current_date`, [sid, module])).rows[0].s);
        if (today + amount > Number(ctrl.daily_limit)) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'daily_limit', message: `Daily ${module} limit ₹${ctrl.daily_limit} would be exceeded (spent ₹${today}).` }); }
      }

      const bal = await balanceOf(client, acct.id);
      let walletPart = amount, cashPart = 0;
      if (bal < amount) {
        if (!allow_cash) { await client.query('ROLLBACK'); return res.status(402).json({ error: 'insufficient', message: `Insufficient balance ₹${bal}. Enable partial cash.`, balance: bal }); }
        walletPart = bal; cashPart = +(amount - bal).toFixed(2);
      }

      let txn;
      const sysId = await systemAccountId(client, module);
      if (walletPart > 0) {
        txn = await postTxn(client, { kind: 'purchase', student_id: sid, module, amount: walletPart, cash_part: cashPart, method: cashPart > 0 ? 'mixed' : 'wallet', vendor, location, created_by: req.user.email },
          [{ account_id: acct.id, direction: 'debit', amount: walletPart }, { account_id: sysId, direction: 'credit', amount: walletPart }]);
      } else {
        txn = (await client.query(`INSERT INTO wallet_txns (ref, kind, student_id, module, amount, cash_part, method, vendor, location, created_by)
                                   VALUES ('WTX'||extract(epoch from now())::bigint,'purchase',$1,$2,$3,$3,'cash',$4,$5,$6) RETURNING *`,
          [sid, module, amount, vendor, location, req.user.email])).rows[0];
      }
      const newBal = await balanceOf(client, acct.id);
      await client.query('COMMIT');

      // post-commit fraud heuristics (advisory; don't block the sale)
      if (module === 'canteen') { const hr = new Date().getHours(); if (hr < 7 || hr >= 17) await raiseFraud(sid, txn.id, 'out_of_hours', 'medium', `Canteen charge outside 7AM–5PM (${hr}:00).`); }
      const last = recent[0];
      if (last && last.location && location && last.location !== location && (Date.now() - new Date(last.created_at).getTime()) < 60000)
        await raiseFraud(sid, txn.id, 'impossible_travel', 'high', `Scanned at '${location}' and '${last.location}' within 60s.`);
      const avg = Number((await q(`SELECT COALESCE(AVG(daily),0) a FROM (SELECT SUM(amount) daily FROM wallet_txns WHERE student_id=$1 AND kind='purchase' GROUP BY created_at::date) t`, [sid])).rows[0].a);
      if (avg > 0 && amount > avg * 5 && amount >= 200) { await raiseFraud(sid, txn.id, 'anomaly', 'medium', `Spend ₹${amount} >> usual ₹${Math.round(avg)}/day.`); await notify(sid, 'push', `Unusual spend ₹${amount} on ${module}.`); }

      const acctAfter = (await q('SELECT low_balance_threshold FROM wallet_accounts WHERE id=$1', [acct.id])).rows[0];
      if (newBal < Number(acctAfter.low_balance_threshold)) await notify(sid, 'push', `Low wallet balance: ₹${newBal} (below ₹${acctAfter.low_balance_threshold}).`);
      await notify(sid, 'sms', `₹${amount} spent at ${module}${cashPart > 0 ? ` (₹${walletPart} wallet + ₹${cashPart} cash)` : ''}. Balance ₹${newBal}.`);

      res.json({ ok: true, ref: txn.ref, walletPart, cashPart, balance: newBal, receipt: { ref: txn.ref, module, amount, walletPart, cashPart, vendor, at: new Date().toISOString() } });
    } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; } finally { client.release(); }
  }));

  /* ---------------- refunds (staff initiate -> admin approve) ---------------- */
  app.post('/api/refunds', posGuard, h(async (req, res) => {
    const { txn_id, amount, reason } = req.body || {};
    const txn = (await q('SELECT * FROM wallet_txns WHERE id=$1', [txn_id])).rows[0];
    if (!txn) return res.status(404).json({ message: 'txn not found' });
    const { rows } = await q(`INSERT INTO refunds (txn_id, amount, reason, requested_by) VALUES ($1,$2,$3,$4) RETURNING *`,
      [txn_id, amount || txn.amount, reason, req.user.email]);
    res.status(201).json({ ...rows[0], note: 'Awaiting admin approval.' });
  }));
  app.get('/api/refunds', read, h(async (_req, res) =>
    res.json((await q(`SELECT r.*, t.module, t.student_id FROM refunds r JOIN wallet_txns t ON t.id=r.txn_id ORDER BY r.created_at DESC LIMIT 100`)).rows)));
  app.post('/api/refunds/:id/approve', approve, h(async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const refund = (await client.query('SELECT * FROM refunds WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
      if (!refund) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'not found' }); }
      if (refund.status !== 'pending') { await client.query('ROLLBACK'); return res.status(409).json({ message: 'already ' + refund.status }); }
      const txn = (await client.query('SELECT * FROM wallet_txns WHERE id=$1', [refund.txn_id])).rows[0];
      const acct = (await client.query('SELECT * FROM wallet_accounts WHERE student_id=$1 FOR UPDATE', [txn.student_id])).rows[0];
      const pool2 = await systemAccountId(client, 'refund_pool');
      await postTxn(client, { kind: 'refund', student_id: txn.student_id, module: txn.module, amount: Number(refund.amount), method: 'wallet', created_by: req.user.email, meta: { refund_of: txn.ref } },
        [{ account_id: acct.id, direction: 'credit', amount: Number(refund.amount) }, { account_id: pool2, direction: 'debit', amount: Number(refund.amount) }]);
      await client.query(`UPDATE refunds SET status='approved', approved_by=$2 WHERE id=$1`, [req.params.id, req.user.email]);
      await client.query('COMMIT');
      await notify(txn.student_id, 'sms', `Refund ₹${refund.amount} credited to wallet.`);
      res.json({ ok: true });
    } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; } finally { client.release(); }
  }));

  /* ---------------- disputes ---------------- */
  app.post('/api/disputes', read, h(async (req, res) => {
    const { txn_id, reason } = req.body || {};
    const cctv = `CCTV-${new Date().toISOString().slice(0, 16)}`;
    const { rows } = await q(`INSERT INTO disputes (txn_id, raised_by, reason, cctv_ref) VALUES ($1,$2,$3,$4) RETURNING *`, [txn_id, req.user.email, reason, cctv]);
    await q(`UPDATE wallet_txns SET status='disputed' WHERE id=$1`, [txn_id]);
    res.status(201).json({ ...rows[0], note: 'Flagged for admin review with CCTV timestamp reference (CCTV integration simulated).' });
  }));
  app.get('/api/disputes', read, h(async (_req, res) =>
    res.json((await q(`SELECT d.*, t.module, t.amount, t.student_id FROM disputes d JOIN wallet_txns t ON t.id=d.txn_id ORDER BY d.created_at DESC LIMIT 100`)).rows)));
  app.post('/api/disputes/:id/resolve', approve, h(async (req, res) => {
    await q(`UPDATE disputes SET status=$2, admin_note=$3 WHERE id=$1`, [req.params.id, req.body?.status || 'resolved', req.body?.admin_note]);
    res.json({ ok: true });
  }));

  /* ---------------- fraud ---------------- */
  app.get('/api/fraud/alerts', read, h(async (_req, res) =>
    res.json((await q(`SELECT f.*, s.name FROM fraud_alerts f LEFT JOIN students s ON s.id=f.student_id ORDER BY f.created_at DESC LIMIT 100`)).rows)));
  app.post('/api/fraud/alerts/:id/resolve', write, h(async (req, res) => { await q('UPDATE fraud_alerts SET resolved=TRUE WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));

  /* ---------------- card templates (designer) ---------------- */
  app.get('/api/card-templates', read, h(async (_req, res) => res.json((await q('SELECT * FROM card_templates ORDER BY id')).rows)));
  app.post('/api/card-templates', write, h(async (req, res) => {
    const { name, kind, layout } = req.body || {};
    const { rows } = await q('INSERT INTO card_templates (name, kind, layout) VALUES ($1,$2,$3) RETURNING *', [name || 'Untitled', kind || 'student', JSON.stringify(layout || DEFAULT_LAYOUT)]);
    res.status(201).json(rows[0]);
  }));
  app.put('/api/card-templates/:id', write, h(async (req, res) => {
    await q('UPDATE card_templates SET name=COALESCE($2,name), layout=COALESCE($3,layout) WHERE id=$1', [req.params.id, req.body?.name, req.body?.layout ? JSON.stringify(req.body.layout) : null]);
    res.json({ ok: true });
  }));

  /* ---------------- cards: status, renew, expiring, pkpass, batch print ---------------- */
  app.get('/api/cards', read, h(async (_req, res) =>
    res.json((await q(`SELECT c.*, s.name, s.class, s.section, s.roll_number FROM id_cards c JOIN students s ON s.id=c.student_id ORDER BY c.id LIMIT 500`)).rows)));
  app.post('/api/cards/:studentId/status', write, h(async (req, res) => {
    const valid = ['active', 'blocked', 'lost', 'expired', 'pending'];
    if (!valid.includes(req.body?.status)) return res.status(400).json({ message: 'invalid status' });
    await q('UPDATE id_cards SET status=$2 WHERE student_id=$1', [req.params.studentId, req.body.status]);
    res.json({ ok: true });
  }));
  app.post('/api/cards/:studentId/renew', write, h(async (req, res) => {
    const exp = new Date(); exp.setFullYear(exp.getFullYear() + 2);
    await q(`UPDATE id_cards SET status='active', issued_at=now(), expires_at=$2 WHERE student_id=$1`, [req.params.studentId, exp.toISOString().slice(0, 10)]);
    res.json({ ok: true, expires_at: exp.toISOString().slice(0, 10) });
  }));
  app.get('/api/cards/expiring', read, h(async (_req, res) =>
    res.json((await q(`SELECT c.*, s.name FROM id_cards c JOIN students s ON s.id=c.student_id WHERE c.expires_at IS NOT NULL AND c.expires_at <= current_date + 30 ORDER BY c.expires_at`)).rows)));

  // Apple/Google Wallet pass payload (real structure; cannot be cert-signed here).
  app.get('/api/cards/:studentId/pkpass', read, h(async (req, res) => {
    const card = (await q(`SELECT c.*, s.name, s.class, s.section, s.roll_number FROM id_cards c JOIN students s ON s.id=c.student_id WHERE c.student_id=$1`, [req.params.studentId])).rows[0];
    if (!card) return res.status(404).json({ message: 'no card' });
    const acct = (await q('SELECT * FROM wallet_accounts WHERE student_id=$1', [req.params.studentId])).rows[0];
    const client = await pool.connect(); let bal = 0; try { bal = acct ? await balanceOf(client, acct.id) : 0; } finally { client.release(); }
    res.json({
      passJson: {
        formatVersion: 1, organizationName: 'Greenwood Smart Institute', description: 'Student ID + Wallet',
        passTypeIdentifier: 'pass.com.ssms.studentcard', serialNumber: card.card_no, teamIdentifier: 'SSMSTEAM',
        storeCard: {
          primaryFields: [{ key: 'name', label: 'STUDENT', value: card.name }],
          secondaryFields: [{ key: 'class', label: 'CLASS', value: `${card.class || ''}${card.section || ''}` }, { key: 'roll', label: 'ROLL', value: card.roll_number || '—' }],
          auxiliaryFields: [{ key: 'balance', label: 'WALLET', value: `₹${bal}`, currencyCode: 'INR' }],
          backFields: [{ key: 'card', label: 'Card No', value: card.card_no }],
        },
        barcode: { format: 'PKBarcodeFormatQR', message: card.card_no, messageEncoding: 'iso-8859-1' },
      },
      note: 'Valid PKPass JSON. Installable .pkpass requires Apple WWDR signing certs (not available here).',
    });
  }));

  app.post('/api/cards/batch/print', exportg, h(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const template = req.body?.templateId ? (await q('SELECT * FROM card_templates WHERE id=$1', [req.body.templateId])).rows[0] : null;
    const cards = (await q(`SELECT c.card_no, c.expires_at, s.id, s.name, s.class, s.section, s.roll_number, s.photo_url, s.emergency1_phone
                            FROM students s JOIN id_cards c ON c.student_id=s.id WHERE s.id = ANY($1::int[])`, [ids])).rows;
    res.json({ count: cards.length, layout: template?.layout || DEFAULT_LAYOUT, cards, spec: { size: 'CR80 85.6×54mm', dpi: 300 } });
  }));

  /* ---------------- ledger integrity ---------------- */
  app.get('/api/wallet/ledger/verify', read, h(async (_req, res) => {
    const perTxn = (await q(`SELECT txn_id, SUM(CASE direction WHEN 'debit' THEN amount ELSE -amount END)::numeric net
                            FROM ledger_entries GROUP BY txn_id HAVING ABS(SUM(CASE direction WHEN 'debit' THEN amount ELSE -amount END)) > 0.001`)).rows;
    const global = Number((await q(`SELECT COALESCE(SUM(CASE direction WHEN 'debit' THEN amount ELSE -amount END),0)::numeric n FROM ledger_entries`)).rows[0].n);
    const totalEntries = Number((await q('SELECT count(*)::int n FROM ledger_entries')).rows[0].n);
    res.json({ balanced: perTxn.length === 0 && Math.abs(global) < 0.001, unbalancedTxns: perTxn.length, globalNet: global, totalEntries, note: 'Double-entry invariant: every txn nets to 0 and the whole ledger nets to 0.' });
  }));

  // expose for seed
  mountWallet.ensureSystemAccounts = ensureSystemAccounts;
}
