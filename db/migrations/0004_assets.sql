-- 0004_assets.sql
-- Canonical assets, aliases, deletion tombstones, variants, materialized views,
-- collections.

CREATE TABLE assets (
    id           text PRIMARY KEY,
    asset_id     text NOT NULL,
    category     text NOT NULL,
    name         text,
    symbol       text,
    aliases      jsonb NOT NULL DEFAULT '[]'::jsonb,
    coingecko_id text,
    description  text,
    image_url    text,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX assets_by_asset_id ON assets (asset_id);
CREATE INDEX assets_by_category_and_asset_id ON assets (category, asset_id);
CREATE INDEX assets_by_category_and_active_and_asset_id ON assets (category, is_active, asset_id);
CREATE INDEX assets_search_name ON assets USING gin (to_tsvector('english', coalesce(name, '')));
CREATE INDEX assets_search_symbol ON assets USING gin (to_tsvector('english', coalesce(symbol, '')));

CREATE TABLE asset_aliases (
    id          text PRIMARY KEY,
    normalized  text NOT NULL,
    alias       text NOT NULL,
    asset_id    text NOT NULL,
    kind        text NOT NULL CHECK (kind IN ('assetId','name','symbol','ticker','coingeckoId','alias','mint','variantId','custom')),
    source      text,
    priority    integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX asset_aliases_by_normalized ON asset_aliases (normalized);
CREATE INDEX asset_aliases_by_asset_and_kind ON asset_aliases (asset_id, kind);
CREATE UNIQUE INDEX asset_aliases_by_asset_normalized_kind ON asset_aliases (asset_id, normalized, kind);
CREATE INDEX asset_aliases_search_alias ON asset_aliases USING gin (to_tsvector('english', alias));

CREATE TABLE asset_deletion_tombstones (
    id              text PRIMARY KEY,
    asset_id        text NOT NULL,
    normalized_ref  text NOT NULL,
    ref             text NOT NULL,
    kind            text NOT NULL CHECK (kind IN ('assetId','alias','name','symbol','coingeckoId','mint','singletonAssetId')),
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX asset_deletion_tombstones_by_normalized_ref ON asset_deletion_tombstones (normalized_ref);
CREATE INDEX asset_deletion_tombstones_by_asset_id ON asset_deletion_tombstones (asset_id);

CREATE TABLE asset_variants (
    id                 text PRIMARY KEY,
    asset_id           text NOT NULL,
    chain              text NOT NULL CHECK (chain IN ('solana')),
    mint               text NOT NULL,
    variant_id         text NOT NULL,
    kind               text NOT NULL,
    trust_tier         text NOT NULL,
    stock_variant_tier text,
    tags               jsonb NOT NULL DEFAULT '[]'::jsonb,
    source             text,
    issuer             text,
    issuer_url         text,
    label              text,
    is_active          boolean NOT NULL DEFAULT true,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX asset_variants_by_mint ON asset_variants (mint);
CREATE UNIQUE INDEX asset_variants_by_asset_and_variant_id ON asset_variants (asset_id, variant_id);
CREATE INDEX asset_variants_by_asset_and_mint ON asset_variants (asset_id, mint);
CREATE INDEX asset_variants_by_asset_active_mint ON asset_variants (asset_id, is_active, mint);

CREATE TABLE asset_variant_views (
    id            text PRIMARY KEY,
    key           text NOT NULL,
    asset_id      text NOT NULL,
    variants_json jsonb NOT NULL,
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX asset_variant_views_by_key ON asset_variant_views (key);

CREATE TABLE asset_collections (
    id          text PRIMARY KEY,
    slug        text NOT NULL,
    title       text NOT NULL,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX asset_collections_by_slug ON asset_collections (slug);

CREATE TABLE asset_collection_members (
    id              text PRIMARY KEY,
    collection_slug text NOT NULL,
    asset_id        text NOT NULL,
    rank            integer NOT NULL,
    added_at        bigint NOT NULL
);

CREATE INDEX asset_collection_members_by_slug_and_rank ON asset_collection_members (collection_slug, rank);
CREATE INDEX asset_collection_members_by_asset_and_slug ON asset_collection_members (asset_id, collection_slug);

INSERT INTO schema_migrations(version) VALUES ('0004_assets');
