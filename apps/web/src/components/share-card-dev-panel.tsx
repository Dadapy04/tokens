'use client';

import 'dialkit/styles.css';
import { useDialKit, DialRoot } from 'dialkit';
import type { ShareCardStyleOverrides } from '@/components/share-card-with-chart';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useShareCardDevDials(): ShareCardStyleOverrides | undefined {
    // Hook must be called unconditionally (Rules of Hooks), but returns undefined in prod.
    // The DialKit UI (DialRoot) is gated separately so the panel never renders in prod.
    const values = useDialKit('Share Card', {
        Typography: {
            'Token Name Weight': [520, 300, 700, 10],
            'Token Name Letter Spacing (em)': [-0.02, -0.06, 0.02, 0.005],
            'Percentage Weight': [520, 300, 700, 10],
            'Percentage Letter Spacing (px)': [-2, -5, 1, 0.25],
        },
        Layout: {
            'Content Gap (px)': [40, 10, 80, 2],
        },
        Chart: {
            'Chart Height (px)': [648, 300, 900, 10],
            'Line Thickness (px)': [4, 1, 8, 0.5],
            'Data Points': [24, 8, 60, 1],
            'Curve Smoothness': [0.3, 0, 0.6, 0.05],
        },
    });

    if (!IS_DEV) return undefined;

    const typo = values.Typography as Record<string, number>;
    const layout = values.Layout as Record<string, number>;
    const chart = values.Chart as Record<string, number>;

    return {
        nameWeight: typo['Token Name Weight']!,
        nameLs: typo['Token Name Letter Spacing (em)']!,
        pctWeight: typo['Percentage Weight']!,
        pctLs: typo['Percentage Letter Spacing (px)']!,
        contentGap: layout['Content Gap (px)']!,
        chartHeight: chart['Chart Height (px)']!,
        chartStroke: chart['Line Thickness (px)']!,
        chartPoints: chart['Data Points']!,
        chartTension: chart['Curve Smoothness']!,
    };
}

export function ShareCardDialRoot() {
    if (!IS_DEV) return null;
    return <DialRoot position="bottom-right" defaultOpen theme="dark" productionEnabled />;
}
