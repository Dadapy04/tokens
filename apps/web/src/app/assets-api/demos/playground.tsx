'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { AgentTeslaPreview } from './agent-tesla-preview';
import { DemoEmptyState } from './demo-components';
import { JsonTree } from '../json-tree';
import { WalletPreview } from './wallet-preview';

export type DemoId = 'wallet' | 'agent-tesla';
type OutputTab = 'component' | 'response';

export interface AssetsApiDemo {
    id: DemoId;
    label: string;
    eyebrow: string;
    title: string;
    description: string;
    method: 'GET';
    path: string;
    params: ReadonlyArray<{
        name: string;
        value: string;
        note: string;
    }>;
    status: number;
    data: unknown;
    state: 'ok' | 'error';
    statusLabel?: string;
}

interface AssetsApiDemosPlaygroundProps {
    demos: AssetsApiDemo[];
}

export function AssetsApiDemosPlayground({ demos }: AssetsApiDemosPlaygroundProps) {
    if (demos.length === 0) return null;

    return (
        <div className="flex flex-col border-x border-[#2c2c2d] bg-[#0F0F10]">
            {demos.map((demo, index) => (
                <DemoPlaygroundSection key={demo.id} demo={demo} withTopBorder={index > 0} />
            ))}
        </div>
    );
}

function DemoPlaygroundSection({ demo, withTopBorder }: { demo: AssetsApiDemo; withTopBorder: boolean }) {
    const [outputTab, setOutputTab] = useState<OutputTab>('component');

    return (
        <div className={withTopBorder ? 'border-t border-[#2c2c2d]' : undefined}>
            <div className="grid min-h-[720px] grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                <ApiCallPanel demo={demo} />
                <OutputPanel demo={demo} outputTab={outputTab} onOutputTabChange={setOutputTab} />
            </div>
        </div>
    );
}

function ApiCallPanel({ demo }: { demo: AssetsApiDemo }) {
    return (
        <section className="min-w-0 border-b border-[#2c2c2d] bg-white/[0.02] p-5 lg:border-b-0 lg:border-r lg:p-6">
            <div>
                <p className="font-berkeley-mono text-xs uppercase tracking-[0.18em] text-white/44">
                    {demo.eyebrow}
                </p>
                <h2 className="mt-3 text-xl font-medium leading-7 text-white">{demo.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/52">{demo.description}</p>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-[#2c2c2d] bg-[#121213]">
                <div className="flex items-center gap-3 border-b border-[#2c2c2d] px-4 py-3">
                    <span className="rounded bg-[#00FFA3]/10 px-2 py-1 font-berkeley-mono text-xs font-medium text-[#00FFA3]">
                        {demo.method}
                    </span>
                    <StatusBadge demo={demo} />
                    <code className="min-w-0 truncate font-berkeley-mono text-[13px] text-white/78">{demo.path}</code>
                </div>
                <div className="divide-y divide-[#2c2c2d]">
                    {demo.params.map(param => (
                        <div key={param.name} className="grid gap-2 px-4 py-3 sm:grid-cols-[110px_minmax(0,1fr)]">
                            <div>
                                <code className="font-berkeley-mono text-[13px] text-white">{param.name}</code>
                                <div className="mt-1 font-berkeley-mono text-xs text-white/40">{param.value}</div>
                            </div>
                            <p className="text-sm leading-6 text-white/58">{param.note}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function StatusBadge({ demo }: { demo: AssetsApiDemo }) {
    const tone =
        demo.state === 'error'
            ? 'bg-rose-400/10 text-rose-200/78'
            : demo.statusLabel === 'sample'
              ? 'bg-white/8 text-white/52'
              : 'bg-[#00FFA3]/10 text-[#00FFA3]';

    return (
        <span className={`shrink-0 rounded px-2 py-1 font-berkeley-mono text-xs ${tone}`}>
            {demo.statusLabel ?? demo.status}
        </span>
    );
}

function OutputPanel({
    demo,
    outputTab,
    onOutputTabChange,
}: {
    demo: AssetsApiDemo;
    outputTab: OutputTab;
    onOutputTabChange: (tab: OutputTab) => void;
}) {
    return (
        <section className="flex min-w-0 flex-col bg-[#121213]">
            <div className="flex items-center justify-between gap-3 border-b border-[#2c2c2d] p-3">
                <div className="inline-flex rounded-md border border-[#2c2c2d] bg-black/20 p-1">
                    <TabButton active={outputTab === 'component'} onClick={() => onOutputTabChange('component')}>
                        Component
                    </TabButton>
                    <TabButton active={outputTab === 'response'} onClick={() => onOutputTabChange('response')}>
                        Response
                    </TabButton>
                </div>
                <CopyTextButton text={JSON.stringify(demo.data, null, 2)} label="Copy response" />
            </div>

            <div className="min-h-0 flex-1">
                {outputTab === 'response' ? (
                    <div className="h-full overflow-auto p-5">
                        <JsonTree value={demo.data} isMobile={false} />
                    </div>
                ) : (
                    <DemoPreview demo={demo} />
                )}
            </div>
        </section>
    );
}

function DemoPreview({ demo }: { demo: AssetsApiDemo }) {
    if (demo.state === 'error') {
        return (
            <DemoEmptyState
                title="Live data unavailable"
                message="The response tab contains the live API error returned for this demo."
            />
        );
    }

    switch (demo.id) {
        case 'wallet':
            return <WalletPreview data={demo.data} />;
        case 'agent-tesla':
            return <AgentTeslaPreview data={demo.data} />;
    }
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-8 rounded px-3 text-sm font-medium transition-colors ${
                active ? 'bg-white text-black' : 'text-white/52 hover:bg-white/[0.06] hover:text-white/84'
            }`}
        >
            {children}
        </button>
    );
}

function CopyTextButton({ text, label }: { text: string; label: string }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        } catch {
            setCopied(false);
        }
    }

    return (
        <button
            type="button"
            aria-label={copied ? 'Copied' : label}
            onClick={handleCopy}
            className="inline-flex size-8 items-center justify-center rounded-md text-white/48 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
            {copied ? <Check className="size-4 text-white" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        </button>
    );
}
