import Image from 'next/image';
import Link from 'next/link';
import logoBirdeye from './logos/logo-birdeye.svg';
import logoCoingecko from './logos/logo-coingecko.svg';
import logoRwa from './logos/logo-rwa.svg';
import logoSanctum from './logos/logo-sanctum.svg';
import logoWebacy from './logos/logo-webacy.svg';

const LOGOS = [
    { id: 'birdeye', label: 'Birdeye', src: logoBirdeye, href: 'https://birdeye.so' },
    { id: 'coingecko', label: 'CoinGecko', src: logoCoingecko, href: 'https://coingecko.com' },
    { id: 'rwa', label: 'RWA.xyz', src: logoRwa, href: 'https://rwa.xyz' },
    { id: 'sanctum', label: 'Sanctum', src: logoSanctum, href: 'https://sanctum.so' },
    { id: 'webacy', label: 'Webacy', src: logoWebacy, href: 'https://dd.xyz' },
] as const;

export function LogoBar() {
    return (
        <section className="bg-[#0F0F10]">
            <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-center gap-8 px-6 pt-0 pb-16">
                <p className="w-full text-center font-inter text-[length:var(--text-body-lg-size)] leading-[var(--leading-normal)] text-text-extra-low text-balance">
                    Powered by the most trusted data providers in the industry{' '}
                    <Link
                        href="/partners"
                        className="font-semibold text-text-low transition-colors hover:text-text-extra-high"
                    >
                        Learn more
                    </Link>
                </p>
                <div className="grid w-full grid-cols-2 sm:grid-cols-5">
                    {LOGOS.map((logo, index) => {
                        const noLeftMobile = index % 2 === 1;
                        const noTopMobile = index >= 2;
                        const noLeftDesktop = index > 0;
                        const cls = [
                            'group border border-white/[0.08] transition-colors duration-200 hover:bg-white/[0.02]',
                            noLeftMobile && 'border-l-0',
                            noTopMobile && 'border-t-0 sm:border-t',
                            noLeftDesktop && 'sm:border-l-0',
                        ]
                            .filter(Boolean)
                            .join(' ');

                        return (
                            <Link
                                key={logo.id}
                                href={logo.href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={logo.label}
                                className={`flex h-16 min-w-0 items-center justify-center px-6 ${cls}`}
                            >
                                <Image
                                    src={logo.src}
                                    alt={logo.label}
                                    className="h-12 w-auto max-w-[150px] opacity-70 saturate-0 transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:saturate-100"
                                />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
