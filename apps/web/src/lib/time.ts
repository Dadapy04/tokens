export function alignEpochSeconds(epochSeconds: number, boundarySeconds: number): number {
    if (!Number.isFinite(epochSeconds)) return epochSeconds;
    if (!Number.isFinite(boundarySeconds) || boundarySeconds <= 1) return epochSeconds;
    return epochSeconds - (epochSeconds % boundarySeconds);
}
