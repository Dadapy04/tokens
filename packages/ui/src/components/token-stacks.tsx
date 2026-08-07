'use client';

import { cn } from '../lib/utils';

export interface TokenStackItem {
    imageUrl: string;
}

export function TokenStacks({
    items,
    className,
    max = 5,
    size = 20,
}: {
    items: TokenStackItem[];
    className?: string;
    max?: number;
    size?: number;
}) {
    const visible = items.filter((item) => !!item.imageUrl).slice(0, max);
    const remaining = Math.max(0, items.length - visible.length);

    return (
        <div className={cn('flex -space-x-3 rtl:space-x-reverse', className)}>
            {visible.map((item, index) => (
                <div
                    key={`${item.imageUrl}-${index}`}
                    className="overflow-hidden rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-sm shadow-black/10"
                    style={{ width: size, height: size }}
                >
                    <img
                        className="h-full w-full object-cover"
                        src={item.imageUrl}
                        alt=""
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                        }}
                    />
                </div>
            ))}
            {remaining > 0 && (
                <div
                    className="flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-xl text-center font-diatype-mono text-xs font-semibold text-white/70"
                    style={{ width: size, height: size }}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
}
