# @tokens/cloudrun-admin

Cloud Run service that handles the `admin` slice of the Convex → GCP migration. Implements the wire format that `apps/api/src/lib/cloudrun/CloudRunClient` calls into.

## Wire format

`POST /query/{name}` and `POST /mutation/{name}`, JSON body, `Authorization: Bearer <TOKENS_CLOUDRUN_AUTH_TOKEN>`. `GET /health` for the Cloud Run startup/liveness probe.

The names match the corresponding Convex export names (e.g. `listCategories`) so callers in `apps/api` can swap `fetchQuery(api.adminCuratedTokens.listCategories, args)` for `client.query('admin', 'listCategories', args)`.

### Caller identity

Every endpoint except `/health` requires the Clerk-session-verified caller forwarded in the `x-tokens-identity` header (base64 JSON `{ clerkUserId, projectId?, email? }`). Each handler calls `requireAdmin(identity)` against the `TOKENS_ADMIN_CLERK_USER_IDS` allowlist first — defense in depth on top of the Next.js proxy's own admin check.

- missing identity → `401 {"error":"identity_required"}`
- non-allowlisted caller → `403 {"error":"unauthorized"}`
- Convex-parity validation errors (e.g. `assetId is required`, `Variant not found`) → `400 {"error":"invalid_args","message":...}`

## Implemented

| Name | Kind | Parity source (`convex/adminCuratedTokens.ts`) |
| --- | --- | --- |
| `listCategories` | query | `listCategories` |
| `listCanonicalAssets` | query | `listCanonicalAssets` (best-variant selection, searchHints, logo resolution) |
| `listVariantsByAssetIds` | query | `listVariantsByAssetIds` (max 100 ids, liquidity-tier classification) |
| `getCanonicalEditor` | query | `getCanonicalEditor` |
| `getVariantEditor` | query | `getVariantEditor` |
| `searchCanonicalAssets` | query | `searchCanonicalAssets` (ILIKE over assetId/name/symbol/coingeckoId) |
| `previewMint` | query | `previewMint` |
| `createCanonicalAsset` | mutation | `createCanonicalAsset` (alias replacement + collection sync in one tx) |
| `updateCanonicalAsset` | mutation | `updateCanonicalAsset` (tri-state fields, `clearImage`, alias/collection sync) |
| `deleteCanonicalAsset` | mutation | `deleteCanonicalAsset` (guarded while variants exist) |
| `createVariant` | mutation | `createVariant` |
| `updateVariant` | mutation | `updateVariant` (variantId collision check) |
| `deleteVariant` | mutation | `deleteVariant` (variant + variant/token markets rows) |
| `deactivateVariant` | mutation | `deactivateVariant` |
| `moveVariantToCanonical` | mutation | `moveVariantToCanonical` |
| `removeFromCategory` | mutation | `removeFromCategory` |
| `hardDeleteAsset` | mutation | `hardDeleteAsset` (single-tx cascade incl. tombstones; always returns `deleted: true`, `pendingOhlcvDelete: false`) |

Postgres differences from Convex kept deliberately:

- `imageStorageId` / `logoSource: 'storage'` no longer exist (the migrator dropped Convex file storage); logo resolution is `image_url` → static fallback (`@tokens/asset-registry` `getCanonicalFallbackLogoPath`) → best-variant logo → none.
- `hardDeleteAsset` deletes OHLCV candles in one transaction (no Convex delete budget) and also clears the PG-only caches `variant_fill_quality_latest` and `asset_variant_views`.

## Env

| Var | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Cloud SQL Postgres connection string |
| `TOKENS_CLOUDRUN_AUTH_TOKEN` | yes | Shared bearer token with the `CloudRunClient` caller |
| `TOKENS_ADMIN_CLERK_USER_IDS` | yes | Comma-separated Clerk user ids allowed to call admin endpoints (empty ⇒ everything 403s) |
| `PORT` | no | Defaults to 8080 (Cloud Run's default) |
| `PG_POOL_MAX` | no | postgres-js connection pool size, default 10 |
| `PG_IDLE_TIMEOUT` | no | seconds, default 30 |

## Local dev

```bash
DATABASE_URL=postgres://... TOKENS_CLOUDRUN_AUTH_TOKEN=dev TOKENS_ADMIN_CLERK_USER_IDS=user_... \
    bun run apps/cloudrun-admin/src/index.ts
```

## Tests

```bash
bun test apps/cloudrun-admin/src
```

Handlers take stub repos (`AdminReadsRepo`, `AdminMutationsRepo`, `HardDeleteRepo`) so tests don't need a live Postgres; the transactional SQL helpers (alias replacement, collection rank sync) are covered with a recording fake `tx`.
