-- ============================================================
--  Fee Management schema V2 — upgrades
--  Run AFTER fees-schema.sql (idempotent)
-- ============================================================

-- Allow editing/deleting fee structures
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Allow editing concessions
ALTER TABLE concessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE concessions ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2025-2026';
ALTER TABLE concessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Invoice additional fields
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_cycle TEXT;  -- e.g. 'Q1', 'monthly-Jul'
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS installment_plan_id INT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Fee payments additional fields
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS cheque_no TEXT;
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS cheque_date DATE;
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Notification queue (if not already created by another module)
CREATE TABLE IF NOT EXISTS notification_queue (
  id            SERIAL PRIMARY KEY,
  student_id    INT,
  channel       TEXT NOT NULL,          -- sms | whatsapp | email | push
  message       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'queued',  -- queued | sent | failed
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  sent_at       TIMESTAMPTZ,
  meta          JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment gateway configuration
CREATE TABLE IF NOT EXISTS payment_gateway_config (
  id          SERIAL PRIMARY KEY,
  gateway     TEXT UNIQUE NOT NULL,    -- razorpay | payu | stripe | ccavenue
  is_active   BOOLEAN DEFAULT FALSE,
  config      JSONB,                   -- encrypted keys, merchant IDs etc
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Fee waiver requests (AI-recommended or manual)
CREATE TABLE IF NOT EXISTS fee_waiver_requests (
  id            SERIAL PRIMARY KEY,
  student_id    INT REFERENCES students(id) ON DELETE CASCADE,
  invoice_id    INT REFERENCES invoices(id) ON DELETE SET NULL,
  reason        TEXT NOT NULL,
  recommended_by TEXT DEFAULT 'manual', -- manual | ai
  waiver_type   TEXT NOT NULL,          -- full | partial
  waiver_amount NUMERIC(12,2),
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  approved_by   TEXT,
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waiver_student ON fee_waiver_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_waiver_status ON fee_waiver_requests(status);
CREATE INDEX IF NOT EXISTS idx_inv_billing ON invoices(billing_cycle);
CREATE INDEX IF NOT EXISTS idx_notif_status ON notification_queue(status, scheduled_for);
