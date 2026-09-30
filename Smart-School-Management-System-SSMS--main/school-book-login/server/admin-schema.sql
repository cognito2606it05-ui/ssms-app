-- ============================================================
--  Super Admin Master Control Panel schema (extends RBAC)
-- ============================================================

-- account state for user management
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_reason  TEXT;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS twofa_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS effective_from DATE;

-- live login sessions (enables forced logout via revocation)
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,
  user_id       INT REFERENCES users(id) ON DELETE CASCADE,
  email         TEXT,
  role          TEXT,
  ip            TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked       BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_reason TEXT
);

-- general audit trail (who did what, when, from where)
CREATE TABLE IF NOT EXISTS audit_log (
  id          SERIAL PRIMARY KEY,
  actor_email TEXT,
  actor_role  TEXT,
  action      TEXT NOT NULL,
  target      TEXT,
  ip          TEXT,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- login attempts (failed + success) for the security tracker
CREATE TABLE IF NOT EXISTS login_attempts (
  id         SERIAL PRIMARY KEY,
  email      TEXT,
  ip         TEXT,
  success    BOOLEAN NOT NULL,
  country    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GDPR data export log
CREATE TABLE IF NOT EXISTS data_export_log (
  id          SERIAL PRIMARY KEY,
  actor_email TEXT,
  dataset     TEXT,
  rows        INT,
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GDPR right-to-erasure requests
CREATE TABLE IF NOT EXISTS erasure_requests (
  id            SERIAL PRIMARY KEY,
  subject_email TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  requested_by  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);

-- financial transactions
CREATE TABLE IF NOT EXISTS transactions (
  id          SERIAL PRIMARY KEY,
  ref         TEXT UNIQUE NOT NULL,
  description TEXT,
  amount      NUMERIC(12,2) NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'INR',
  role        TEXT,
  module      TEXT,
  method      TEXT,                       -- card / upi / netbanking / cash
  status      TEXT NOT NULL DEFAULT 'success', -- success / pending / failed / pending_approval
  gateway_ref TEXT,
  approved_by TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- institution-wide settings (key/value)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS fee_structures (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  applies_to  TEXT,                       -- student group
  frequency   TEXT,                       -- monthly / quarterly / annual / one-time
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id      SERIAL PRIMARY KEY,
  channel TEXT NOT NULL,                  -- email / sms / whatsapp
  name    TEXT NOT NULL,
  subject TEXT,
  body    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS integration_credentials (
  id          SERIAL PRIMARY KEY,
  provider    TEXT UNIQUE NOT NULL,
  key_cipher  TEXT NOT NULL,             -- AES-256-GCM encrypted
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS holidays (
  id    SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date  DATE NOT NULL,
  kind  TEXT DEFAULT 'holiday'           -- holiday / exam / event
);

CREATE TABLE IF NOT EXISTS backups (
  id         SERIAL PRIMARY KEY,
  filename   TEXT NOT NULL,
  size_bytes BIGINT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tx_created    ON transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditlog_created ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_created  ON login_attempts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user  ON sessions (user_id);
