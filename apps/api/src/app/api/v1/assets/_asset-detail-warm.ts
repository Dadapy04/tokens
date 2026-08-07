/**
 * Thin re-export of the shared backend-branched cache-warm helpers so the
 * many existing importers keep working. See `@/lib/cloudrun/cacheWarm` for
 * the Cloud Run vs Convex branching.
 */
export {
    deferUntilAfterResponse,
    scheduleCacheWarm,
    scheduleCoingeckoOhlcvWarm,
    scheduleCoinPriceWarm,
    scheduleCoinMetadataWarm,
    scheduleCoingeckoTickersWarm,
    scheduleStockPriceWarm,
    scheduleStockOhlcvWarm,
    scheduleAssetRiskWarm,
} from '@/lib/cloudrun/cacheWarm';
