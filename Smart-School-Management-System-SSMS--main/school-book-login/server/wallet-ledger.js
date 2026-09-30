// Double-entry ledger primitives. All money movement goes through postTxn so
// the ledger always balances (sum debit = sum credit). Balance is derived from
// the ledger; the pgcrypto-encrypted snapshot is refreshed inside the same
// (locked) transaction for fast, tamper-evident display.
import crypto from 'node:crypto';

export const WALLET_KEY = process.env.WALLET_PG_KEY || 'ssms-wallet-pgcrypto-key';

const SYSTEM_ACCOUNTS = ['bank', 'canteen', 'library', 'store', 'sports', 'refund_pool'];

export async function ensureSystemAccounts(client) {
  for (const name of SYSTEM_ACCOUNTS) {
    const { rows } = await client.query(`SELECT id FROM wallet_accounts WHERE kind='system' AND name=$1`, [name]);
    if (!rows[0]) await client.query(`INSERT INTO wallet_accounts (kind, name) VALUES ('system',$1)`, [name]);
  }
}

export async function systemAccountId(client, name) {
  const { rows } = await client.query(`SELECT id FROM wallet_accounts WHERE kind='system' AND name=$1`, [name]);
  return rows[0]?.id;
}

// Ledger-derived balance (the authoritative figure).
export async function balanceOf(client, accountId) {
  const { rows } = await client.query(
    `SELECT COALESCE(SUM(CASE direction WHEN 'credit' THEN amount ELSE -amount END),0)::numeric AS bal
       FROM ledger_entries WHERE account_id=$1`, [accountId]);
  return Number(rows[0].bal);
}

// Decrypt the pgcrypto snapshot (demonstrates balance-at-rest encryption).
export async function decryptedBalance(client, accountId) {
  const { rows } = await client.query(
    `SELECT CASE WHEN balance_cipher IS NULL THEN NULL
                 ELSE pgp_sym_decrypt(balance_cipher, $2)::numeric END AS bal
       FROM wallet_accounts WHERE id=$1`, [accountId, WALLET_KEY]);
  return rows[0]?.bal == null ? null : Number(rows[0].bal);
}

async function refreshCipher(client, accountId) {
  const bal = await balanceOf(client, accountId);
  await client.query(
    `UPDATE wallet_accounts SET balance_cipher = pgp_sym_encrypt($2::text, $3), updated_at=now() WHERE id=$1`,
    [accountId, String(bal), WALLET_KEY]);
  return bal;
}

// Post a balanced transaction. entries: [{account_id, direction, amount}].
export async function postTxn(client, header, entries) {
  const deb = entries.filter((e) => e.direction === 'debit').reduce((s, e) => s + e.amount, 0);
  const cre = entries.filter((e) => e.direction === 'credit').reduce((s, e) => s + e.amount, 0);
  if (Math.abs(deb - cre) > 0.001) throw new Error(`unbalanced txn: debit ${deb} != credit ${cre}`);
  const ref = header.ref || 'WTX' + Date.now() + crypto.randomBytes(2).toString('hex');
  const { rows } = await client.query(
    `INSERT INTO wallet_txns (ref, kind, student_id, module, amount, cash_part, method, vendor, location, status, created_by, meta)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [ref, header.kind, header.student_id ?? null, header.module ?? null, header.amount, header.cash_part ?? 0,
     header.method ?? null, header.vendor ?? null, header.location ?? null, header.status ?? 'success',
     header.created_by ?? null, header.meta ? JSON.stringify(header.meta) : null]);
  const txn = rows[0];
  for (const e of entries) {
    await client.query(`INSERT INTO ledger_entries (txn_id, account_id, direction, amount) VALUES ($1,$2,$3,$4)`,
      [txn.id, e.account_id, e.direction, e.amount]);
  }
  // refresh encrypted snapshot for every touched account
  for (const accId of [...new Set(entries.map((e) => e.account_id))]) await refreshCipher(client, accId);
  return txn;
}
