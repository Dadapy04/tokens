import { Logo } from '@/components/logo';
import Link from 'next/link';
import { CtaLink } from './cta-link';
import { DOCS_HREF } from './constants';

export function FinalCta() {
    return (
        <section className="bg-white px-6 py-20 md:py-24">
            <div className="mx-auto max-w-[1120px]">
                <div className="flex min-h-[500px] flex-col items-center justify-center rounded-[24px] bg-[#F5F5F5] px-6 text-center">
                    <Logo width={36} height={36} className="mb-8" />
                    <h2 className="text-[40px] leading-none font-semibold tracking-0 md:text-[48px]">
                        Build with us.
                    </h2>
                    <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                        <CtaLink href="/assets-api">View the API</CtaLink>
                        <Link
                            href={DOCS_HREF}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-[#D7D7D9] bg-white px-5 text-[13px] font-semibold text-[#1C1C1D] transition-[background,transform] hover:bg-[#FAFAFA] active:scale-[0.96]"
                        >
                            Docs
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
