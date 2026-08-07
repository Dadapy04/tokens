import type { Metadata } from 'next';
import { SiteFooter } from '@/components/site-footer';
import { PartnersNav } from './partners-nav';
import { HeroSection } from './hero-section';
import { PartnersSection } from './partners-section';
import { InfrastructureSection } from './infrastructure-section';
import { FinalCta } from './final-cta';

export const metadata: Metadata = {
    title: 'Partners | Tokens',
    description:
        'The trusted data layer for Solana tokens, powered by public blockchain data and specialist data partners.',
};

export default function PartnersPage() {
    return (
        <main className="relative min-h-dvh overflow-x-hidden bg-white text-[#1C1C1D]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-gray-1400/5 to-transparent" />
            <PartnersNav />
            <HeroSection />
            <PartnersSection />
            <InfrastructureSection />
            <FinalCta />
            <section className="border-t border-gray-1400/10">
                <div className="mx-auto max-w-[1120px] px-6 pb-10">
                    <SiteFooter tone="light" />
                </div>
            </section>
        </main>
    );
}
