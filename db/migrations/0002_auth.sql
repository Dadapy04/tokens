-- 0002_auth.sql
-- Users (Clerk identity mirror), projects, project membership, API keys.

CREATE TABLE users (
    id            text PRIMARY KEY,
    clerk_user_id text NOT NULL,
    primary_email text,
    full_name     text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_by_clerk_user_id ON users (clerk_user_id);
CREATE INDEX users_by_primary_email ON users (primary_email) WHERE primary_email IS NOT NULL;

CREATE TABLE projects (
    id                       text PRIMARY KEY,
    name                     text NOT NULL,
    description              text,
    tier                     text CHECK (tier IN ('free', 'pro', 'enterprise')),
    created_by_clerk_user_id text NOT NULL,
    personal_clerk_user_id   text,
    limits                   jsonb,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX projects_by_personal_clerk_user_id ON projects (personal_clerk_user_id) WHERE personal_clerk_user_id IS NOT NULL;
CREATE INDEX projects_by_creator_and_name ON projects (created_by_clerk_user_id, name);
CREATE INDEX projects_by_creator_and_created_at ON projects (created_by_clerk_user_id, created_at);

CREATE TABLE project_members (
    id            text PRIMARY KEY,
    project_id    text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    clerk_user_id text NOT NULL,
    role          text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX project_members_by_project_and_user ON project_members (project_id, clerk_user_id);
CREATE INDEX project_members_by_user_and_project ON project_members (clerk_user_id, project_id);

CREATE TABLE api_keys (
    id                              text PRIMARY KEY,
    owner_clerk_user_id             text NOT NULL,
    project_id                      text REFERENCES projects(id) ON DELETE SET NULL,
    name                            text NOT NULL,
    key_prefix                      text NOT NULL,
    key_hash                        text NOT NULL,
    encrypted_raw_key_ciphertext    text,
    encrypted_raw_key_iv            text,
    encrypted_raw_key_version       integer,
    encrypted_raw_key_created_at    bigint,
    scopes                          jsonb,
    created_by_clerk_user_id        text,
    created_at                      timestamptz NOT NULL DEFAULT now(),
    revoked_at                      bigint,
    last_used_at                    bigint
);

CREATE UNIQUE INDEX api_keys_by_key_hash ON api_keys (key_hash);
CREATE INDEX api_keys_by_project_and_created_at ON api_keys (project_id, created_at);
CREATE INDEX api_keys_by_owner_and_created_at ON api_keys (owner_clerk_user_id, created_at);
CREATE INDEX api_keys_active ON api_keys (project_id) WHERE revoked_at IS NULL;

INSERT INTO schema_migrations(version) VALUES ('0002_auth');
