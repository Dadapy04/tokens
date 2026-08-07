import { InvalidArgsError } from './assets';

const SOURCE = 'clickhouse_fill_quality' as const;
const RANGE_IDENTIFIER = '24h' as const;
const HORIZON = '5s' as const;

export interface FillQualityRow {
    mint: string;
    source: string;
    range_identifier: string;
    horizon: string;
    quote_mint: string;
    volume_24h_usd: number;
    trade_24h: number;
    bot_volume_24h_usd: number;
    bot_trade_24h: number;
    bot_volume_ratio: number;
    fee_24h_usd: number;
    fee_bps: number;
    flow_source_count: number;
    markout_pnl_24h_usd: number | null;
    markout_count: number | null;
    markout_bps: number | null;
    execution_score: number;
    is_eligible_for_primary: boolean;
    as_of: number;
    last_computed_at: number;
}

export interface FillQualityReadsRepo {
    findLatestByMints(mints: readonly string[]): Promise<FillQualityRow[]>;
}

export interface FillQualityDoc {
    mint: string;
    source: typeof SOURCE;
    rangeIdentifier: typeof RANGE_IDENTIFIER;
    horizon: typeof HORIZON;
    quoteMint: string;
    volume24hUSD: number;
    trade24h: number;
    botVolume24hUSD: number;
    botTrade24h: number;
    botVolumeRatio: number;
    fee24hUSD: number;
    feeBps: number;
    flowSourceCount: number;
    markoutPnl24hUSD?: number;
    markoutCount?: number;
    markoutBps?: number;
    executionScore: number;
    isEligibleForPrimary: boolean;
    asOf: number;
    lastComputedAt: number;
}

export interface GetLatestByMintsEntry {
    mint: string;
    fillQuality: FillQualityDoc | null;
}

function rowToDoc(row: FillQualityRow): FillQualityDoc | null {
    if (row.source !== SOURCE) return null;
    if (row.range_identifier !== RANGE_IDENTIFIER) return null;
    if (row.horizon !== HORIZON) return null;
    const out: FillQualityDoc = {
        mint: row.mint,
        source: SOURCE,
        rangeIdentifier: RANGE_IDENTIFIER,
        horizon: HORIZON,
        quoteMint: row.quote_mint,
        volume24hUSD: row.volume_24h_usd,
        trade24h: row.trade_24h,
        botVolume24hUSD: row.bot_volume_24h_usd,
        botTrade24h: row.bot_trade_24h,
        botVolumeRatio: row.bot_volume_ratio,
        fee24hUSD: row.fee_24h_usd,
        feeBps: row.fee_bps,
        flowSourceCount: row.flow_source_count,
        executionScore: row.execution_score,
        isEligibleForPrimary: row.is_eligible_for_primary,
        asOf: row.as_of,
        lastComputedAt: row.last_computed_at,
    };
    if (row.markout_pnl_24h_usd !== null) out.markoutPnl24hUSD = row.markout_pnl_24h_usd;
    if (row.markout_count !== null) out.markoutCount = row.markout_count;
    if (row.markout_bps !== null) out.markoutBps = row.markout_bps;
    return out;
}

export async function getLatestByMints(
    repo: FillQualityReadsRepo,
    args: unknown,
): Promise<GetLatestByMintsEntry[]> {
    if (typeof args !== 'object' || args === null) {
        throw new InvalidArgsError('args must be an object');
    }
    const a = args as { mints?: unknown };
    if (!Array.isArray(a.mints)) {
        throw new InvalidArgsError('mints must be an array of strings');
    }
    for (const item of a.mints) {
        if (typeof item !== 'string') {
            throw new InvalidArgsError('mints must be an array of strings');
        }
    }
    const mints = (a.mints as string[]).slice(0, 250).map(m => m.trim()).filter(Boolean);
    if (mints.length === 0) return [];

    const rows = await repo.findLatestByMints(mints);
    const byMint = new Map(rows.map(r => [r.mint, r] as const));
    return mints.map(mint => {
        const row = byMint.get(mint);
        if (!row) return { mint, fillQuality: null };
        return { mint, fillQuality: rowToDoc(row) };
    });
}
