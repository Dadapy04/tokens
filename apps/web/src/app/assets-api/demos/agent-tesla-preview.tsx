'use client';

import {
    ArrowUp,
    ArrowUpDown,
    Brain,
    Check,
    CheckCircle2,
    DollarSign,
    Plus,
    ShieldCheck,
    Search,
    Wallet,
    Wrench,
    XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import {
    agentTeslaViewModelFromData,
    type AgentTeslaDemoViewModel,
    type GuardedCandidate,
    type UnsafeCandidate,
} from './agent-tesla-demo-data';
import { DemoGridBackground } from './demo-components';

type ChatTone = 'neutral' | 'success' | 'danger';
const DEMO_RECIPIENT_ADDRESS = '8xQe...9Kp2';

interface AgentWorkEntry {
    id: string;
    label: string;
    detail?: string;
    tone: ChatTone;
    icon?: 'brain' | 'check' | 'dollar' | 'search' | 'tool' | 'error';
    path?: string;
    content?: 'unsafe-candidates' | 'guarded-candidates' | 'unsafe-decision' | 'guarded-decision' | 'review-decision';
}

interface AgentFlow {
    intro: string;
    workLabel: string;
    entries: AgentWorkEntry[];
    decisionTitle: string;
    decisionBody: string;
    decisionTone: ChatTone;
    decisionContent: 'unsafe-decision' | 'guarded-decision' | 'review-decision';
}

export function AgentTeslaPreview({ data }: { data: unknown }) {
    const model = useMemo(() => agentTeslaViewModelFromData(data), [data]);
    const [apiGuardEnabled, setApiGuardEnabled] = useState(false);
    const [typedChars, setTypedChars] = useState(0);
    const [activeStep, setActiveStep] = useState(-1);
    const transcriptRef = useRef<HTMLDivElement>(null);
    const typedPrompt = `buy ${model.task.notionalLabel} of tesla`;
    const promptComplete = typedChars >= typedPrompt.length;
    const visiblePrompt = typedPrompt.slice(0, typedChars);
    const flow = useMemo(
        () => (apiGuardEnabled ? buildGuardedAgentFlow(model) : buildUnguardedAgentFlow(model)),
        [apiGuardEnabled, model],
    );

    useEffect(() => {
        setTypedChars(0);
        setActiveStep(-1);

        // Track progress locally so the interval can stop itself without
        // side effects inside the state updater (React may replay updaters).
        let count = 0;
        const interval = window.setInterval(() => {
            if (count >= typedPrompt.length) {
                window.clearInterval(interval);
                return;
            }

            count += 1;
            setTypedChars(count);
        }, 62);

        return () => window.clearInterval(interval);
    }, [apiGuardEnabled, typedPrompt]);

    useEffect(() => {
        if (!promptComplete) return;

        let interval: number | undefined;
        const startTimeout = window.setTimeout(() => {
            setActiveStep(0);
            // Track progress locally so the interval can stop itself without
            // side effects inside the state updater (React may replay updaters).
            let step = 0;
            interval = window.setInterval(() => {
                if (step >= flow.entries.length) {
                    if (interval) window.clearInterval(interval);
                    return;
                }

                step += 1;
                setActiveStep(step);
            }, 1650);
        }, 1050);

        return () => {
            window.clearTimeout(startTimeout);
            if (interval) window.clearInterval(interval);
        };
    }, [apiGuardEnabled, flow.entries.length, promptComplete]);

    useEffect(() => {
        const transcript = transcriptRef.current;
        if (!transcript) return;

        transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
    }, [activeStep, typedChars]);

    return (
        <div className="relative h-[660px] overflow-hidden p-4 sm:p-5">
            <DemoGridBackground />
            <style>{`
                @keyframes agent-chat-in {
                    from { opacity: 0; transform: translateY(8px) scale(0.985); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes agent-cursor {
                    0%, 48% { opacity: 1; }
                    49%, 100% { opacity: 0; }
                }
            `}</style>
            <div className="relative z-10 mx-auto flex h-full w-full max-w-[650px] flex-col overflow-hidden">
                <PathToggle enabled={apiGuardEnabled} onChange={setApiGuardEnabled} />

                <div
                    ref={transcriptRef}
                    className="min-h-0 flex-1 overflow-y-auto px-1 pb-4 pt-3 [mask-image:linear-gradient(to_bottom,transparent_0,black_52px,black_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0,black_52px,black_100%)] sm:px-2"
                    aria-live="polite"
                >
                    <div className="flex min-h-full flex-col justify-end gap-3 pt-12">
                        {promptComplete ? <UserMessage prompt={model.task.prompt} /> : null}

                        {promptComplete && activeStep >= 0 ? (
                            <AgentTurnMessage
                                key={apiGuardEnabled ? 'guarded' : 'open'}
                                flow={flow}
                                model={model}
                                activeStep={activeStep}
                            />
                        ) : null}
                    </div>
                </div>

                <ChatComposer
                    text={visiblePrompt}
                    complete={promptComplete}
                    guarded={apiGuardEnabled}
                />
            </div>
        </div>
    );
}

function PathToggle({
    enabled,
    onChange,
}: {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}) {
    return (
        <div className="relative z-20 mx-auto grid w-full max-w-[250px] grid-cols-2 gap-0.5 rounded-full border border-white/8 bg-black/35 p-0.5 shadow-[0_12px_36px_rgba(0,0,0,0.24)] backdrop-blur-md">
            <PathButton active={!enabled} tone="danger" onClick={() => onChange(false)}>
                Fails
            </PathButton>
            <PathButton active={enabled} tone="success" onClick={() => onChange(true)}>
                Succeeds
            </PathButton>
        </div>
    );
}

function PathButton({
    active,
    tone,
    onClick,
    children,
}: {
    active: boolean;
    tone: 'success' | 'danger';
    onClick: () => void;
    children: ReactNode;
}) {
    const activeClass =
        tone === 'success'
            ? 'border-[#00FFA3]/26 bg-[#00FFA3]/12 text-[#00FFA3]'
            : 'border-rose-300/24 bg-rose-300/10 text-rose-100';

    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={`inline-flex h-7 items-center justify-center gap-1 rounded-full border px-2 text-xs font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] ${
                active ? activeClass : 'border-transparent text-white/44 hover:bg-white/[0.05] hover:text-white/72'
            }`}
        >
            {tone === 'success' ? (
                <ShieldCheck className="size-3" aria-hidden />
            ) : (
                <XCircle className="size-3" aria-hidden />
            )}
            {children}
        </button>
    );
}

function UserMessage({ prompt }: { prompt: string }) {
    return (
        <div className="flex justify-end" style={{ animation: 'agent-chat-in 220ms cubic-bezier(0.23, 1, 0.32, 1) both' }}>
            <div className="max-w-[86%] rounded-2xl rounded-tr-md border border-white/10 bg-white/[0.08] px-4 py-3">
                <p className="text-sm leading-6 text-white">{prompt}</p>
            </div>
        </div>
    );
}

function PixelAgentAvatar() {
    const cells = [
        0, 1, 2, 1, 0,
        1, 2, 3, 2, 1,
        2, 3, 1, 3, 2,
        1, 2, 3, 2, 1,
        0, 1, 2, 1, 0,
    ];
    const colors = ['bg-[#0B0C0D]', 'bg-[#20242A]', 'bg-[#3A424D]', 'bg-[#AEB7C2]'];

    return (
        <div
            className="mt-1 grid size-8 shrink-0 grid-cols-5 overflow-hidden rounded-lg border border-white/12 bg-black shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
            aria-hidden
        >
            {cells.map((cell, index) => (
                <span key={`${cell}:${index}`} className={colors[cell]} />
            ))}
        </div>
    );
}

function AgentTurnMessage({
    flow,
    model,
    activeStep,
}: {
    flow: AgentFlow;
    model: AgentTeslaDemoViewModel;
    activeStep: number;
}) {
    const visibleEntries = flow.entries.slice(0, Math.min(activeStep + 1, flow.entries.length));
    const decisionVisible = activeStep >= flow.entries.length;
    const activeEntryId = decisionVisible ? null : visibleEntries.at(-1)?.id;

    return (
        <div
            className="flex items-start gap-2"
            style={{
                animation: 'agent-chat-in 240ms cubic-bezier(0.23, 1, 0.32, 1) both',
            }}
        >
            <PixelAgentAvatar />
            <div className="min-w-0 flex-1">
                <div className="rounded-2xl rounded-tl-md border border-white/8 bg-black/24 px-3 py-3">
                    <div className="px-1">
                        <p className="text-sm leading-6 text-white/70">{flow.intro}</p>
                    </div>
                    {visibleEntries.length > 0 ? (
                        <WorkGroupPanel
                            label={flow.workLabel}
                            entries={visibleEntries}
                            activeEntryId={activeEntryId}
                            model={model}
                        />
                    ) : null}
                </div>
                {decisionVisible ? (
                    <AgentDecision
                        title={flow.decisionTitle}
                        body={flow.decisionBody}
                        tone={flow.decisionTone}
                        content={flow.decisionContent}
                        model={model}
                    />
                ) : null}
            </div>
        </div>
    );
}

function TextShimmer({
    children,
    className = '',
    duration = 1.1,
    spread = 2,
}: {
    children: string;
    className?: string;
    duration?: number;
    spread?: number;
}) {
    const dynamicSpread = useMemo(() => children.length * spread, [children, spread]);

    return (
        <motion.span
            className={`relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent [--base-color:rgba(255,255,255,0.34)] [--base-gradient-color:#ffffff] [background-repeat:no-repeat,padding-box] [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] ${className}`}
            initial={{ backgroundPosition: '100% center' }}
            animate={{ backgroundPosition: '0% center' }}
            transition={{ repeat: Infinity, duration, ease: 'linear' }}
            style={
                {
                    '--spread': `${dynamicSpread}px`,
                    backgroundImage: 'var(--bg), linear-gradient(var(--base-color), var(--base-color))',
                } as CSSProperties
            }
        >
            {children}
        </motion.span>
    );
}

function WorkGroupPanel({
    label,
    entries,
    activeEntryId,
    model,
}: {
    label: string;
    entries: AgentWorkEntry[];
    activeEntryId: string | null | undefined;
    model: AgentTeslaDemoViewModel;
}) {
    return (
        <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.035] px-2 py-2">
            <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
                <p className="font-berkeley-mono text-[10px] uppercase tracking-[0.16em] text-white/34">
                    {label} ({entries.length})
                </p>
            </div>
            <div className="space-y-0.5">
                {entries.map(entry => (
                    <WorkEntryRow key={entry.id} entry={entry} active={entry.id === activeEntryId} model={model} />
                ))}
            </div>
        </div>
    );
}

function WorkEntryRow({
    entry,
    active,
    model,
}: {
    entry: AgentWorkEntry;
    active: boolean;
    model: AgentTeslaDemoViewModel;
}) {
    const EntryIcon =
        entry.icon === 'brain'
            ? Brain
            : entry.icon === 'search'
              ? Search
              : entry.icon === 'dollar'
                ? DollarSign
                : entry.icon === 'check'
                  ? Check
                  : entry.icon === 'error' || entry.tone === 'danger'
                    ? XCircle
                    : entry.icon === 'tool' || entry.tone === 'success'
                      ? CheckCircle2
                      : Wrench;
    const toneClass =
        entry.icon === 'check'
            ? 'text-white/58'
            : entry.tone === 'success'
            ? 'text-[#00FFA3]/78'
            : entry.tone === 'danger'
              ? 'text-rose-200/78'
              : 'text-white/58';

    const rowText = (
        <>
            <span className={toneClass}>{entry.label}</span>
            {entry.detail ? <span className="text-white/38"> - {entry.detail}</span> : null}
        </>
    );

    return (
        <div
            className={`rounded-lg px-1 py-1 transition-[background-color,opacity,transform] duration-200 ${
                active ? 'bg-white/[0.045]' : ''
            }`}
            style={{ animation: 'agent-chat-in 180ms cubic-bezier(0.23, 1, 0.32, 1) both' }}
        >
            <div className="flex items-center gap-2">
                <span className={`flex size-5 shrink-0 items-center justify-center ${toneClass}`}>
                    <EntryIcon className="size-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] leading-5 text-white/66">
                        {active ? (
                            <TextShimmer className="max-w-full font-berkeley-mono text-[12px]">{`${entry.label}${entry.detail ? ` - ${entry.detail}` : ''}`}</TextShimmer>
                        ) : (
                            rowText
                        )}
                    </p>
                </div>
            </div>
            {entry.path ? <CompactToolPath path={entry.path} tone={entry.tone} /> : null}
            {entry.content ? <StepContent content={entry.content} model={model} /> : null}
        </div>
    );
}

function CompactToolPath({ path, tone }: { path: string; tone: ChatTone }) {
    return (
        <div className="mt-1.5 pl-7">
            <div
                className={`flex min-w-0 items-center gap-2 rounded-md border px-2 py-1.5 ${
                    tone === 'success'
                        ? 'border-[#00FFA3]/14 bg-[#00FFA3]/[0.045]'
                        : 'border-white/8 bg-black/18'
                }`}
            >
                <span
                    className={`shrink-0 rounded px-1.5 py-0.5 font-berkeley-mono text-[9px] font-medium ${
                        tone === 'success' ? 'bg-[#00FFA3]/10 text-[#00FFA3]' : 'bg-white/[0.06] text-white/45'
                    }`}
                >
                    GET
                </span>
                <code className="min-w-0 truncate font-berkeley-mono text-[11px] text-white/54">{path}</code>
            </div>
        </div>
    );
}

function StepContent({ content, model }: { content: NonNullable<AgentWorkEntry['content']>; model: AgentTeslaDemoViewModel }) {
    switch (content) {
        case 'unsafe-candidates':
            return <UnsafeCandidateList model={model} />;
        case 'guarded-candidates':
            return <GuardedCandidateList model={model} />;
        case 'unsafe-decision':
            return <UnsafeDecision model={model} />;
        case 'guarded-decision':
            return <GuardedDecision model={model} />;
        case 'review-decision':
            return <ReviewDecision />;
    }
}

function AgentDecision({
    title,
    body,
    tone,
    content,
    model,
}: {
    title: string;
    body: string;
    tone: ChatTone;
    content: AgentFlow['decisionContent'];
    model: AgentTeslaDemoViewModel;
}) {
    const Icon = tone === 'success' ? CheckCircle2 : XCircle;

    if (content === 'unsafe-decision') {
        return (
            <div
                className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-3 py-3 text-rose-50 shadow-[0_16px_48px_rgba(0,0,0,0.22)]"
                style={{ animation: 'agent-chat-in 220ms cubic-bezier(0.23, 1, 0.32, 1) both' }}
            >
                <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-5 shrink-0 text-rose-200" aria-hidden />
                    <p className="text-sm leading-6 text-rose-50/82">
                        <span className="font-medium text-white">{title}</span> {body}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`mt-3 overflow-hidden rounded-xl border ${
                tone === 'success'
                    ? 'border-[#00FFA3]/18 bg-[#00FFA3]/[0.055]'
                    : 'border-rose-300/18 bg-rose-300/[0.055]'
            }`}
            style={{ animation: 'agent-chat-in 220ms cubic-bezier(0.23, 1, 0.32, 1) both' }}
        >
            <div className="flex items-start gap-3 px-3 py-3">
                <Icon
                    className={`mt-0.5 size-5 shrink-0 ${tone === 'success' ? 'text-[#00FFA3]' : 'text-rose-200'}`}
                    aria-hidden
                />
                <p className="min-w-0 text-sm leading-6 text-white/66">
                    <span className="font-medium text-white">{title}</span> {body}
                </p>
            </div>
            <StepContent content={content} model={model} />
        </div>
    );
}

function UnsafeCandidateList({ model }: { model: AgentTeslaDemoViewModel }) {
    return (
        <details className="mt-1.5 pl-7">
            <summary className="cursor-pointer select-none rounded-md px-2 py-1.5 font-berkeley-mono text-[11px] text-white/42 transition-colors hover:bg-white/[0.04] hover:text-white/60">
                View returned mints
            </summary>
            <div className="mt-1 overflow-hidden rounded-lg border border-white/8 bg-black/18">
                {model.unsafe.candidates.map(candidate => (
                    <UnsafeCandidateRow
                        key={`${candidate.symbol}:${candidate.shortMint}`}
                        candidate={candidate}
                        selected={model.unsafe.selected?.symbol === candidate.symbol}
                    />
                ))}
            </div>
        </details>
    );
}

function UnsafeCandidateRow({ candidate, selected }: { candidate: UnsafeCandidate; selected: boolean }) {
    return (
        <div
            className={`grid gap-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
                selected ? 'bg-rose-300/[0.08] ring-1 ring-inset ring-rose-300/18' : ''
            }`}
        >
            <div className="min-w-0">
                <p className="truncate text-sm leading-5 text-white/70">
                    <span className="font-medium text-white">{candidate.displaySymbol}</span>
                    <span className="font-berkeley-mono text-xs text-white/40"> · {candidate.shortMint}</span>
                </p>
            </div>
            <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 font-berkeley-mono text-[10px] leading-4 text-white/42 sm:justify-end">
                <span>MC {candidate.marketCapLabel}</span>
                <span>VOL {candidate.volumeLabel}</span>
                <span>LIQ {candidate.liquidityLabel}</span>
                <span>ORG {candidate.organicScoreLabel}</span>
            </div>
        </div>
    );
}

function GuardedCandidateList({ model }: { model: AgentTeslaDemoViewModel }) {
    const candidates = model.guarded.candidates.slice(0, 2);

    return (
        <details className="mt-1.5 pl-7">
            <summary className="cursor-pointer select-none rounded-md px-2 py-1.5 font-berkeley-mono text-[11px] text-white/42 transition-colors hover:bg-white/[0.04] hover:text-white/60">
                View verified mints
            </summary>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
                {candidates.length > 0 ? (
                    candidates.map(candidate => <GuardedCandidateMiniCard key={candidate.mint} candidate={candidate} />)
                ) : (
                    <div className="rounded-lg border border-white/8 bg-black/18 px-3 py-2 text-xs text-white/44">
                        No verified tier1 Tesla mints returned.
                    </div>
                )}
            </div>
        </details>
    );
}

function GuardedCandidateMiniCard({ candidate }: { candidate: GuardedCandidate }) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.04] p-3">
            {candidate.logoUrl ? (
                <img
                    src={candidate.logoUrl}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute -left-5 -top-5 size-24 rounded-full object-cover opacity-10 blur-xl saturate-150"
                />
            ) : null}
            <div className="relative z-10 flex items-start gap-3">
                <VariantTokenLogo
                    src={candidate.logoUrl}
                    symbol={candidate.symbol}
                    name={candidate.name}
                    tier={candidate.liquidityTier}
                />
                <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-white">{candidate.symbol}</div>
                    <p className="mt-1 truncate font-berkeley-mono text-[11px] text-white/38">{candidate.shortMint}</p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-berkeley-mono text-[10px] text-white/40">
                        <span>LIQ {candidate.liquidityLabel}</span>
                        <span>VOL {candidate.volumeLabel}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UnsafeDecision({ model }: { model: AgentTeslaDemoViewModel }) {
    return (
        <div className="border-t border-white/8 px-3 py-3">
            <p className="text-sm leading-6 text-white/56">{model.unsafe.riskSummary}</p>
        </div>
    );
}

function GuardedDecision({ model }: { model: AgentTeslaDemoViewModel }) {
    const selected = model.guarded.selected;
    if (!selected) return <ReviewDecision />;

    return (
        <div className="border-t border-white/8 px-3 py-3">
            <GuardedSelectedCard candidate={selected} />
        </div>
    );
}

function ReviewDecision() {
    return (
        <div className="border-t border-white/8 px-3 py-3">
            <p className="text-sm leading-6 text-white/56">No verified tier1 Tesla variant returned.</p>
        </div>
    );
}

function GuardedSelectedCard({ candidate }: { candidate: GuardedCandidate }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <VariantTokenLogo src={candidate.logoUrl} symbol={candidate.symbol} name={candidate.name} tier={candidate.liquidityTier} />
            <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[15px] font-medium leading-6 text-white">{candidate.symbol}</span>
                </div>
                <div className="mt-0.5 truncate text-sm text-white/50">{candidate.name}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-berkeley-mono text-[11px] text-white/42">
                    <span>{candidate.shortMint}</span>
                    <span>LIQ {candidate.liquidityLabel}</span>
                    <span>VOL {candidate.volumeLabel}</span>
                </div>
            </div>
        </div>
    );
}

function ChatComposer({
    text,
    complete,
    guarded,
}: {
    text: string;
    complete: boolean;
    guarded: boolean;
}) {
    const prompt = text || 'Ask agent to buy token exposure...';

    return (
        <form
            className="shrink-0 px-3 pb-3 sm:px-5 sm:pb-5"
            onSubmit={event => {
                event.preventDefault();
            }}
        >
            <div
                className={`rounded-[22px] p-px transition-[background-color,border-color] duration-200 ${
                    guarded
                        ? 'bg-[linear-gradient(180deg,rgba(0,255,163,0.28),rgba(255,255,255,0.08))]'
                        : 'bg-[linear-gradient(180deg,rgba(251,113,133,0.24),rgba(255,255,255,0.08))]'
                }`}
            >
                <div className="rounded-[20px] border border-white/10 bg-[#18191A]/92 shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-200">
                    <div className="relative px-3 pb-2 pt-3.5 sm:px-4 sm:pt-4">
                        <div className="min-h-[58px] whitespace-pre-wrap text-sm leading-6 text-white/80">
                            <span className={text ? 'text-white/82' : 'text-white/34'}>{prompt}</span>
                            {!complete ? <TypingCursor /> : null}
                        </div>
                    </div>

                    <div
                        aria-hidden
                        className="pointer-events-none h-[2px] w-full shrink-0 border-t border-white/8 bg-white/[0.025]"
                    />

                    <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2 overflow-visible px-2.5 py-2.5 sm:px-3 sm:py-3">
                        <div className="-m-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <button
                                type="button"
                                aria-label="Add agent action"
                                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-white/48 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.07] hover:text-white/72 active:scale-[0.97]"
                            >
                                <Plus className="size-3.5" aria-hidden />
                            </button>
                            <ComposerContextBadge icon={<ArrowUpDown className="size-3.5" aria-hidden />}>
                                Swap
                            </ComposerContextBadge>
                            <ComposerContextBadge tone="mono" icon={<Wallet className="size-3.5" aria-hidden />}>
                                {DEMO_RECIPIENT_ADDRESS}
                            </ComposerContextBadge>
                        </div>

                        <button
                            type="submit"
                            aria-label="Submit demo instruction"
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] ${
                                guarded
                                    ? 'border-[#00FFA3]/24 bg-[#00FFA3] text-black'
                                    : 'border-rose-200/24 bg-rose-200 text-black'
                            }`}
                        >
                            <ArrowUp className="size-4" aria-hidden />
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}

function ComposerContextBadge({
    icon,
    tone = 'yellow',
    children,
}: {
    icon: ReactNode;
    tone?: 'mono' | 'yellow';
    children: ReactNode;
}) {
    const className =
        tone === 'mono'
            ? 'border-white/10 bg-white/[0.04] text-white/58'
            : 'border-amber-300/22 bg-amber-300/10 text-amber-100';
    const iconClassName = tone === 'mono' ? 'text-white/48' : 'text-amber-200/88';

    return (
        <span className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium ${className}`}>
            <span className={iconClassName}>{icon}</span>
            {children}
        </span>
    );
}

function TypingCursor() {
    return (
        <span
            aria-hidden
            className="ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-white/70"
            style={{ animation: 'agent-cursor 920ms steps(2, start) infinite' }}
        />
    );
}

function VariantTokenLogo({
    src,
    symbol,
    name,
    tier,
}: {
    src: string;
    symbol: string;
    name: string;
    tier: GuardedCandidate['liquidityTier'];
}) {
    const initials = (symbol || name || '??').slice(0, 2).toUpperCase();

    return (
        <div className="relative shrink-0">
            {src ? (
                <img
                    src={src}
                    alt={name}
                    className="size-10 rounded-full bg-gray-50 object-cover ring-2 ring-white"
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 ring-1 ring-white/30">
                    <span className="text-xs font-medium text-[#1C1C1D]">{initials}</span>
                </div>
            )}
            <div className="absolute bottom-0 right-0 translate-x-1.5 translate-y-1.5">
                <div className="flex size-5 items-center justify-center rounded-md border-2 border-white bg-[#D4AF37]" aria-hidden>
                    <span className="text-[8px] font-bold text-white">{tierLabel(tier)}</span>
                </div>
            </div>
        </div>
    );
}

function tierLabel(tier: GuardedCandidate['liquidityTier']): '1' | '2' | '3' {
    if (tier === 'tier2') return '2';
    if (tier === 'tier3') return '3';
    return '1';
}

function buildUnguardedAgentFlow(model: AgentTeslaDemoViewModel): AgentFlow {
    const pick = model.unsafe.selected?.displaySymbol ?? 'unknown token';

    return {
        intro: 'I need to buy $1,000 worth of Tesla exposure on Solana.',
        workLabel: 'Work log',
        entries: [
            {
                id: 'think',
                label: 'Thinking...',
                tone: 'neutral',
                icon: 'brain',
            },
            {
                id: 'search',
                label: 'Search for Tesla returned',
                detail: '5 possible matches',
                tone: 'neutral',
                icon: 'search',
                content: 'unsafe-candidates',
            },
            {
                id: 'route',
                label: `Buying ${model.task.notionalLabel} on Jupiter`,
                detail: `Route: USDC -> ${pick}`,
                tone: 'neutral',
                icon: 'dollar',
            },
            {
                id: 'complete',
                label: 'Buy completed',
                detail: `Sending tokens to ${DEMO_RECIPIENT_ADDRESS}`,
                tone: 'neutral',
                icon: 'check',
            },
        ],
        decisionTitle: 'Result:',
        decisionBody: 'The flow completed, but the agent hallucinated and bought the wrong token with real funds on the line.',
        decisionTone: 'danger',
        decisionContent: 'unsafe-decision',
    };
}

function buildGuardedAgentFlow(model: AgentTeslaDemoViewModel): AgentFlow {
    const selected = model.guarded.selected?.symbol ?? 'no tier1 variant';
    const selectedDetail = model.guarded.selected
        ? `${model.guarded.selected.symbol} from canonical Tesla tier1 variants`
        : 'no tier1 variant available';
    const verifiedMintCount = Math.min(model.guarded.candidates.length, 2);
    const buyEntries: AgentWorkEntry[] = model.guarded.selected
        ? [
              {
                  id: 'route',
                  label: `Buying ${model.task.notionalLabel} on Jupiter`,
                  detail: `Route: USDC -> ${model.guarded.selected.symbol}`,
                  tone: 'neutral',
                  icon: 'dollar',
              },
              {
                  id: 'complete',
                  label: 'Buy completed',
                  detail: `Sending tokens to ${DEMO_RECIPIENT_ADDRESS}`,
                  tone: 'neutral',
                  icon: 'check',
              },
          ]
        : [
              {
                  id: 'paused',
                  label: 'Buy paused',
                  detail: selectedDetail,
                  tone: 'neutral',
                  icon: 'check',
              },
          ];

    return {
        intro: 'I need to buy $1,000 worth of Tesla exposure on Solana.',
        workLabel: 'Work log',
        entries: [
            {
                id: 'think',
                label: 'Thinking...',
                tone: 'neutral',
                icon: 'brain',
            },
            {
                id: 'search',
                label: 'Search for Tesla returned',
                detail: `${verifiedMintCount} verified token mints`,
                tone: 'neutral',
                icon: 'search',
                content: 'guarded-candidates',
            },
            ...buyEntries,
        ],
        decisionTitle: model.guarded.selected ? 'Result:' : 'Human review required',
        decisionBody: model.guarded.selected
            ? `Agent successfully bought ${selected} using verified tokens returned by Assets API variants based on best liquidity available.`
            : model.guarded.decisionReason,
        decisionTone: model.guarded.selected ? 'success' : 'danger',
        decisionContent: model.guarded.selected ? 'guarded-decision' : 'review-decision',
    };
}
