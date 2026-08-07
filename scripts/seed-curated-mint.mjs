import { loadLocalEnv } from './_env.mjs'
import { callCloudRun, cloudRunEnabled } from './_cloudrun.mjs'
import {
  CURATED_LIST_ORDER,
  getCuratedTokenAddresses,
  getCuratedTokenList,
} from '../packages/asset-registry/src/data/curated-token-lists.ts'
import { getWrapperGroupByAddress } from '../packages/asset-registry/src/data/token-wrappers.ts'

function getArg(name, fallback) {
  const flag = `--${name}`
  const idx = process.argv.indexOf(flag)
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]

  const envKey = `SEED_${name.toUpperCase().replaceAll('-', '_')}`
  if (process.env[envKey]) return process.env[envKey]

  return fallback
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toBool(value, fallback) {
  if (value == null) return fallback
  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false
  return fallback
}

function format(value) {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

function sleep(ms) {
  if (ms <= 0) return Promise.resolve()
  return new Promise(resolve => setTimeout(resolve, ms))
}

function hasFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function findContainingLists(mint) {
  const out = []

  for (const listId of CURATED_LIST_ORDER) {
    const list = getCuratedTokenList(listId)
    if (getCuratedTokenAddresses(list).includes(mint)) out.push(listId)
  }

  return out
}

await loadLocalEnv()

if (!cloudRunEnabled('assets')) {
  throw new Error(
    'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN.',
  )
}

const runQuery = (name, args) => callCloudRun('assets', 'query', name, args)
const runMutation = (name, args) => callCloudRun('assets', 'mutation', name, args)

const mint = String(getArg('mint', '')).trim()
if (!mint) throw new Error('Missing --mint')

const wrapperGroup = getWrapperGroupByAddress(mint)
const expectedAssetId = wrapperGroup ? String(wrapperGroup.assetId ?? wrapperGroup.coingeckoId ?? '').trim() : ''
const seededCoinId = wrapperGroup?.coingeckoId?.trim() ?? ''
const listIds = findContainingLists(mint)

const includeCuratedCollections = toBool(getArg('include-curated-collections', 'true'), true)
const warmVariantMarket = toBool(getArg('variant-market', 'true'), true)
const warmMarkets = toBool(getArg('markets', 'true'), true)
const warmCoinMetadata = toBool(getArg('coin-metadata', 'true'), true)
const warmCoinPrice = toBool(getArg('coin-price', 'true'), true)
const warmMintOhlcv = toBool(getArg('mint-ohlcv', 'true'), true)
const warmCoinOhlcv = toBool(getArg('coin-ohlcv', 'true'), true)
const timeoutMs = Math.max(toInt(getArg('timeout-ms', '90000'), 90000), 1000)
const pollMs = Math.max(toInt(getArg('poll-ms', '1500'), 1500), 250)

const defaultExpectedListId = listIds.includes('majors') ? 'majors' : (listIds[0] ?? '')
const expectedListId = String(getArg('expect-list', defaultExpectedListId)).trim()
const expectLatest = toBool(getArg('expect-latest', expectedListId ? 'true' : 'false'), Boolean(expectedListId))

console.log(
  [
    'Seeding curated mint',
    'backend=cloudrun',
    `mint=${mint}`,
    `expectedAssetId=${expectedAssetId || '(deferred)'}`,
    `coingeckoId=${seededCoinId || '(deferred)'}`,
    `lists=${listIds.join(',') || '(none)'}`,
    `expectList=${expectedListId || '(none)'}`,
    `expectLatest=${expectLatest}`,
  ].join(' | '),
)

const registrySeed = await runMutation('cacheWarmRequestRegistrySeed', {
  includeCuratedCollections,
})
console.log(`registrySeed=${format(registrySeed)}`)

const mintWarm = await runMutation('cacheWarmRequestMintsWarm', {
  mints: [mint],
  variantMarket: warmVariantMarket,
  markets: warmMarkets,
  minAgeMs: 0,
})
console.log(`mintWarm=${format(mintWarm)}`)

if (seededCoinId && warmCoinMetadata) {
  const metadataWarm = await runMutation('cacheWarmRequestCoinMetadata', {
    coinId: seededCoinId,
    minAgeMs: 0,
  })
  console.log(`coinMetadataWarm=${format(metadataWarm)}`)
}

if (seededCoinId && warmCoinPrice) {
  const priceWarm = await runMutation('cacheWarmRequestCoinPrice', {
    coinId: seededCoinId,
    minAgeMs: 0,
  })
  console.log(`coinPriceWarm=${format(priceWarm)}`)
}

const chartConfigs = [
  { interval: '1H', days: 90 },
  { interval: '4H', days: 365 },
  { interval: '1D', days: 365 },
  { interval: '1W', days: 365 },
]

if (warmMintOhlcv) {
  for (const cfg of chartConfigs) {
    const mintOhlcvWarm = await runMutation('cacheWarmRequest', {
      mint,
      variantMarket: false,
      markets: false,
      ohlcv: true,
      ohlcvInterval: cfg.interval,
      ohlcvDays: cfg.days,
      minAgeMs: 0,
    })
    console.log(`mintOhlcvWarm(${cfg.interval},${cfg.days}d)=${format(mintOhlcvWarm)}`)
  }
}

if (seededCoinId && warmCoinOhlcv) {
  for (const cfg of chartConfigs) {
    const coinOhlcvWarm = await runMutation('cacheWarmRequestCoingeckoOhlcv', {
      coinId: seededCoinId,
      interval: cfg.interval,
      days: cfg.days,
    })
    console.log(`coinOhlcvWarm(${cfg.interval},${cfg.days}d)=${format(coinOhlcvWarm)}`)
  }
}

const deadline = Date.now() + timeoutMs
let lastState = null
let requestedDeferredMetadata = Boolean(seededCoinId) || !warmCoinMetadata
let requestedDeferredPrice = Boolean(seededCoinId) || !warmCoinPrice

while (Date.now() < deadline) {
  const [variant, variantMarketsRows, tokenMarkets] = await Promise.all([
    runQuery('assetVariantsGetByMint', { mint, includeInactive: true }),
    runQuery('variantMarketsGetLatestByMints', { mints: [mint] }),
    runQuery('tokenMarketsGetLatestByMint', { mint }),
  ])

  const resolvedAssetId = expectedAssetId || variant?.assetId || ''
  const [asset, listMembers] = await Promise.all([
    resolvedAssetId ? runQuery('getByAssetId', { assetId: resolvedAssetId, includeInactive: true }) : null,
    expectedListId ? runQuery('assetCollectionsGetMembers', { slug: expectedListId, limit: 2000 }) : [],
  ])

  const resolvedCoinId = seededCoinId || asset?.coingeckoId?.trim() || ''

  if (resolvedCoinId && !requestedDeferredMetadata && warmCoinMetadata) {
    const metadataWarm = await runMutation('cacheWarmRequestCoinMetadata', {
      coinId: resolvedCoinId,
      minAgeMs: 0,
    })
    console.log(`coinMetadataWarm=${format(metadataWarm)}`)
    requestedDeferredMetadata = true
  }

  if (resolvedCoinId && !requestedDeferredPrice && warmCoinPrice) {
    const priceWarm = await runMutation('cacheWarmRequestCoinPrice', {
      coinId: resolvedCoinId,
      minAgeMs: 0,
    })
    console.log(`coinPriceWarm=${format(priceWarm)}`)
    requestedDeferredPrice = true
  }

  const price = resolvedCoinId
    ? await runQuery('coingeckoReadsGetPriceLatestByCoinId', { coinId: resolvedCoinId })
    : null

  const variantMarket = Array.isArray(variantMarketsRows) ? (variantMarketsRows[0]?.market ?? null) : null
  const members = Array.isArray(listMembers) ? listMembers : []
  const lastMember = members.length > 0 ? (members[members.length - 1] ?? null) : null
  const activeAssetId = resolvedAssetId || asset?.assetId || variant?.assetId || null

  lastState = {
    assetId: activeAssetId,
    coingeckoId: resolvedCoinId || null,
    variantAssetId: variant?.assetId ?? null,
    hasCanonicalVariant: expectedAssetId ? variant?.assetId === expectedAssetId : Boolean(variant?.assetId),
    hasCanonicalAsset: expectedAssetId ? asset?.assetId === expectedAssetId : Boolean(asset?.assetId),
    hasVariantMarket: Boolean(variantMarket && hasFiniteNumber(variantMarket.lastFetchedAt) && variantMarket.lastFetchedAt > 0),
    hasTokenMarkets: Boolean(tokenMarkets && hasFiniteNumber(tokenMarkets.lastFetchedAt) && tokenMarkets.lastFetchedAt > 0),
    hasCoinPrice: resolvedCoinId ? Boolean(price && hasFiniteNumber(price.priceUsd)) : true,
    listSize: members.length,
    hasExpectedListMember: expectedListId && activeAssetId ? members.includes(activeAssetId) : !expectedListId,
    isLatestInExpectedList: expectedListId && activeAssetId ? lastMember === activeAssetId : !expectedListId,
    lastMember,
  }

  const done =
    lastState.hasCanonicalVariant &&
    lastState.hasCanonicalAsset &&
    lastState.hasCoinPrice &&
    lastState.hasExpectedListMember &&
    (!expectLatest || lastState.isLatestInExpectedList)

  if (done) break
  await sleep(pollMs)
}

console.log('\nSummary:')
console.log(format(lastState))

if (
  !lastState ||
  !lastState.hasCanonicalVariant ||
  !lastState.hasCanonicalAsset ||
  !lastState.hasCoinPrice ||
  !lastState.hasExpectedListMember ||
  (expectLatest && !lastState.isLatestInExpectedList)
) {
  console.log('\nTimed out waiting for all background jobs to finish.')
  process.exitCode = 1
} else {
  console.log('\nDone.')
}
