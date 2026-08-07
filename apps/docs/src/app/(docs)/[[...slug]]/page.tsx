import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';

import { getMDXComponents } from '@/mdx-components';
import { source } from '@/lib/source';
import { CopyMarkdownButton } from '@/components/copy-markdown-button';

interface PageProps {
    params: Promise<{
        slug?: Array<string>;
    }>;
}

export default async function Page(props: PageProps) {
    const params = await props.params;
    const slug = params.slug ?? [];

    // Treat the quickstart as the docs homepage.
    if (slug.length === 0) redirect('/v1/quickstart');

    const page = source.getPage(slug);
    if (!page) notFound();

    const MDX = page.data.body;
    const slugPath = slug.join('/');
    const relativeLink = createRelativeLink(
        source as unknown as Parameters<typeof createRelativeLink>[0],
        page as unknown as Parameters<typeof createRelativeLink>[1],
    );

    return (
        <DocsPage toc={page.data.toc} full={page.data.full} className="xl:ms-0 xl:me-auto">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <DocsTitle>{page.data.title}</DocsTitle>
                </div>
                <div className="shrink-0">
                    <CopyMarkdownButton slugPath={slugPath} />
                </div>
            </div>
            <DocsDescription>{page.data.description}</DocsDescription>
            <DocsBody>
                <MDX
                    components={getMDXComponents({
                        a: relativeLink,
                    })}
                />
            </DocsBody>
        </DocsPage>
    );
}

export async function generateStaticParams() {
    return source.generateParams();
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const params = await props.params;
    const slug = params.slug ?? [];

    // Keep metadata stable for `/` (even though it redirects).
    const page = slug.length === 0 ? source.getPage(['v1', 'quickstart']) : source.getPage(slug);
    if (!page) notFound();

    return {
        title: page.data.title,
        description: page.data.description,
    };
}
