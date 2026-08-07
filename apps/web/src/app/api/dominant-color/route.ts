import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { buildAllowedRemoteHosts, fetchWithValidatedRedirects, isAllowedRemoteHost } from '../_remote-asset-fetch';

const MAX_IMAGE_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 6_000;
const PUBLIC_DIR_CANDIDATES = [path.resolve(process.cwd(), 'public'), path.resolve(process.cwd(), 'apps/web/public')];

class DominantColorError extends Error {
    status: number;
    code: string;

    constructor(status: number, code: string, message: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

function parseAndNormalizeTargetUrl(request: Request): {
    target: URL;
    allowRequestHost: boolean;
    localPublicPath: string | null;
} {
    const { searchParams } = new URL(request.url);
    const raw = (searchParams.get('url') ?? '').trim();
    if (!raw) throw new DominantColorError(400, 'MissingUrl', 'Missing image URL');

    const isSameOriginPath = raw.startsWith('/') && !raw.startsWith('//');
    const allowRequestHost = raw.startsWith('/');
    const baseOrigin = new URL(request.url).origin;
    let target: URL;
    try {
        target = allowRequestHost ? new URL(raw, baseOrigin) : new URL(raw);
    } catch {
        throw new DominantColorError(400, 'InvalidUrl', 'Invalid image URL');
    }

    // Only allow https in prod; allow http in dev for local testing.
    const isHttp = target.protocol === 'http:';
    const isHttps = target.protocol === 'https:';
    if (!isHttp && !isHttps) throw new DominantColorError(400, 'InvalidProtocol', 'Unsupported image URL protocol');
    if (isHttp && process.env.NODE_ENV === 'production') {
        throw new DominantColorError(400, 'InvalidProtocol', 'HTTP image URLs are not allowed in production');
    }

    return {
        target,
        allowRequestHost,
        localPublicPath: isSameOriginPath ? target.pathname : null,
    };
}

function toHex(r: number, g: number, b: number): string {
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    return `#${[clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
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

function computeDominantColorRgba(rgba: Buffer): string | null {
    // We bucket into 12-bit RGB (4 bits per channel) and score by saturation * alpha
    // while ignoring near-white/near-black pixels.
    const buckets = new Map<number, { score: number; r: number; g: number; b: number }>();
    const MIN_CONTRAST_WITH_WHITE = 2.2;
    const MIN_SATURATION = 0.12;

    for (let i = 0; i + 3 < rgba.length; i += 4) {
        const r = rgba[i] ?? 0;
        const g = rgba[i + 1] ?? 0;
        const b = rgba[i + 2] ?? 0;
        const a = rgba[i + 3] ?? 0;

        if (a < 16) continue; // transparent

        const { s, l } = rgbToHsl(r, g, b);
        if (l > 0.96) continue; // white-ish background
        if (l < 0.06) continue; // black-ish background

        // If it's nearly gray, deprioritize heavily (but still allow).
        const saturationScore = Math.max(0.05, s);
        const alphaScore = a / 255;
        const score = saturationScore * alphaScore;

        const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        const existing = buckets.get(key);
        if (existing) {
            existing.score += score;
        } else {
            buckets.set(key, { score, r, g, b });
        }
    }

    let best: { score: number; r: number; g: number; b: number } | null = null;
    for (const v of buckets.values()) {
        // Prefer colors that stay visible on a light UI.
        if (contrastRatioWithWhite(v.r, v.g, v.b) < MIN_CONTRAST_WITH_WHITE) continue;
        if (rgbToHsl(v.r, v.g, v.b).s < MIN_SATURATION) continue;
        if (!best || v.score > best.score) best = v;
    }

    if (!best) return null;
    return toHex(best.r, best.g, best.b);
}

function normalizeLocalPublicPath(pathname: string): string {
    let decoded: string;
    try {
        decoded = decodeURIComponent(pathname);
    } catch {
        throw new DominantColorError(400, 'InvalidUrl', 'Invalid local image path');
    }

    if (!decoded.startsWith('/') || decoded.includes('\0')) {
        throw new DominantColorError(400, 'InvalidUrl', 'Invalid local image path');
    }

    const normalized = path.posix.normalize(decoded);
    if (normalized === '/' || !normalized.startsWith('/')) {
        throw new DominantColorError(400, 'InvalidUrl', 'Invalid local image path');
    }

    return normalized;
}

function buildPublicFileCandidates(pathname: string): string[] {
    const normalizedPath = normalizeLocalPublicPath(pathname);
    const seen = new Set<string>();
    const candidates: string[] = [];

    for (const publicDir of PUBLIC_DIR_CANDIDATES) {
        if (seen.has(publicDir)) continue;
        seen.add(publicDir);

        const filePath = path.resolve(publicDir, `.${normalizedPath}`);
        if (filePath !== publicDir && filePath.startsWith(`${publicDir}${path.sep}`)) {
            candidates.push(filePath);
        }
    }

    return candidates;
}

async function readLocalPublicImageBytes(pathname: string): Promise<Uint8Array> {
    const candidates = buildPublicFileCandidates(pathname);

    for (const filePath of candidates) {
        try {
            const stat = await fs.stat(filePath);
            if (!stat.isFile()) continue;
            if (stat.size > MAX_IMAGE_BYTES) throw new DominantColorError(413, 'ImageTooLarge', 'Image too large');

            const bytes = await fs.readFile(filePath);
            if (bytes.byteLength > MAX_IMAGE_BYTES) {
                throw new DominantColorError(413, 'ImageTooLarge', 'Image too large');
            }
            return new Uint8Array(bytes);
        } catch (error) {
            if (error instanceof DominantColorError) throw error;
            if (error && typeof error === 'object' && 'code' in error) {
                const code = (error as { code?: unknown }).code;
                if (code === 'ENOENT' || code === 'ENOTDIR' || code === 'EISDIR') continue;
            }
            throw new DominantColorError(502, 'LocalImageReadFailed', 'Failed to read local image');
        }
    }

    throw new DominantColorError(404, 'LocalImageNotFound', 'Local image not found');
}

async function fetchImageBytes(url: URL, requestUrl: string, allowRequestHost: boolean): Promise<Uint8Array> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const allowedHosts = buildAllowedRemoteHosts({ requestUrl, allowRequestHost });
        if (!isAllowedRemoteHost(url.hostname, allowedHosts)) {
            throw new DominantColorError(403, 'BlockedHost', 'Image host is not allowed');
        }

        const res = await fetchWithValidatedRedirects(
            url,
            {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                },
            },
            allowedHosts,
        );

        if (!res.ok) {
            throw new DominantColorError(res.status, 'FetchFailed', `Failed to fetch image (status ${res.status})`);
        }

        const contentLengthHeader = res.headers.get('content-length');
        const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
        if (contentLength != null && Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
            throw new DominantColorError(413, 'ImageTooLarge', 'Image too large');
        }

        const ab = await res.arrayBuffer();
        if (ab.byteLength > MAX_IMAGE_BYTES) throw new DominantColorError(413, 'ImageTooLarge', 'Image too large');
        return new Uint8Array(ab);
    } catch (error) {
        if (error instanceof DominantColorError) throw error;
        if (error instanceof Error && error.name === 'AbortError') {
            throw new DominantColorError(504, 'FetchTimeout', 'Timed out while fetching image');
        }
        throw new DominantColorError(502, 'FetchFailed', 'Failed to fetch image');
    } finally {
        clearTimeout(timer);
    }
}

export async function GET(request: Request): Promise<Response> {
    try {
        const targetRequest = parseAndNormalizeTargetUrl(request);
        const bytes = targetRequest.localPublicPath
            ? await readLocalPublicImageBytes(targetRequest.localPublicPath)
            : await fetchImageBytes(targetRequest.target, request.url, targetRequest.allowRequestHost);

        let data: Buffer;
        try {
            ({ data } = await sharp(bytes)
                .resize(64, 64, { fit: 'inside', withoutEnlargement: true })
                .ensureAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true }));
        } catch {
            throw new DominantColorError(422, 'ImageParseFailed', 'Failed to parse image');
        }

        const color = computeDominantColorRgba(data);
        if (!color) {
            return NextResponse.json({ color: null }, { status: 200 });
        }

        return NextResponse.json(
            { color },
            {
                status: 200,
                headers: {
                    // Icons rarely change; keep it cacheable.
                    'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
                },
            },
        );
    } catch (error) {
        if (error instanceof DominantColorError) {
            return NextResponse.json(
                {
                    error: {
                        _tag: error.code,
                        message: error.message,
                    },
                },
                { status: error.status },
            );
        }

        return NextResponse.json(
            {
                error: {
                    _tag: 'InternalServerError',
                    message: 'Failed to compute dominant color',
                },
            },
            { status: 500 },
        );
    }
}
