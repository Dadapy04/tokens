'use client';

import { Logo } from '@/components/logo';

export function FooterAsteroidsEasterEgg({
    open,
    onOpenChange,
    tone = 'dark',
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tone?: 'dark' | 'light';
}) {
    return (
        <>
            <div className="footer-logo-hover-spin shrink-0 md:self-start">
                <button
                    type="button"
                    aria-label={open ? 'Hide Tokens Asteroids' : 'Launch Tokens Asteroids'}
                    aria-expanded={open}
                    className={
                        tone === 'dark'
                            ? 'inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-white outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] active:scale-95'
                            : 'inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-black outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95'
                    }
                    onClick={() => onOpenChange(!open)}
                >
                    <Logo width={24} height={24} className={tone === 'dark' ? 'brightness-0 invert' : undefined} />
                </button>
            </div>
        </>
    );
}
