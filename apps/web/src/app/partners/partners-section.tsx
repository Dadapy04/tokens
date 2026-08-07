import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { PARTNER_CONTACT_HREF } from './constants';
import { PartnerLogo, type PartnerLogoId } from './partner-logos';

type Partner = {
    name: string;
    description: string;
    logo: PartnerLogoId;
};

const PARTNERS: Partner[] = [
    {
        name: 'Birdeye',
        description: 'On-chain price data, trading volume, liquidity depth, and pool rankings across Solana.',
        logo: 'birdeye',
    },
    {
        name: 'Coingecko',
        description: 'Generalized market data, circulating supply, FDV, and aggregated historical price data.',
        logo: 'coingecko',
    },
    {
        name: 'RWA.xyz',
        description: 'Asset pricing, issuance data, and metadata for tokenized real-world assets on Solana.',
        logo: 'rwa',
    },
    {
        name: 'DD.xyz',
        description: 'On-chain due diligence and risk ratings for stablecoins, RWAs, and DeFi vaults on Solana.',
        logo: 'dd',
    },
    {
        name: 'Sanctum',
        description: 'LST metadata, staking APY, and liquidity pool data for liquid staking tokens on Solana.',
        logo: 'sanctum',
    },
];

export function PartnersSection() {
    return (
        <section className="bg-[#F1F1F1] px-6 py-20 md:py-24">
            <div className="mx-auto max-w-[1120px]">
                <div className="grid gap-6 md:grid-cols-[1fr_420px] md:items-start">
                    <h2 className="max-w-[342px] text-[36px] leading-none font-semibold tracking-0 text-balance md:max-w-none md:text-[44px]">
                        Partners & Contributors
                    </h2>
                    <p className="max-w-[420px] text-[16px] leading-5 text-[#5F6063]">
                        We work with top teams, each contributing their expertise to ensure the API provides the most
                        accurate and up-to-date data for the ecosystem.
                    </p>
                </div>

                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {PARTNERS.map(partner => (
                        <PartnerCard key={partner.name} {...partner} />
                    ))}
                    <BecomePartnerCard />
                </div>
            </div>
        </section>
    );
}

function PartnerCard({ name, description, logo }: Partner) {
    return (
        <article className="min-h-[176px] rounded-[22px] bg-white p-6 shadow-[0_0_0_1px_rgba(28,28,29,0.04)]">
            <PartnerLogo logo={logo} />
            <h3 className="mt-4 text-[21px] leading-6 font-semibold">{name}</h3>
            <p className="mt-4 text-[13px] leading-5 text-[#5C5D60]">{description}</p>
        </article>
    );
}

function BecomePartnerCard() {
    return (
        <Link
            href={PARTNER_CONTACT_HREF}
            className="hidden group flex min-h-[176px] items-center justify-center rounded-[14px] border border-[#DDDDDE] bg-[#F5F5F5] px-6 text-center text-[14px] font-medium text-[#6B6C6F] transition-colors hover:border-[#C8C8CA] hover:bg-white hover:text-[#1C1C1D]"
        >
            <span className="inline-flex items-center gap-1.5">
                Become a partner
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
        </Link>
    );
}
