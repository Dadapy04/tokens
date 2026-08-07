-- 0007_ohlcv.sql
-- OHLCV candle tables (highest row count after api_request_events).

CREATE TABLE ohlcv_candles (
    id          text PRIMARY KEY,
    address     text NOT NULL,
    interval    text NOT NULL CHECK (interval IN ('1m','5m','15m','1H','4H','1D','1W')),
    time        bigint NOT NULL,
    open        double precision NOT NULL,
    high        double precision NOT NULL,
    low         double precision NOT NULL,
    close       double precision NOT NULL,
    volume      double precision NOT NULL,
    source      text,
    trade_count integer,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ohlcv_candles_by_address_interval_time
    ON ohlcv_candles (address, interval, time);

CREATE TABLE coingecko_ohlcv_candles (
    id         text PRIMARY KEY,
    coin_id    text NOT NULL,
    interval   text NOT NULL CHECK (interval IN ('1m','5m','15m','1H','4H','1D','1W')),
    time       bigint NOT NULL,
    open       double precision NOT NULL,
    high       double precision NOT NULL,
    low        double precision NOT NULL,
    close      double precision NOT NULL,
    volume     double precision NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX coingecko_ohlcv_candles_by_coin_interval_time
    ON coingecko_ohlcv_candles (coin_id, interval, time);

CREATE TABLE stock_ohlcv_candles (
    id                text PRIMARY KEY,
    asset_id          text NOT NULL,
    symbol            text NOT NULL,
    normalized_symbol text NOT NULL,
    interval          text NOT NULL CHECK (interval IN ('1m','5m','15m','1H','4H','1D','1W')),
    time              bigint NOT NULL,
    open              double precision NOT NULL,
    high              double precision NOT NULL,
    low               double precision NOT NULL,
    close             double precision NOT NULL,
    volume            double precision NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX stock_ohlcv_candles_by_asset_interval_time
    ON stock_ohlcv_candles (asset_id, interval, time);
CREATE INDEX stock_ohlcv_candles_by_norm_symbol_interval_time
    ON stock_ohlcv_candles (normalized_symbol, interval, time);

INSERT INTO schema_migrations(version) VALUES ('0007_ohlcv');
