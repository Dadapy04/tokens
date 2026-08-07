import 'server-only';

export const OG_FONT_FAMILY_INTER = 'Inter';

type OgFontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface OgFont {
    name: string;
    data: ArrayBuffer;
    weight: OgFontWeight;
    style: 'normal';
}

let cachedInterFonts: Promise<OgFont[]> | null = null;

async function loadInterFonts(): Promise<OgFont[]> {
    return [];
}

export function getOgInterFonts(): Promise<OgFont[]> {
    if (!cachedInterFonts) cachedInterFonts = loadInterFonts();
    return cachedInterFonts;
}
