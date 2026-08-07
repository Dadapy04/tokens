import { useQuery } from '@tanstack/react-query';
import { Effect } from 'effect';
import { apiJson } from '@/effect/api-client';

interface DominantColorResponse {
    color: string | null;
}

interface UseDominantColorOptions {
    enabled?: boolean;
}

const DOMINANT_COLOR_ALGO_VERSION = 6;

function srgbToLinear(channel: number): number {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(r: number, g: number, b: number): number {
    const rl = srgbToLinear(r);
    const gl = srgbToLinear(g);
    const bl = srgbToLinear(b);
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatioWithWhite(r: number, g: number, b: number): number {
    const lum = relativeLuminance(r, g, b);
    return (1 + 0.05) / (lum + 0.05);
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

    let h = 0;
    if (d !== 0) {
        switch (max) {
            case rn:
                h = ((gn - bn) / d) % 6;
                break;
            case gn:
                h = (bn - rn) / d + 2;
                break;
            default:
                h = (rn - gn) / d + 4;
                break;
        }
        h *= 60;
        if (h < 0) h += 360;
    }

    return { h, s, l };
}

function parseHexRgb(color: string): { r: number; g: number; b: number } | null {
    const trimmed = color.trim();
    const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(trimmed);
    if (!match) return null;

    const hex = match[1]!;
    const fullHex =
        hex.length === 3
            ? hex
                  .split('')
                  .map(c => c + c)
                  .join('')
            : hex;

    return {
        r: parseInt(fullHex.slice(0, 2), 16),
        g: parseInt(fullHex.slice(2, 4), 16),
        b: parseInt(fullHex.slice(4, 6), 16),
    };
}

function normalizeDominantColor(color: string | null): string | null {
    if (!color) return null;
    const rgb = parseHexRgb(color);
    if (!rgb) return color;

    // Ensure the accent is visible on our light UI; otherwise fall back to the default chart color.
    const MIN_CONTRAST_WITH_WHITE = 2.2;
    const MIN_SATURATION = 0.12;
    if (contrastRatioWithWhite(rgb.r, rgb.g, rgb.b) < MIN_CONTRAST_WITH_WHITE) return null;
    if (rgbToHsl(rgb.r, rgb.g, rgb.b).s < MIN_SATURATION) return null;
    return color;
}

export function useDominantColor(imageUrl: string | undefined, options: UseDominantColorOptions = {}) {
    const enabled = (options.enabled ?? true) && Boolean(imageUrl && imageUrl.trim().length > 0);
    const url = (imageUrl ?? '').trim();

    return useQuery<string | null>({
        queryKey: ['dominantColor', url, DOMINANT_COLOR_ALGO_VERSION],
        queryFn: async ({ signal }) => {
            try {
                const res = await Effect.runPromise(
                    apiJson<DominantColorResponse>({
                        // Include an algorithm version to bust browser/CDN caches when the heuristic changes.
                        url: `/api/dominant-color?url=${encodeURIComponent(url)}&v=${DOMINANT_COLOR_ALGO_VERSION}`,
                    }),
                    { signal },
                );
                const raw = typeof res.color === 'string' && res.color.trim() ? res.color.trim() : null;
                return normalizeDominantColor(raw);
            } catch (error) {
                if (signal.aborted) throw error;
                return null;
            }
        },
        enabled,
        retry: false,
        staleTime: 24 * 60 * 60 * 1000, // 24h
        gcTime: 7 * 24 * 60 * 60 * 1000, // 7d
    });
}
