-- ============================================================
--  Fee Management schema
--  Double-entry fee ledger · idempotent payments · webhooks
-- ============================================================

CREATE TABLE IF NOT EXISTS fee_types (
  id            SERIAL PRIMARY KEY,
  name          TEXT UNIQUE NOT NULL,         -- Tuition, Transport, …
  hsn_code      TEXT,
  gst_rate      NUMERIC(5,2) NOT NULL DEFAULT 0,
  default_amount NUMERIC(12,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fee_structures (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  fee_type_id    INT REFERENCES fee_types(id) ON DELETE CASCADE,
  amount         NUMERIC(12,2) NOT NULL,
  academic_year  TEXT,
  applies_class  TEXT,                         -- null = all
  applies_section TEXT,
  applies_group  TEXT,
  frequency      TEXT DEFAULT 'annual',        -- annual | monthly | quarterly | one-time
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- the admin module created a simpler fee_structures earlier; reconcile columns idempotently
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS fee_type_id INT REFERENCES fee_types(id) ON DELETE CASCADE;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS academic_year  TEXT;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS applies_class  TEXT;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS applies_section TEXT;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS applies_group  TEXT;

CREATE TABLE IF NOT EXISTS concessions (
  id          SERIAL PRIMARY KEY,
  student_id  INT REFERENCES students(id) ON DELETE CASCADE,
  group_name  TEXT,
  kind        TEXT,                             -- scholarship | staff_ward | sibling | other
  disc_type   TEXT NOT NULL,                    -- pct | flat
  value       NUMERIC(12,2) NOT NULL,
  fee_type_id INT REFERENCES fee_types(id),     -- null = all fee types
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS late_fee_rules (
  id          SERIAL PRIMARY KEY,
  fee_type_id INT REFERENCES fee_types(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,                    -- flat | pct_per_day
  value       NUMERIC(12,2) NOT NULL,
  grace_days  INT NOT NULL DEFAULT 0,
  max_cap     NUMERIC(12,2)
);

CREATE TABLE IF NOT EXISTS installment_plans (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  structure_id INT REFERENCES fee_structures(id) ON DELETE CASCADE,
  splits       JSONB NOT NULL                   -- [{label, pct|amount, due_date}]
);

CREATE TABLE IF NOT EXISTS invoices (
  id            SERIAL PRIMARY KEY,
  invoice_no    TEXT UNIQUE NOT NULL,
  student_id    INT REFERENCES students(id) ON DELETE CASCADE,
  academic_year TEXT,
  status        TEXT NOT NULL DEFAULT 'sent',   -- draft | sent | partial | paid | overdue | cancelled
  base          NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax           NUMERIC(12,2) NOT NULL DEFAULT 0,
  late_fee      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid          NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date      DATE,
  gstin         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id          SERIAL PRIMARY KEY,
  invoice_id  INT REFERENCES invoices(id) ON DELETE CASCADE,
  fee_type_id INT REFERENCES fee_types(id),
  description TEXT,
  hsn_code    TEXT,
  amount      NUMERIC(12,2) NOT NULL,            -- net (after discount, pre-tax)
  gst_rate    NUMERIC(5,2) DEFAULT 0,
  tax_amount  NUMERIC(12,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fee_payments (
  id              SERIAL PRIMARY KEY,
  receipt_no      TEXT UNIQUE NOT NULL,
  invoice_id      INT REFERENCES invoices(id) ON DELETE SET NULL,
  student_id      INT REFERENCES students(id) ON DELETE SET NULL,
  amount          NUMERIC(12,2) NOT NULL,
  method          TEXT,                          -- cash | cheque | upi | card | gateway
  gateway         TEXT,                          -- razorpay | payu | stripe | ccavenue
  gateway_txn_id  TEXT,
  idempotency_key TEXT UNIQUE,
  status          TEXT NOT NULL DEFAULT 'success',
  created_by      TEXT,
  meta            JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- idempotency cache: replaying a key returns the original response
CREATE TABLE IF NOT EXISTS fee_idempotency (
  key        TEXT PRIMARY KEY,
  response   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- webhook event de-dup (gateway delivers at-least-once)
CREATE TABLE IF NOT EXISTS fee_webhook_events (
  event_id   TEXT PRIMARY KEY,
  gateway    TEXT,
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- double-entry fee ledger ----
CREATE TABLE IF NOT EXISTS fee_accounts (
  id         SERIAL PRIMARY KEY,
  student_id INT UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'receivable', -- receivable (per student) | system
  name       TEXT
);
CREATE TABLE IF NOT EXISTS fee_ledger_txns (
  id         SERIAL PRIMARY KEY,
  ref        TEXT NOT NULL,
  kind       TEXT NOT NULL,                      -- invoice | payment | late_fee | discount | writeoff
  student_id INT,
  amount     NUMERIC(12,2),
  meta       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS fee_ledger_entries (
  id         SERIAL PRIMARY KEY,
  txn_id     INT NOT NULL REFERENCES fee_ledger_txns(id) ON DELETE CASCADE,
  account_id INT NOT NULL REFERENCES fee_accounts(id),
  direction  TEXT NOT NULL CHECK (direction IN ('debit','credit')),
  amount     NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fee_followups (
  id          SERIAL PRIMARY KEY,
  invoice_id  INT REFERENCES invoices(id) ON DELETE CASCADE,
  student_id  INT,
  stage       TEXT,                              -- pre_7 | due | post_3 | post_7 | escalation
  channel     TEXT,                              -- sms | whatsapp | email
  status      TEXT NOT NULL DEFAULT 'queued',    -- queued | sent
  scheduled_for TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fee_settings (
  key   TEXT PRIMARY KEY,
  value JSONB
);

CREATE INDEX IF NOT EXISTS idx_inv_student ON invoices(student_id, status);
CREATE INDEX IF NOT EXISTS idx_inv_due ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_pay_invoice ON fee_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_fledger_acct ON fee_ledger_entries(account_id);
