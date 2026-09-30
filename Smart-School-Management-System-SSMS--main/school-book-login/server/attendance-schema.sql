-- ============================================================
--  Multi-modal AI Attendance module schema
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id            SERIAL PRIMARY KEY,
  academic_year TEXT,
  class         TEXT,
  section       TEXT,
  subject       TEXT,
  period_id     TEXT,
  mode          TEXT NOT NULL,                 -- manual / qr / face / biometric
  status        TEXT NOT NULL DEFAULT 'open',  -- open / closed
  grace_min     INT  NOT NULL DEFAULT 10,
  qr_token      TEXT,
  qr_expires_at TIMESTAMPTZ,
  started_by    TEXT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS attendance (
  id                   SERIAL PRIMARY KEY,
  student_id           INT REFERENCES students(id) ON DELETE CASCADE,
  session_id           INT REFERENCES attendance_sessions(id) ON DELETE SET NULL,
  attendance_date      DATE NOT NULL DEFAULT current_date,
  period_id            TEXT,
  status               TEXT NOT NULL,           -- present / absent / late / leave
  marked_by            TEXT,
  marking_method       TEXT,                    -- manual / qr / face / biometric / csv
  ts                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- face recognition fields
  face_match_confidence NUMERIC(5,2),
  camera_device_id      TEXT,
  face_template_version TEXT,
  liveness_verified     BOOLEAN,
  -- qr / device fields
  location_hash         TEXT,
  device_info           TEXT,
  UNIQUE (session_id, student_id)
);

CREATE TABLE IF NOT EXISTS attendance_audit (
  id            SERIAL PRIMARY KEY,
  attendance_id INT,
  student_id    INT,
  session_id    INT,
  old_status    TEXT,
  new_status    TEXT,
  changed_by    TEXT,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS biometric_devices (
  id         SERIAL PRIMARY KEY,
  device_id  TEXT UNIQUE NOT NULL,
  name       TEXT,
  type       TEXT,                              -- fingerprint / face / rfid
  api_key    TEXT NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS biometric_sync_logs (
  id         SERIAL PRIMARY KEY,
  device_id  TEXT,
  payload    JSONB,
  status     TEXT,                              -- ok / failed
  error      TEXT,
  attempts   INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS face_enrollments (
  student_id       INT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  consent          BOOLEAN NOT NULL DEFAULT FALSE,
  consent_at       TIMESTAMPTZ,
  template_cipher  TEXT,                         -- encrypted face template (at rest)
  template_version TEXT DEFAULT 'v1',
  image_filename   TEXT,
  enrolled_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS face_review_queue (
  id          SERIAL PRIMARY KEY,
  session_id  INT,
  student_id  INT,
  confidence  NUMERIC(5,2),
  reason      TEXT,                              -- low_confidence / unknown_face
  status      TEXT NOT NULL DEFAULT 'pending',  -- pending / approved / rejected
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_prefs (
  student_id INT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  sms        BOOLEAN DEFAULT TRUE,
  whatsapp   BOOLEAN DEFAULT TRUE,
  email      BOOLEAN DEFAULT TRUE,
  push       BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS notification_queue (
  id            SERIAL PRIMARY KEY,
  student_id    INT,
  channel       TEXT,
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'queued', -- queued / sent / held
  scheduled_for TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id         SERIAL PRIMARY KEY,
  staff_email TEXT,
  staff_kind TEXT,                              -- teaching / non-teaching
  attendance_date DATE NOT NULL DEFAULT current_date,
  status     TEXT NOT NULL,
  method     TEXT,
  ts         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_date_period ON attendance(student_id, attendance_date, period_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
