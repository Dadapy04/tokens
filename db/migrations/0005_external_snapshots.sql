-- 0005_external_snapshots.sql
-- Latest cached snapshots from external providers (CoinGecko, Webacy, RWA.xyz,
-- Sanctum, ClickHouse stocks, internal AI summaries, asset risk).

CREATE TABLE coingecko_coins (
    id                        text PRIMARY KEY,
    coin_id                   text NOT NULL,
    symbol                    text NOT NULL,
    name                      text NOT NULL,
    platforms                 jsonb NOT NULL DEFAULT '{}'::jsonb,
    last_synced_at            bigint NOT NULL,
    coin                      jsonb,
    last_metadata_fetched_at  bigint,
    created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX coingecko_coins_by_coin_id ON coingecko_coins (coin_id);
CREATE INDEX coingecko_coins_by_last_metadata_and_coin_id ON coingecko_coins (last_metadata_fetched_at, coin_id);
CREATE INDEX coingecko_coins_search_id ON coingecko_coins USING gin (to_tsvector('english', coin_id));
CREATE INDEX coingecko_coins_search_name ON coingecko_coins USING gin (to_tsvector('english', name));
CREATE INDEX coingecko_coins_search_symbol ON coingecko_coins USING gin (to_tsvector('english', symbol));

CREATE TABLE coingecko_coin_tickers_latest (
    id              text PRIMARY KEY,
    coin_id         text NOT NULL,
    name            text,
    tickers         jsonb NOT NULL,
    total           integer,
    last_fetched_at bigint NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX coingecko_coin_tickers_latest_by_coin_id ON coingecko_coin_tickers_latest (coin_id);
CREATE INDEX coingecko_coin_tickers_latest_by_fetched ON coingecko_coin_tickers_latest (last_fetched_at, coin_id);

CREATE TABLE coingecko_prices_latest (
    id                          text PRIMARY KEY,
    coin_id                     text NOT NULL,
    price_usd                   double precision,
    market_cap_usd              double precision,
    volume_24h_usd              double precision,
    price_change_24h_percent    double precision,
    provider_last_updated_at    double precision,
    last_fetched_at             bigint NOT NULL,
    created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX coingecko_prices_latest_by_coin_id ON coingecko_prices_latest (coin_id);
CREATE INDEX coingecko_prices_latest_by_fetched ON coingecko_prices_latest (last_fetched_at, coin_id);

CREATE TABLE webacy_token_latest (
    id              text PRIMARY KEY,
    chain           text NOT NULL,
    address         text NOT NULL,
    ok              boolean NOT NULL,
    status          integer NOT NULL,
    payload_json    text,
    error_message   text,
    last_fetched_at bigint NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX webacy_token_latest_by_chain_and_address ON webacy_token_latest (chain, address);
CREATE INDEX webacy_token_latest_by_fetched ON webacy_token_latest (last_fetched_at, chain, address);

CREATE TABLE webacy_trading_lite_latest (
    id              text PRIMARY KEY,
    chain           text NOT NULL,
    address         text NOT NULL,
    ok              boolean NOT NULL,
    status          integer NOT NULL,
    payload_json    text,
    error_message   text,
    last_fetched_at bigint NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX webacy_trading_lite_latest_by_chain_and_address ON webacy_trading_lite_latest (chain, address);
CREATE INDEX webacy_trading_lite_latest_by_fetched ON webacy_trading_lite_latest (last_fetched_at, chain, address);

CREATE TABLE webacy_holder_analysis_latest (
    id              text PRIMARY KEY,
    chain           text NOT NULL,
    address         text NOT NULL,
    ok              boolean NOT NULL,
    status          integer NOT NULL,
    payload_json    text,
    error_message   text,
    last_fetched_at bigint NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX webacy_holder_analysis_latest_by_chain_and_address ON webacy_holder_analysis_latest (chain, address);
CREATE INDEX webacy_holder_analysis_latest_by_fetched ON webacy_holder_analysis_latest (last_fetched_at, chain, address);

CREATE TABLE rwa_xyz_tokens_latest (
    id                              text PRIMARY KEY,
    network_slug                    text NOT NULL CHECK (network_slug IN ('solana')),
    address                         text NOT NULL,
    rwa_id                          integer,
    rwa_token_id                    integer,
    asset_id                        integer,
    name                            text,
    decimals                        integer,
    price_dollar                    double precision,
    market_value_dollar             double precision,
    net_asset_value_dollar          double precision,
    total_asset_value_dollar        double precision,
    circulating_asset_value_dollar  double precision,
    circulating_market_value_dollar double precision,
    apy_7_day                       double precision,
    apy_30_day                      double precision,
    total_supply_token              double precision,
    circulating_supply_token        double precision,
    holding_addresses_count         integer,
    payload_json                    text NOT NULL,
    last_fetched_at                 bigint NOT NULL,
    created_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX rwa_xyz_tokens_latest_by_network_and_address ON rwa_xyz_tokens_latest (network_slug, address);
CREATE INDEX rwa_xyz_tokens_latest_by_asset_id ON rwa_xyz_tokens_latest (asset_id);
CREATE INDEX rwa_xyz_tokens_latest_by_fetched ON rwa_xyz_tokens_latest (last_fetched_at, network_slug, address);

CREATE TABLE rwa_xyz_assets_latest (
    id                text PRIMARY KEY,
    asset_id          integer NOT NULL,
    name              text,
    ticker            text,
    slug              text,
    icon_url          text,
    website           text,
    issuer_id         text,
    issuer_name       text,
    asset_class_id    integer,
    asset_class_name  text,
    asset_class_slug  text,
    payload_json      text NOT NULL,
    last_fetched_at   bigint NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX rwa_xyz_assets_latest_by_asset_id ON rwa_xyz_assets_latest (asset_id);
CREATE INDEX rwa_xyz_assets_latest_by_fetched ON rwa_xyz_assets_latest (last_fetched_at, asset_id);
CREATE INDEX rwa_xyz_assets_latest_by_class_and_asset ON rwa_xyz_assets_latest (asset_class_slug, asset_id);

CREATE TABLE asset_risk_latest (
    id                     text PRIMARY KEY,
    asset_id               text NOT NULL,
    chain                  text NOT NULL,
    mint                   text NOT NULL,
    ok                     boolean NOT NULL,
    reason                 text,
    message                text,
    market_score_input     jsonb,
    market_score           jsonb,
    tags                   jsonb,
    risk_score_10          double precision,
    safety_score_10        double precision,
    lp_locked_percent      double precision,
    top_10_holders_percent double precision,
    holder_count           double precision,
    token_mint_time        text,
    last_fetched_at        bigint NOT NULL,
    created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX asset_risk_latest_by_asset_and_mint ON asset_risk_latest (asset_id, mint);
CREATE INDEX asset_risk_latest_by_mint ON asset_risk_latest (mint);
CREATE INDEX asset_risk_latest_by_fetched ON asset_risk_latest (last_fetched_at, mint);

CREATE TABLE token_description_summaries (
    id              text PRIMARY KEY,
    address         text NOT NULL,
    summary         text NOT NULL,
    source_hash     text,
    model           text,
    prompt_version  integer,
    generated_at    bigint NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX token_description_summaries_by_address ON token_description_summaries (address);

CREATE TABLE sanctum_lsts_latest (
    id              text PRIMARY KEY,
    mint            text NOT NULL,
    symbol          text,
    symbol_lower    text NOT NULL,
    name            text,
    logo_uri        text,
    website_url     text,
    tvl_usd         double precision,
    apy             double precision,
    source_rank     integer NOT NULL,
    raw_json        text NOT NULL,
    is_active       boolean NOT NULL,
    last_seen_at    bigint NOT NULL,
    last_synced_at  bigint NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sanctum_lsts_latest_by_mint ON sanctum_lsts_latest (mint);
CREATE INDEX sanctum_lsts_latest_by_active_and_rank ON sanctum_lsts_latest (is_active, source_rank);
CREATE INDEX sanctum_lsts_latest_by_symbol_lower ON sanctum_lsts_latest (symbol_lower);

CREATE TABLE stock_instruments_latest (
    id                 text PRIMARY KEY,
    asset_id           text NOT NULL,
    symbol             text NOT NULL,
    normalized_symbol  text NOT NULL,
    name               text,
    instrument_id      integer,
    dataset            text,
    is_active          boolean NOT NULL,
    source             text NOT NULL CHECK (source IN ('clickhouse')),
    last_synced_at     bigint NOT NULL,
    created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX stock_instruments_latest_by_asset_id ON stock_instruments_latest (asset_id);
CREATE INDEX stock_instruments_latest_by_normalized_symbol ON stock_instruments_latest (normalized_symbol);
CREATE INDEX stock_instruments_latest_by_active_and_asset ON stock_instruments_latest (is_active, asset_id);

CREATE TABLE stock_prices_latest (
    id                       text PRIMARY KEY,
    asset_id                 text NOT NULL,
    symbol                   text NOT NULL,
    normalized_symbol        text NOT NULL,
    price_usd                double precision,
    volume_24h_usd           double precision,
    price_change_24h_percent double precision,
    as_of                    double precision,
    last_fetched_at          bigint NOT NULL,
    source                   text NOT NULL CHECK (source IN ('clickhouse_stock')),
    created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX stock_prices_latest_by_asset_id ON stock_prices_latest (asset_id);
CREATE INDEX stock_prices_latest_by_normalized_symbol ON stock_prices_latest (normalized_symbol);
CREATE INDEX stock_prices_latest_by_fetched ON stock_prices_latest (last_fetched_at, asset_id);

INSERT INTO schema_migrations(version) VALUES ('0005_external_snapshots');
