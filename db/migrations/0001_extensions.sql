-- 0001_extensions.sql
-- Foundational extensions and helpers used by later migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

CREATE TABLE IF NOT EXISTS schema_migrations (
    version    text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO schema_migrations(version) VALUES ('0001_extensions')
    ON CONFLICT (version) DO NOTHING;
