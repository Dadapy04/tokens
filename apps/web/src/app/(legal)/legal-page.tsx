import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import type { LegalBlock, LegalDocument } from './legal-content';

interface LegalPageProps {
    document: LegalDocument;
}

export function LegalPage({ document }: LegalPageProps) {
    return (
        <main className="min-h-dvh bg-[#F7F7F7] px-6 pt-28 text-[#1C1C1D] md:pt-36">
            <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[250px_minmax(0,760px)] lg:gap-20">
                <aside className="lg:sticky lg:top-28 lg:self-start">
                    <Link
                        href="/"
                        className="inline-flex text-[13px] font-medium text-[#5F6063] transition-colors hover:text-[#1C1C1D]"
                    >
                        Tokens
                    </Link>
                    <nav
                        className="mt-8 hidden rounded-[8px] border border-[#E1E1E2] bg-white/70 p-3 lg:block"
                        aria-label={`${document.title} sections`}
                    >
                        <ol className="space-y-1">
                            {document.sections.map(section => (
                                <li key={section.id}>
                                    <a
                                        href={`#${section.id}`}
                                        className="block rounded-[6px] px-3 py-2 text-[12px] leading-4 font-medium text-[#6B6C6F] transition-colors hover:bg-[#F1F1F1] hover:text-[#1C1C1D]"
                                    >
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                </aside>

                <article className="min-w-0">
                    <header className="border-b border-[#DADADC] pb-10">
                        <p className="text-[12px] leading-none font-semibold tracking-[0.08em] text-[#707174] uppercase">
                            {document.eyebrow}
                        </p>
                        <h1 className="mt-5 text-[44px] leading-[0.95] font-semibold tracking-0 text-balance md:text-[64px]">
                            {document.title}
                        </h1>
                        <p className="mt-6 text-[13px] leading-5 text-[#6B6C6F]">
                            Last updated: {document.lastUpdated}
                        </p>
                        <div className="mt-8 space-y-5 text-[15px] leading-7 text-[#444548]">
                            {document.intro.map(paragraph => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                        </div>
                    </header>

                    <div className="divide-y divide-[#DADADC]">
                        {document.sections.map(section => (
                            <section key={section.id} id={section.id} className="scroll-mt-28 py-10 md:py-12">
                                <h2 className="text-[26px] leading-[1.05] font-semibold tracking-0 text-balance md:text-[32px]">
                                    {section.title}
                                </h2>
                                <div className="mt-7 space-y-5">
                                    {section.blocks.map((block, index) => (
                                        <LegalBlockView key={`${section.id}-${index}`} block={block} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </article>
            </div>

            <div className="mx-auto mt-16 max-w-[1120px] border-t border-[#DADADC]">
                <SiteFooter tone="light" />
            </div>
        </main>
    );
}

function LegalBlockView({ block }: { block: LegalBlock }) {
    if (block.type === 'subheading') {
        return <h3 className="pt-2 text-[16px] leading-6 font-semibold text-[#252628]">{block.text}</h3>;
    }

    if (block.type === 'notice') {
        return (
            <p className="rounded-[8px] border border-[#D7D7D9] bg-white px-4 py-4 text-[13px] leading-6 font-semibold text-[#252628]">
                {block.text}
            </p>
        );
    }

    if (block.type === 'list') {
        return (
            <ul className="list-disc space-y-3 pl-5 text-[14px] leading-6 text-[#4B4C4E] marker:text-[#9A9B9E]">
                {block.items.map(item => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        );
    }

    if (block.type === 'address') {
        return (
            <address className="not-italic rounded-[8px] border border-[#DADADC] bg-white p-4 text-[14px] leading-6 text-[#3B3C3F]">
                {block.lines.map(line => (
                    <span key={line} className="block">
                        {line}
                    </span>
                ))}
            </address>
        );
    }

    return <p className="text-[14px] leading-7 text-[#4B4C4E]">{block.text}</p>;
}
