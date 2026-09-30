// Double-entry fee ledger. Receivable accounts are per-student (debit = owed).
// System accounts: fee_revenue, cash_bank, late_fee_income, discount_given.
// Outstanding(student) = SUM(debit) - SUM(credit) on their receivable account.
import crypto from 'node:crypto';

const SYSTEM = ['fee_revenue', 'cash_bank', 'late_fee_income', 'discount_given'];

export async function ensureFeeSystemAccounts(client) {
  for (const name of SYSTEM) {
    const { rows } = await client.query(`SELECT id FROM fee_accounts WHERE kind='system' AND name=$1`, [name]);
    if (!rows[0]) await client.query(`INSERT INTO fee_accounts (kind, name) VALUES ('system',$1)`, [name]);
  }
}
export async function sysAcct(client, name) {
  return (await client.query(`SELECT id FROM fee_accounts WHERE kind='system' AND name=$1`, [name])).rows[0]?.id;
}
export async function receivableAcct(client, studentId) {
  let r = await client.query(`SELECT id FROM fee_accounts WHERE student_id=$1`, [studentId]);
  if (!r.rows[0]) r = await client.query(`INSERT INTO fee_accounts (student_id, kind, name) VALUES ($1,'receivable',$2) RETURNING id`, [studentId, 'receivable_' + studentId]);
  return r.rows[0].id;
}
export async function outstandingOf(client, studentId) {
  const { rows } = await client.query(
    `SELECT COALESCE(SUM(CASE e.direction WHEN 'debit' THEN e.amount ELSE -e.amount END),0)::numeric bal
       FROM fee_ledger_entries e JOIN fee_accounts a ON a.id=e.account_id WHERE a.student_id=$1`, [studentId]);
  return Number(rows[0].bal);
}

export async function postFeeTxn(client, header, entries) {
  const deb = entries.filter((e) => e.direction === 'debit').reduce((s, e) => s + e.amount, 0);
  const cre = entries.filter((e) => e.direction === 'credit').reduce((s, e) => s + e.amount, 0);
  if (Math.abs(deb - cre) > 0.001) throw new Error(`unbalanced fee txn ${deb} != ${cre}`);
  const ref = header.ref || 'FLX' + Date.now() + crypto.randomBytes(2).toString('hex');
  const { rows } = await client.query(
    `INSERT INTO fee_ledger_txns (ref, kind, student_id, amount, meta) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [ref, header.kind, header.student_id ?? null, header.amount ?? deb, header.meta ? JSON.stringify(header.meta) : null]);
  for (const e of entries) await client.query(`INSERT INTO fee_ledger_entries (txn_id, account_id, direction, amount) VALUES ($1,$2,$3,$4)`,
    [rows[0].id, e.account_id, e.direction, e.amount]);
  return rows[0].id;
}
