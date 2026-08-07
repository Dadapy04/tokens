import type { PreviewValue } from './config';

export function appendSearchParam(params: URLSearchParams, key: string, value: PreviewValue | undefined) {
    if (value == null) return;

    if (Array.isArray(value)) {
        for (const item of value) {
            if (item == null || typeof item === 'object') continue;
            params.append(key, String(item));
        }
        return;
    }

    if (typeof value === 'object') return;

    params.set(key, String(value));
}
