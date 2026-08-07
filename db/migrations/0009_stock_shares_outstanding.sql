-- Underlying-company shares outstanding for public equities (yfinance via
-- clickhouse-api gateway preset `yfinance_shares_outstanding_latest`).
-- Company market cap is derived at read time as price_usd * shares_outstanding.

ALTER TABLE stock_prices_latest
    ADD COLUMN shares_outstanding double precision,
    ADD COLUMN shares_as_of double precision,
    ADD COLUMN shares_last_fetched_at bigint;

INSERT INTO schema_migrations(version) VALUES ('0009_stock_shares_outstanding');
