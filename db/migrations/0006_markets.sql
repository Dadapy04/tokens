-- 0006_markets.sql
-- Market snapshots (variant + aggregated), trending, DEX markets, legacy tokens table.

CREATE TABLE tokens (
    id                        text PRIMARY KEY,
    address                   text NOT NULL,
    symbol                    text NOT NULL,
    name                      text NOT NULL,
    decimals                  integer NOT NULL,
    logo_uri                  text,
    coingecko_id              text,
    description               text,
    website                   text,
    twitter                   text,
    discord                   text,
    telegram                  text,
    reddit                    text,
    github                    text,
    price                     double precision,
    price_change_24h_percent  double precision,
    price_change_1h_percent   double precision,
    volume_24h_usd            double precision,
    liquidity                 double precision,
    market_cap                double precision,
    last_fetched_at           bigint NOT NULL,
    created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX tokens_by_address ON tokens (address);
CREATE INDEX tokens_by_last_fetched_and_address ON tokens (last_fetched_at, address);
CREATE INDEX tokens_search_name ON tokens USING gin (to_tsvector('english', name));
CREATE INDEX tokens_search_symbol ON tokens USING gin (to_tsvector('english', symbol));

CREATE TABLE variant_markets_latest (
    id                         text PRIMARY KEY,
    mint                       text NOT NULL,
    source                     text NOT NULL,
    metrics_source             text,
    birdeye_metrics            jsonb,
    rwa_metrics                jsonb,
    clickhouse_metrics         jsonb,
    symbol                     text,
    name                       text,
    decimals                   integer,
    logo_uri                   text,
    price                      double precision,
    liquidity                  double precision,
    volume_5m_usd              double precision,
    volume_15m_usd             double precision,
    volume_1h_usd              double precision,
    volume_6h_usd              double precision,
    volume_24h_usd             double precision,
    trade_5m                   double precision,
    trade_15m                  double precision,
    trade_1h                   double precision,
    trade_6h                   double precision,
    trade_24h                  double precision,
    unique_wallet_5m           double precision,
    unique_wallet_1h           double precision,
    unique_wallet_24h          double precision,
    market_cap                 double precision,
    fdv                        double precision,
    price_change_24h_percent   double precision,
    price_change_1h_percent    double precision,
    holder                     double precision,
    total_supply               double precision,
    circulating_supply         double precision,
    last_trade_human_time      text,
    extensions                 jsonb,
    as_of                      double precision,
    last_trade_at              double precision,
    last_fetched_at            bigint NOT NULL,
    overview_last_fetched_at   bigint,
    created_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX variant_markets_latest_by_mint ON variant_markets_latest (mint);
CREATE INDEX variant_markets_latest_by_fetched ON variant_markets_latest (last_fetched_at, mint);
CREATE INDEX variant_markets_latest_by_overview_fetched ON variant_markets_latest (overview_last_fetched_at, mint);

CREATE TABLE variant_fill_quality_latest (
    id                       text PRIMARY KEY,
    mint                     text NOT NULL,
    source                   text NOT NULL CHECK (source = 'clickhouse_fill_quality'),
    range_identifier         text NOT NULL CHECK (range_identifier = '24h'),
    horizon                  text NOT NULL CHECK (horizon = '5s'),
    quote_mint               text NOT NULL,
    volume_24h_usd           double precision NOT NULL,
    trade_24h                double precision NOT NULL,
    bot_volume_24h_usd       double precision NOT NULL,
    bot_trade_24h            double precision NOT NULL,
    bot_volume_ratio         double precision NOT NULL,
    fee_24h_usd              double precision NOT NULL,
    fee_bps                  double precision NOT NULL,
    flow_source_count        integer NOT NULL,
    markout_pnl_24h_usd      double precision,
    markout_count            integer,
    markout_bps              double precision,
    execution_score          double precision NOT NULL,
    is_eligible_for_primary  boolean NOT NULL,
    as_of                    bigint NOT NULL,
    last_computed_at         bigint NOT NULL,
    created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX variant_fill_quality_latest_by_mint ON variant_fill_quality_latest (mint);
CREATE INDEX variant_fill_quality_latest_by_as_of_and_mint ON variant_fill_quality_latest (as_of, mint);
CREATE INDEX variant_fill_quality_latest_by_computed_and_mint ON variant_fill_quality_latest (last_computed_at, mint);

CREATE TABLE asset_markets_latest (
    id                              text PRIMARY KEY,
    asset_id                        text NOT NULL,
    liquidity                       double precision NOT NULL,
    volume_24h_usd                  double precision NOT NULL,
    volume_30d_usd                  double precision,
    primary_mint                    text,
    last_computed_at                bigint NOT NULL,
    min_variant_last_fetched_at     bigint,
    max_variant_last_fetched_at     bigint,
    created_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX asset_markets_latest_by_asset_id ON asset_markets_latest (asset_id);
CREATE INDEX asset_markets_latest_by_computed_and_asset ON asset_markets_latest (last_computed_at, asset_id);

CREATE TABLE fresh_trending_markets (
    id                       text PRIMARY KEY,
    mint                     text NOT NULL,
    asset_id                 text NOT NULL,
    variant_id               text NOT NULL,
    category                 text NOT NULL,
    symbol                   text NOT NULL,
    name                     text NOT NULL,
    decimals                 integer,
    logo_uri                 text,
    source                   text NOT NULL,
    metrics_source           text,
    scoring_version          text NOT NULL,
    price                    double precision,
    liquidity                double precision,
    volume_5m_usd            double precision,
    volume_15m_usd           double precision,
    volume_1h_usd            double precision,
    volume_6h_usd            double precision,
    volume_24h_usd           double precision,
    trade_5m                 double precision,
    trade_15m                double precision,
    trade_1h                 double precision,
    trade_6h                 double precision,
    trade_24h                double precision,
    unique_wallet_5m         double precision,
    unique_wallet_1h         double precision,
    unique_wallet_24h        double precision,
    price_change_1h_percent  double precision,
    price_change_24h_percent double precision,
    last_trade_at            double precision,
    as_of                    double precision,
    last_fetched_at          bigint NOT NULL,
    trending_score           double precision NOT NULL,
    rank                     integer NOT NULL,
    category_rank            integer NOT NULL,
    last_computed_at         bigint NOT NULL,
    created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX fresh_trending_markets_by_rank ON fresh_trending_markets (rank);
CREATE INDEX fresh_trending_markets_by_category_and_rank ON fresh_trending_markets (category, category_rank);
CREATE INDEX fresh_trending_markets_by_mint ON fresh_trending_markets (mint);

CREATE TABLE trending_markets (
    id                       text PRIMARY KEY,
    mint                     text NOT NULL,
    asset_id                 text NOT NULL,
    variant_id               text NOT NULL,
    category                 text NOT NULL,
    symbol                   text NOT NULL,
    name                     text NOT NULL,
    decimals                 integer,
    logo_uri                 text,
    source                   text NOT NULL CHECK (source = 'clickhouse_trades'),
    scoring_version          text NOT NULL,
    price                    double precision,
    volume_5m_usd            double precision NOT NULL,
    volume_15m_usd           double precision NOT NULL,
    volume_1h_usd            double precision NOT NULL,
    volume_6h_usd            double precision NOT NULL,
    volume_24h_usd           double precision NOT NULL,
    trade_5m                 double precision NOT NULL,
    trade_15m                double precision NOT NULL,
    trade_1h                 double precision NOT NULL,
    trade_6h                 double precision NOT NULL,
    trade_24h                double precision NOT NULL,
    unique_wallet_5m         double precision NOT NULL,
    unique_wallet_1h         double precision NOT NULL,
    unique_wallet_24h        double precision NOT NULL,
    price_change_1h_percent  double precision,
    price_change_24h_percent double precision,
    trending_score           double precision NOT NULL,
    rank                     integer NOT NULL,
    category_rank            integer NOT NULL,
    last_trade_at            double precision,
    as_of                    bigint NOT NULL,
    last_computed_at         bigint NOT NULL,
    created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX trending_markets_by_mint ON trending_markets (mint);
CREATE INDEX trending_markets_by_rank ON trending_markets (rank);
CREATE INDEX trending_markets_by_category_and_rank ON trending_markets (category, category_rank);
CREATE INDEX trending_markets_by_computed_and_mint ON trending_markets (last_computed_at, mint);

CREATE TABLE token_markets_latest (
    id              text PRIMARY KEY,
    mint            text NOT NULL,
    source          text NOT NULL,
    markets         jsonb NOT NULL,
    total           integer NOT NULL,
    last_fetched_at bigint NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX token_markets_latest_by_mint ON token_markets_latest (mint);
CREATE INDEX token_markets_latest_by_fetched ON token_markets_latest (last_fetched_at, mint);

INSERT INTO schema_migrations(version) VALUES ('0006_markets');
