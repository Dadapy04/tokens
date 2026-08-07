import Link from 'next/link';
import type { ComponentProps } from 'react';

type CtaLinkProps = ComponentProps<typeof Link>;

/** Black pill call-to-action button used across the partners page. */
export function CtaLink({ className, ...props }: CtaLinkProps) {
    return (
        <Link
            {...props}
            className={`inline-flex h-9 items-center justify-center rounded-full bg-[#090909] px-5 text-[13px] font-semibold text-white transition-[background,transform] hover:bg-[#272729] active:scale-[0.96] ${className ?? ''}`}
        />
    );
}
