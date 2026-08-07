/**
 * Latency histogram helpers.
 *
 * Verbatim port of `convex/apiUsageHistogram.ts` — bucket bounds and merge
 * semantics must stay identical across backends so histograms written by
 * Convex, the Redis aggregate drain, and the GCP rollup job all combine
 * correctly.
 */

export const LATENCY_BOUNDS_MS: ReadonlyArray<number> = [
    25, 50, 75, 100, 150, 200, 300, 400, 600, 1_000, 2_000, 5_000, 10_000,
];

export function emptyLatencyHistogram(): number[] {
    return new Array(LATENCY_BOUNDS_MS.length + 1).fill(0);
}

export function normalizeLatencyHistogram(raw: unknown): number[] {
    const out = emptyLatencyHistogram();
    if (!Array.isArray(raw)) return out;

    for (let i = 0; i < out.length; i++) {
        const v = raw[i];
        out[i] = typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
    }
    return out;
}

export function binLatencyMs(latencyMs: number): number {
    const v = Number.isFinite(latencyMs) ? Math.max(0, Math.floor(latencyMs)) : 0;

    for (let i = 0; i < LATENCY_BOUNDS_MS.length; i++) {
        const bound = LATENCY_BOUNDS_MS[i] ?? 0;
        if (v <= bound) return i;
    }

    return LATENCY_BOUNDS_MS.length;
}

export function addLatencyHistograms(into: number[], add: number[]): number[] {
    const a = normalizeLatencyHistogram(into);
    const b = normalizeLatencyHistogram(add);

    for (let i = 0; i < a.length; i++) {
        a[i] = (a[i] ?? 0) + (b[i] ?? 0);
    }

    return a;
}

export function p95FromHistogram(histogram: number[]): number {
    const hist = normalizeLatencyHistogram(histogram);
    const total = hist.reduce((sum, n) => sum + n, 0);
    if (total <= 0) return 0;

    const target = Math.ceil(total * 0.95);
    let seen = 0;

    for (let i = 0; i < hist.length; i++) {
        seen += hist[i] ?? 0;
        if (seen >= target) {
            const bound = LATENCY_BOUNDS_MS[i];
            return typeof bound === 'number' ? bound : (LATENCY_BOUNDS_MS[LATENCY_BOUNDS_MS.length - 1] ?? 0);
        }
    }

    return LATENCY_BOUNDS_MS[LATENCY_BOUNDS_MS.length - 1] ?? 0;
}
