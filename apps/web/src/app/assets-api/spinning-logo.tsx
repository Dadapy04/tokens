'use client';

import { useEffect, useRef, useState } from 'react';
import { AssetsApiLogo } from './assets-api-logo';

export function SpinningLogo({
    onClick,
    ariaLabel = 'Launch Tokens Asteroids',
}: {
    onClick?: () => void;
    ariaLabel?: string;
}) {
    const ref = useRef<HTMLButtonElement | null>(null);
    const [hasSpun, setHasSpun] = useState(false);
    const [spinTick, setSpinTick] = useState(0);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setHasSpun(true);
                        observer.disconnect();
                        break;
                    }
                }
            },
            { threshold: 0.5 },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <style>{`
                @keyframes assets-api-logo-spin-once {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .assets-api-logo-rotor {
                    transform-origin: 50% 50%;
                    transform-box: view-box;
                }
                .assets-api-logo-spin-once .assets-api-logo-rotor {
                    animation: assets-api-logo-spin-once 1s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                @media (prefers-reduced-motion: reduce) {
                    .assets-api-logo-spin-once .assets-api-logo-rotor { animation: none; }
                }
            `}</style>
            <button
                type="button"
                ref={ref}
                aria-label={ariaLabel}
                className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10]"
                onMouseEnter={() => setSpinTick((t) => t + 1)}
                onClick={onClick}
            >
                <div
                    key={`spin-${spinTick}`}
                    className={hasSpun ? 'assets-api-logo-spin-once' : ''}
                >
                    <AssetsApiLogo />
                </div>
            </button>
        </>
    );
}
