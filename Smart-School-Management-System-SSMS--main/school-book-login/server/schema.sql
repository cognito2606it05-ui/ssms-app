-- ============================================================
--  SSMS RBAC schema (PostgreSQL)
--  17-role hierarchy + granular per-module permission matrix
-- ============================================================

CREATE TABLE IF NOT EXISTS modules (
  key   TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  sort  INT  DEFAULT 0
);

CREATE TABLE IF NOT EXISTS roles (
  key         TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  level       INT  NOT NULL,                 -- 1 (highest) .. 9
  access_pct  INT  NOT NULL,                 -- 0..100 headline access
  tier        TEXT NOT NULL CHECK (tier IN ('basic','premium')),
  is_custom   BOOLEAN NOT NULL DEFAULT FALSE,
  cloned_from TEXT REFERENCES roles(key),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per (role, module) holding the six granular flags.
CREATE TABLE IF NOT EXISTS role_permissions (
  role_key   TEXT NOT NULL REFERENCES roles(key)   ON DELETE CASCADE,
  module_key TEXT NOT NULL REFERENCES modules(key) ON DELETE CASCADE,
  can_read    BOOLEAN NOT NULL DEFAULT FALSE,
  can_write   BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit    BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete  BOOLEAN NOT NULL DEFAULT FALSE,
  can_approve BOOLEAN NOT NULL DEFAULT FALSE,
  can_export  BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (role_key, module_key)
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  primary_role  TEXT REFERENCES roles(key),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A user may hold several concurrent roles (e.g. teacher + hostel supervisor).
CREATE TABLE IF NOT EXISTS user_roles (
  user_id  INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL REFERENCES roles(key) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_key)
);

-- Every denied permission check is recorded here for the Super Admin panel.
CREATE TABLE IF NOT EXISTS audit_denials (
  id          SERIAL PRIMARY KEY,
  user_id     INT,
  email       TEXT,
  active_role TEXT,
  module_key  TEXT,
  action      TEXT,
  method      TEXT,
  path        TEXT,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_denials (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roleperm_role ON role_permissions (role_key);
