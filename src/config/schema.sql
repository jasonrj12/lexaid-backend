-- LexAid PostgreSQL Schema
-- Run this in your Supabase SQL editor or psql

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ──────────────────────────────────────────────────────────────
-- ENUM types
-- ──────────────────────────────────────────────────────────────
CREATE TYPE user_role   AS ENUM ('citizen', 'lawyer', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'pending', 'suspended');

CREATE TYPE case_category AS ENUM (
  'land', 'labour', 'consumer', 'family', 'criminal', 'other'
);
CREATE TYPE case_status AS ENUM (
  'submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed'
);

CREATE TYPE article_status AS ENUM ('draft', 'pending_review', 'published', 'rejected');

-- ──────────────────────────────────────────────────────────────
-- USERS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     VARCHAR(200) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(30),
  role          user_role NOT NULL DEFAULT 'citizen',
  status        user_status NOT NULL DEFAULT 'active',
  -- PII stored encrypted (AES-256 applied at application layer)
  nic_encrypted VARCHAR(500),
  preferred_lang CHAR(2) NOT NULL DEFAULT 'en' CHECK (preferred_lang IN ('en','si','ta')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- LAWYER PROFILES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE lawyer_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slba_number       VARCHAR(50) NOT NULL,
  slba_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  specialisations   TEXT[] NOT NULL DEFAULT '{}',
  bio               TEXT,
  cases_handled     INT NOT NULL DEFAULT 0,
  avg_response_hrs  DECIMAL(6,2),
  avg_rating        DECIMAL(3,2),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- CASES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE cases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref             VARCHAR(20) UNIQUE NOT NULL, -- e.g. LX-2025-001
  citizen_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  lawyer_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  category        case_category NOT NULL,
  title           VARCHAR(300) NOT NULL,
  description     TEXT NOT NULL,
  status          case_status NOT NULL DEFAULT 'submitted',
  assigned_at     TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ,
  sla_deadline    TIMESTAMPTZ,  -- 72h from submission
  rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
  rating_comment  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- CASE DOCUMENTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE case_documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  filename    VARCHAR(300) NOT NULL,
  storage_key VARCHAR(500) NOT NULL,  -- Supabase Storage path
  mime_type   VARCHAR(100),
  size_bytes  INT,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- MESSAGES (secure thread per case)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ──────────────────────────────────────────────────────────────
CREATE TYPE notification_type AS ENUM (
  'case_submitted', 'case_assigned', 'case_status_change',
  'new_message', 'case_resolved', 'case_closed', 'case_rated',
  'lawyer_approved', 'lawyer_rejected',
  'sla_warning', 'sla_breach'
);

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  ref_case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  sms_sent    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- LIBRARY ARTICLES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE library_articles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            VARCHAR(200) UNIQUE NOT NULL,
  author_id       UUID NOT NULL REFERENCES users(id),
  category        case_category NOT NULL,
  status          article_status NOT NULL DEFAULT 'draft',
  title_en        VARCHAR(300) NOT NULL,
  title_si        VARCHAR(300),
  title_ta        VARCHAR(300),
  body_en         TEXT NOT NULL,
  body_si         TEXT,
  body_ta         TEXT,
  summary_en      TEXT,
  read_time_mins  SMALLINT,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- AUDIT LOG (immutable)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,  -- e.g. 'case.created', 'user.suspended'
  target_type VARCHAR(50),            -- e.g. 'case', 'user'
  target_id   UUID,
  metadata    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log must not be modified
-- (enforce via application layer; no UPDATE/DELETE grants in production)

-- ──────────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────────
CREATE INDEX idx_cases_citizen     ON cases(citizen_id);
CREATE INDEX idx_cases_lawyer      ON cases(lawyer_id);
CREATE INDEX idx_cases_status      ON cases(status);
CREATE INDEX idx_cases_category    ON cases(category);
CREATE INDEX idx_messages_case     ON messages(case_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_actor       ON audit_log(actor_id);
CREATE INDEX idx_audit_target      ON audit_log(target_type, target_id);
CREATE INDEX idx_articles_status   ON library_articles(status);
CREATE INDEX idx_articles_category ON library_articles(category);

-- ──────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at trigger
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated          BEFORE UPDATE ON users           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lawyer_profiles_updated BEFORE UPDATE ON lawyer_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cases_updated          BEFORE UPDATE ON cases           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_articles_updated       BEFORE UPDATE ON library_articles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- SEED: Admin account (password: demo1234 — bcrypt hash)
-- ──────────────────────────────────────────────────────────────
INSERT INTO users (full_name, email, password_hash, role, status, preferred_lang)
VALUES (
  'LexAid Admin',
  'admin@demo.com',
  '$2b$12$4jk2Qf5P8nXGb5zH6dFGG.O.0y2QZp/cE.V5aS4vJT3PsxB5LYhHa',
  'admin',
  'active',
  'en'
);
