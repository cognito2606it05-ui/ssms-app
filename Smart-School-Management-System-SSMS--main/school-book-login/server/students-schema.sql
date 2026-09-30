-- ============================================================
--  Student Management module schema
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
  id               SERIAL PRIMARY KEY,
  admission_number TEXT UNIQUE NOT NULL,
  roll_number      TEXT,
  name             TEXT NOT NULL,
  dob              DATE,
  gender           TEXT,
  nationality      TEXT,
  religion         TEXT,
  blood_group      TEXT,
  photo_url        TEXT,
  -- contact
  address          TEXT,
  phone            TEXT,
  email            TEXT,
  emergency1_name  TEXT, emergency1_phone TEXT,
  emergency2_name  TEXT, emergency2_phone TEXT,
  -- academic
  class            TEXT,
  section          TEXT,
  admission_date   DATE,
  -- previous school
  prev_school      TEXT,
  prev_tc_number   TEXT,
  prev_percentage  NUMERIC(5,2),
  -- operational
  status           TEXT NOT NULL DEFAULT 'Active',  -- Active / Inactive / Transferred
  transport_route  TEXT,
  fee_status       TEXT DEFAULT 'Paid',             -- Paid / Partial / Overdue
  attendance_pct   NUMERIC(5,2) DEFAULT 100,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_documents (
  id            SERIAL PRIMARY KEY,
  student_id    INT REFERENCES students(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL,                  -- photo / tc / birth / id_proof / medical
  filename      TEXT NOT NULL,                  -- stored name on disk
  original_name TEXT,
  mime          TEXT,
  size_bytes    INT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_guardians (
  id             SERIAL PRIMARY KEY,
  student_id     INT REFERENCES students(id) ON DELETE CASCADE,
  parent_user_id INT REFERENCES users(id),
  name           TEXT,
  relation       TEXT,
  phone          TEXT,
  email          TEXT,
  is_primary     BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS id_cards (
  id            SERIAL PRIMARY KEY,
  student_id    INT UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  card_no       TEXT UNIQUE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',  -- active / blocked / expired
  wallet_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    DATE
);

CREATE TABLE IF NOT EXISTS card_transactions (
  id            SERIAL PRIMARY KEY,
  card_id       INT REFERENCES id_cards(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,                  -- topup / spend
  amount        NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2),
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_ai_scores (
  student_id      INT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  dropout_risk    INT,                          -- 0..100
  engagement      INT,                          -- 0..100
  predicted_grade TEXT,
  learning_style  TEXT,
  recommendations JSONB,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS anomaly_alerts (
  id           SERIAL PRIMARY KEY,
  student_id   INT REFERENCES students(id) ON DELETE CASCADE,
  kind         TEXT,                            -- attendance / grade
  severity     TEXT,                            -- low / medium / high
  message      TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_filters (
  id          SERIAL PRIMARY KEY,
  user_email  TEXT NOT NULL,
  name        TEXT NOT NULL,
  filter      JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_class ON students (class, section);
CREATE INDEX IF NOT EXISTS idx_students_status ON students (status);
CREATE INDEX IF NOT EXISTS idx_docs_student ON student_documents (student_id);
