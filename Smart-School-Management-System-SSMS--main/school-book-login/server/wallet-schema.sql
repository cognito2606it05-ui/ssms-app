-- ============================================================
--  Smart ID Card + Digital Wallet schema
--  Double-entry ledger · pgcrypto balance-at-rest · row locking
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Wallet accounts (one per student + a set of internal "system" accounts so
-- every movement is balanced double-entry). balance_cipher is the encrypted
-- snapshot (pgcrypto) kept in sync with the ledger inside the locked txn.
CREATE TABLE IF NOT EXISTS wallet_accounts (
  id                    SERIAL PRIMARY KEY,
  student_id            INT UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  kind                  TEXT NOT NULL DEFAULT 'student',  -- student | system
  name                  TEXT,
  status                TEXT NOT NULL DEFAULT 'active',    -- active | frozen
  low_balance_threshold NUMERIC(10,2) NOT NULL DEFAULT 50,
  balance_cipher        BYTEA,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transaction header (human-facing). The money movement lives in ledger_entries.
CREATE TABLE IF NOT EXISTS wallet_txns (
  id          SERIAL PRIMARY KEY,
  ref         TEXT UNIQUE NOT NULL,
  kind        TEXT NOT NULL,                 -- topup | purchase | refund | adjust
  student_id  INT REFERENCES students(id) ON DELETE SET NULL,
  module      TEXT,                          -- canteen | library | store | sports | bank
  amount      NUMERIC(10,2) NOT NULL,
  cash_part   NUMERIC(10,2) NOT NULL DEFAULT 0,
  method      TEXT,                          -- wallet | upi | card | cash | mixed
  vendor      TEXT,
  location    TEXT,
  status      TEXT NOT NULL DEFAULT 'success', -- success | reversed | disputed
  created_by  TEXT,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Double-entry: each wallet_txn produces >=2 balanced rows (sum debit = sum credit).
CREATE TABLE IF NOT EXISTS ledger_entries (
  id         SERIAL PRIMARY KEY,
  txn_id     INT NOT NULL REFERENCES wallet_txns(id) ON DELETE CASCADE,
  account_id INT NOT NULL REFERENCES wallet_accounts(id),
  direction  TEXT NOT NULL CHECK (direction IN ('debit','credit')),
  amount     NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_templates (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'student', -- student | staff | visitor
  layout     JSONB NOT NULL,                  -- array of {field,x,y,w,h,...}
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parental controls per spending category.
CREATE TABLE IF NOT EXISTS spending_controls (
  student_id    INT REFERENCES students(id) ON DELETE CASCADE,
  category      TEXT NOT NULL,                -- canteen | library | store | sports
  daily_limit   NUMERIC(10,2),
  weekly_limit  NUMERIC(10,2),
  monthly_budget NUMERIC(10,2),
  blocked       BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (student_id, category)
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id         SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  txn_id     INT,
  kind       TEXT,                            -- out_of_hours | velocity | duplicate | anomaly | impossible_travel
  severity   TEXT,                            -- low | medium | high
  message    TEXT,
  resolved   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disputes (
  id         SERIAL PRIMARY KEY,
  txn_id     INT REFERENCES wallet_txns(id) ON DELETE CASCADE,
  raised_by  TEXT,
  reason     TEXT,
  status     TEXT NOT NULL DEFAULT 'open',    -- open | resolved | rejected
  cctv_ref   TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refunds (
  id           SERIAL PRIMARY KEY,
  txn_id       INT REFERENCES wallet_txns(id) ON DELETE CASCADE,
  amount       NUMERIC(10,2) NOT NULL,
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  requested_by TEXT,
  approved_by  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Card status tracking lives on id_cards (existing). Allow the full set.
ALTER TABLE id_cards ADD COLUMN IF NOT EXISTS template_id INT;

CREATE INDEX IF NOT EXISTS idx_ledger_account ON ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_txn ON ledger_entries(txn_id);
CREATE INDEX IF NOT EXISTS idx_wtxn_student ON wallet_txns(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_student ON fraud_alerts(student_id, created_at DESC);
