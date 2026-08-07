import { API_PLAYGROUND_OMIT_VALUE } from './api-playground-constants';
import type {
    ApiPlaygroundEndpointConfig,
    ApiPlaygroundFieldConfig,
    ApiPlaygroundMethod,
} from './api-playground-types';

export function isRawApiKey(value: string): boolean {
    return /^tok_[0-9a-f]{64}$/i.test(value.trim());
}

export function getDefaultApiBaseUrl(): string {
    const base =
        process.env.NEXT_PUBLIC_API_BASE_URL ??
        (process.env.NODE_ENV === 'production' ? 'https://api.tokens.xyz' : 'http://localhost:3002');
    return String(base ?? '')
        .trim()
        .replace(/\/$/, '');
}

export function prettyJson(value: unknown): string {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return JSON.stringify({ error: 'Unable to serialize response body.' }, null, 2);
    }
}

export function buildInitialFieldValues(endpoint: ApiPlaygroundEndpointConfig): Record<string, string> {
    const pathFields = endpoint.pathFields ?? [];
    const queryFields = endpoint.queryFields ?? [];

    return [...pathFields, ...queryFields].reduce<Record<string, string>>((values, field) => {
        values[field.key] = field.defaultValue ?? '';
        return values;
    }, {});
}

export function resolvePathTemplate(pathTemplate: string, values: Record<string, string>): string {
    return pathTemplate.replace(/\{([^}]+)\}/g, (_, token: string) => {
        const raw = values[token] ?? '';
        const trimmed = raw.trim();
        return trimmed ? encodeURIComponent(trimmed) : `{${token}}`;
    });
}

export function buildQueryString(fields: ApiPlaygroundFieldConfig[], values: Record<string, string>): string {
    if (fields.length === 0) return '';
    const params = new URLSearchParams();

    for (const field of fields) {
        const raw = values[field.key] ?? '';
        const trimmed = raw.trim();
        if (!trimmed) continue;
        if (trimmed === API_PLAYGROUND_OMIT_VALUE) continue;
        params.set(field.key, trimmed);
    }

    const encoded = params.toString();
    return encoded ? `?${encoded}` : '';
}

export function buildFieldId(endpointId: string, fieldKey: string): string {
    return `${endpointId}-${fieldKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

export function getMissingRequiredFields(
    endpoint: ApiPlaygroundEndpointConfig,
    values: Record<string, string>,
): string[] {
    const pathFields = endpoint.pathFields ?? [];
    const queryFields = endpoint.queryFields ?? [];

    return [...pathFields, ...queryFields]
        .filter(field => field.required)
        .filter(field => !(values[field.key] ?? '').trim())
        .map(field => field.label);
}

export function getMethodBadgeClassName(method: ApiPlaygroundMethod): string {
    if (method === 'POST') return 'bg-gray-50 text-text-high border border-border-light';
    if (method === 'PUT' || method === 'PATCH') return 'bg-gray-100 text-text-high border border-border-light';
    if (method === 'DELETE') return 'bg-gray-100 text-text-high border border-border-light';
    return 'bg-emerald-500/15 text-emerald-700 border border-emerald-600/20';
}

export function buildFetchSnippet(params: {
    apiBaseUrl: string;
    endpoint: ApiPlaygroundEndpointConfig;
    requestPath: string;
}): string {
    const { apiBaseUrl, endpoint, requestPath } = params;

    return [
        'const API_KEY = "<YOUR_API_KEY>";',
        '',
        `const response = await fetch(\`${apiBaseUrl || 'https://api.tokens.xyz'}${requestPath}\`, {`,
        `  method: "${endpoint.method}",`,
        '  headers: {',
        '    "x-api-key": API_KEY,',
        '    "accept": "application/json",',
        '  },',
        '});',
        '',
        'const data = await response.json();',
        'console.log(data);',
        '',
    ].join('\n');
}

export async function readResponseBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text.trim()) return {};

    try {
        return JSON.parse(text) as unknown;
    } catch {
        return { raw: text };
    }
}
