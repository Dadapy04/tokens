import { CubeArt, NetworkDepthArt, PipelineArt, ValidatorPattern } from './infrastructure-art';

const INFRASTRUCTURE = [
    {
        title: 'Public-good API',
        body: 'Open access to Solana token data for builders, teams, wallets, explorers, and anyone shipping developer tools.',
        art: <ValidatorPattern />,
    },
    {
        title: 'Provider quality',
        body: 'Normalized data from specialist providers across market data, token metadata, liquidity, risk, and real-world assets.',
        art: <NetworkDepthArt />,
    },
    {
        title: 'Professional-grade uptime',
        body: 'Built for production workloads with reliable infrastructure, fast responses, and consistent API behavior.',
        art: <PipelineArt />,
    },
    {
        title: 'One developer surface',
        body: 'A single API layer for token data, so developers can avoid stitching together provider keys, schemas, and edge cases.',
        art: <CubeArt />,
    },
] as const;

export function InfrastructureSection() {
    return (
        <section className="bg-white px-6 py-20 md:py-24">
            <div className="mx-auto max-w-[1120px]">
                <div className="grid gap-6 md:grid-cols-[480px_1fr] md:items-start">
                    <h2 className="text-[32px] leading-[1.02] font-semibold tracking-0 text-balance md:text-[40px]">
                        Professional-grade data available to builders.
                    </h2>
                    <p className="max-w-[460px] text-[16px] leading-5 text-[#5F6063]">
                        Tokens is an open data layer for developers building on Solana, combining public network data,
                        partner feeds, and Foundation infrastructure into one API anyone can build with.
                    </p>
                </div>

                <div className="mt-12 grid gap-4 md:grid-cols-2">
                    {INFRASTRUCTURE.map(item => (
                        <div key={item.title} className="overflow-hidden rounded-[24px] border border-[#DADADC] bg-[#F4F4F4] p-1">
                            <div className="flex h-[148px] items-center justify-center overflow-hidden rounded-[20px] bg-white">
                                {item.art}
                            </div>
                            <div className="p-5">
                                <h3 className="text-[17px] leading-6 font-semibold">{item.title}</h3>
                                <p className="mt-3 text-[13px] leading-5 text-[#5C5D60]">{item.body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
