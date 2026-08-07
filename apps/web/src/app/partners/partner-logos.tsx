import Image from 'next/image';

export type PartnerLogoId = 'birdeye' | 'coingecko' | 'rwa' | 'dd' | 'sanctum';

const PARTNER_LOGO_SRC: Record<PartnerLogoId, string> = {
    birdeye: '/partners/birdeye-logo.svg',
    coingecko: '/partners/coingecko-logo.svg',
    rwa: '/partners/rwa-logo.svg',
    dd: '/partners/dd-logo.svg',
    sanctum: '/partners/sanctum-logo.svg',
};

export function PartnerLogo({ logo }: { logo: PartnerLogoId }) {
    return (
        <Image
            src={PARTNER_LOGO_SRC[logo]}
            alt=""
            width={40}
            height={40}
            className="size-12 object-contain"
            aria-hidden
        />
    );
}
