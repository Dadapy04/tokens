export function normalizeCoinGeckoCoinIdForAsset(params: {
    assetId: string;
    coinId: string | null | undefined;
}): string | null {
    const rawCoinId = (params.coinId ?? '').trim();
    if (!rawCoinId) return null;

    const assetId = params.assetId.trim();

    // Back-compat / alias fixes for canonical pricing:
    // - CoinGecko uses `binancecoin` (not `bnb`).
    if (assetId === 'bnb' && rawCoinId === 'bnb') return 'binancecoin';

    // - `tron` should map to TRX (`tron`), not the xStock coin id (`tron-xstock`).
    //   This can happen if legacy xStock grouping shadowed the canonical crypto asset.
    if (assetId === 'tron' && rawCoinId === 'tron-xstock') return 'tron';

    // - Canonical `spacex` must never inherit the legacy PreStocks CoinGecko listing
    //   (merged `spacex-prestocks` asset); its canonical market comes from our ClickHouse
    //   stock tables, with PreStocks remaining a variant.
    if (assetId === 'spacex' && rawCoinId === 'spacex-prestocks-2') return null;

    return rawCoinId;
}
