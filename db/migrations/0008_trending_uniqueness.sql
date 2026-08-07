-- 0008_trending_uniqueness.sql
-- Enforce one row per mint in trending tables. The refresh cron upserts by
-- mint; without a UNIQUE constraint concurrent runs can dup rows for the
-- same mint and the `rank` / `category_rank` ordering becomes ambiguous.

ALTER TABLE trending_markets
    ADD CONSTRAINT trending_markets_mint_unique UNIQUE (mint);

ALTER TABLE fresh_trending_markets
    ADD CONSTRAINT fresh_trending_markets_mint_unique UNIQUE (mint);

INSERT INTO schema_migrations(version) VALUES ('0008_trending_uniqueness');
