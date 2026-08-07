-- Rows migrated from Convex kept their Convex document id in `id` while
-- `coin_id` holds the CoinGecko slug. The coin-list sync inserts slug rows
-- with id = coin_id, so a legacy row collides on the coingecko_coins_by_coin_id
-- unique index while missing the ON CONFLICT (id) target, killing every batch
-- that touches one. Slug-based lookups (WHERE id = <slug>) also miss legacy
-- rows entirely. Normalize so id = coin_id everywhere; coingecko_coins has no
-- inbound foreign keys.

UPDATE coingecko_coins
SET id = coin_id
WHERE id <> coin_id;

INSERT INTO schema_migrations(version) VALUES ('0010_normalize_coingecko_coin_ids');
