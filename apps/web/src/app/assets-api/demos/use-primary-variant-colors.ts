import { useEffect, useMemo, useState } from 'react';

import { colorFromTokenImage, type VariantHolding } from './wallet-demo-data';

export function usePrimaryVariantColors(holdings: ReadonlyArray<VariantHolding>): string[] {
    const fallbackColors = useMemo(
        () => holdings.map((holding) => colorFromTokenImage(holding.logoUrl)),
        [holdings],
    );
    const [colors, setColors] = useState(fallbackColors);

    useEffect(() => {
        let cancelled = false;
        setColors(fallbackColors);

        Promise.all(holdings.map((holding, index) => samplePrimaryColor(holding.logoUrl, fallbackColors[index])))
            .then((nextColors) => {
                if (!cancelled) setColors(nextColors);
            })
            .catch(() => {
                if (!cancelled) setColors(fallbackColors);
            });

        return () => {
            cancelled = true;
        };
    }, [fallbackColors, holdings]);

    return colors;
}

function samplePrimaryColor(imageUrl: string, fallbackColor: string): Promise<string> {
    return new Promise((resolve) => {
        if (!imageUrl || typeof window === 'undefined') {
            resolve(fallbackColor);
            return;
        }

        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.referrerPolicy = 'no-referrer';
        image.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const size = 24;
                canvas.width = size;
                canvas.height = size;
                const context = canvas.getContext('2d', { willReadFrequently: true });
                if (!context) {
                    resolve(fallbackColor);
                    return;
                }

                context.drawImage(image, 0, 0, size, size);
                const { data } = context.getImageData(0, 0, size, size);
                let r = 0;
                let g = 0;
                let b = 0;
                let count = 0;

                for (let index = 0; index < data.length; index += 4) {
                    const alpha = data[index + 3] / 255;
                    if (alpha < 0.35) continue;
                    const red = data[index];
                    const green = data[index + 1];
                    const blue = data[index + 2];
                    const max = Math.max(red, green, blue);
                    const min = Math.min(red, green, blue);
                    if (max < 28 || min > 238 || max - min < 10) continue;
                    r += red;
                    g += green;
                    b += blue;
                    count += 1;
                }

                if (count === 0) {
                    resolve(fallbackColor);
                    return;
                }

                resolve(`rgba(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}, 0.9)`);
            } catch {
                resolve(fallbackColor);
            }
        };
        image.onerror = () => resolve(fallbackColor);
        image.src = imageUrl;
    });
}
