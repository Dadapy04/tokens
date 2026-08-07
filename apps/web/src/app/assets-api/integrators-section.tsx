import Image from 'next/image';
import Link from 'next/link';
import logomarkDflow from './logos/logomark-dflow.svg';
import logoPhantom from './logos/logo-phantom.svg';
import logoTitan from './logos/logo-titan.svg';

const INTEGRATORS = [
    {
        title: 'Wallets',
        body: 'Resolve any asset into the right canonical entity and surface the best onchain variant to hold or swap.',
    },
    {
        title: 'Trading Apps',
        body: 'Skip custom routing heuristics and send users straight to the strongest market for each variant.',
    },
    {
        title: 'Analytics',
        body: 'Unify names, tickers, mints, and markets under one asset layer your product can trust.',
    },
    {
        title: 'Agents',
        body: 'Verify assets before execution so automated flows target the right mint, market, and metadata.',
    },
] as const;

const CURRENT_INTEGRATORS = [
    {
        id: 'phantom',
        label: 'Phantom',
        src: logoPhantom,
        width: 110,
        height: 30,
        withWordmark: false,
        href: 'https://phantom.com',
    },
    {
        id: 'titan',
        label: 'Titan',
        src: logoTitan,
        width: 104,
        height: 30,
        withWordmark: false,
        href: 'https://titan.exchange/',
    },
    {
        id: 'dflow',
        label: 'DFlow',
        src: logomarkDflow,
        width: 30,
        height: 30,
        withWordmark: true,
        href: 'https://dflow.net',
    },
] as const;

export function IntegratorsSection() {
    return (
        <section className="bg-[#0F0F10]">
            <div className="mx-auto max-w-[1120px] px-6 pb-20 md:pb-28">
                <div className="border-x border-b border-[#2c2c2d]">
                    <div className="border-y border-[#2c2c2d] bg-white/[0.02] px-8 py-14 md:px-10 md:py-16">
                        <div className="flex w-full flex-col gap-8 md:flex-row md:items-end md:justify-between">
                            <div className="max-w-[560px]">
                                <p className="mb-4 font-berkeley-mono text-[12px] uppercase tracking-[0.18em] text-white/38">
                                    Built for Integrators
                                </p>
                                <h2 className="font-diatype-medium text-[length:var(--text-display)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-text-extra-high text-balance">
                                    One asset layer for every product surface.
                                </h2>
                            </div>
                            <p className="max-w-[420px] font-inter text-[length:var(--text-body-lg-size)] leading-[var(--leading-normal)] text-text-low text-pretty">
                                Plug canonical assets, verified variants, and ranked markets into the places your users
                                actually touch.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {INTEGRATORS.map((item, index) => {
                            const isRight = index % 2 === 1;
                            const isBottom = index >= 2;
                            const cls = [
                                'border-white/[0.08] p-8 md:p-10',
                                isRight ? 'border-l' : '',
                                isBottom ? 'border-t' : '',
                            ]
                                .filter(Boolean)
                                .join(' ');

                            return (
                                <div key={item.title} className={cls}>
                                    <p className="mb-3 font-berkeley-mono text-[12px] uppercase tracking-[0.16em] text-white/34">
                                        {item.title}
                                    </p>
                                    <p className="max-w-[420px] font-inter text-[length:var(--text-title-sm)] leading-[var(--leading-normal)] text-text-high text-pretty">
                                        {item.body}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-white/[0.08] px-8 py-8 md:px-10 md:py-10">
                        <p className="mb-5 font-berkeley-mono text-[12px] uppercase tracking-[0.16em] text-white/34">
                            Trusted by
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3">
                            {CURRENT_INTEGRATORS.map((integrator, index) => {
                                const noLeftDesktop = index > 0;
                                const noTopMobile = index > 0;
                                const cls = [
                                    'group flex h-16 min-w-0 items-center justify-center gap-3 border border-white/[0.08] px-6 transition-colors duration-200 hover:bg-white/[0.02]',
                                    noTopMobile && 'border-t-0 sm:border-t',
                                    noLeftDesktop && 'sm:border-l-0',
                                ]
                                    .filter(Boolean)
                                    .join(' ');

                                return (
                                    <Link
                                        key={integrator.id}
                                        href={integrator.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={integrator.label}
                                        className={cls}
                                    >
                                        <Image
                                            src={integrator.src}
                                            alt={integrator.label}
                                            width={integrator.width}
                                            height={integrator.height}
                                            className="h-12 w-auto opacity-80 saturate-0 transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:saturate-100"
                                        />
                                        {integrator.withWordmark ? (
                                            <span className="font-inter text-2xl font-semibold text-text-extra-high ml-[-10px]">
                                                DFlow
                                            </span>
                                        ) : null}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="border-t border-white/[0.08] px-8 py-5 md:px-10">
                        <p className="text-center font-berkeley-mono text-[12px] uppercase tracking-[0.18em] text-white/38">
                            90+ Integrators
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
