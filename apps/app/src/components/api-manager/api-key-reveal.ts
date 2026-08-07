export interface ApiKeyRevealResult {
    apiKeyId: string;
    rawKey: string;
}

export function normalizeApiKeyReveal(result: unknown): ApiKeyRevealResult | null {
    if (!result || typeof result !== 'object') return null;

    const record = result as Record<string, unknown>;
    const rawKeyCandidates = [record.rawKey, record.apiKey, record.apiKeyString, record.fullApiKey, record.key];
    const rawKey = rawKeyCandidates.find(value => typeof value === 'string' && value.trim().length > 0);
    const apiKeyId = record.apiKeyId;

    if (typeof rawKey !== 'string' || typeof apiKeyId !== 'string') return null;

    return { apiKeyId, rawKey };
}
