'use client';

import { useState, type ReactNode } from 'react';

interface JsonValueProps {
    value: unknown;
    depth: number;
    stream?: boolean;
    isMobile?: boolean;
}

const STREAM_STAGGER_MS = 28;

const THEME = {
    foreground: '#c0caf5',
    string: '#9ece6a',
    number: '#e8a06b',
    keyword: '#bb9af7',
    attribute: '#7dcfff',
    punctuation: '#4a5268',
    comment: '#565f89',
} as const;

const glow = (c: string) => `0 0 6px ${c}2E`;

export function JsonTree({
    value,
    stream = false,
    isMobile = false,
}: {
    value: unknown;
    stream?: boolean;
    isMobile?: boolean;
}) {
    return (
        <pre
            className="dark font-berkeley-mono text-[12.5px] leading-[1.7] tabular-nums whitespace-pre-wrap break-all"
            style={{
                color: THEME.foreground,
                fontFeatureSettings: "'tnum' 1",
            }}
        >
            <JsonValue
                value={value}
                depth={0}
                stream={stream}
                isMobile={isMobile}
            />
        </pre>
    );
}

function JsonValue({
    value,
    depth,
    stream,
    isMobile,
}: JsonValueProps): ReactNode {
    if (value === null)
        return (
            <span style={{ color: THEME.keyword, textShadow: glow(THEME.keyword) }}>
                null
            </span>
        );
    if (typeof value === 'string')
        return (
            <span style={{ color: THEME.string, textShadow: glow(THEME.string) }}>
                {JSON.stringify(value)}
            </span>
        );
    if (typeof value === 'number')
        return (
            <span style={{ color: THEME.number, textShadow: glow(THEME.number) }}>
                {Number.isFinite(value) ? String(value) : JSON.stringify(value)}
            </span>
        );
    if (typeof value === 'boolean')
        return (
            <span style={{ color: THEME.keyword, textShadow: glow(THEME.keyword) }}>
                {String(value)}
            </span>
        );
    if (Array.isArray(value))
        return (
            <JsonArray value={value} depth={depth} isMobile={isMobile} />
        );
    if (typeof value === 'object')
        return (
            <JsonObject
                value={value as Record<string, unknown>}
                depth={depth}
                stream={stream}
                isMobile={isMobile}
            />
        );
    return <span>{String(value)}</span>;
}

function JsonArray({
    value,
    depth,
    isMobile,
}: {
    value: unknown[];
    depth: number;
    isMobile?: boolean;
}) {
    const collapseThreshold = isMobile ? 2 : 3;
    const [collapsed, setCollapsed] = useState(
        () => depth >= collapseThreshold && value.length > 0,
    );
    if (value.length === 0) return <Punct>[]</Punct>;

    const indent = '  '.repeat(depth);
    const childIndent = '  '.repeat(depth + 1);

    if (collapsed) {
        return (
            <span>
                <Toggle collapsed onToggle={() => setCollapsed(false)} label="expand array" />
                <Punct>[</Punct>
                <Comment>
                    {' '}
                    {value.length} item{value.length === 1 ? '' : 's'}{' '}
                </Comment>
                <Punct>]</Punct>
            </span>
        );
    }

    return (
        <span>
            <Toggle
                collapsed={false}
                onToggle={() => setCollapsed(true)}
                label="collapse array"
            />
            <Punct>[</Punct>
            {value.map((v, i) => (
                <span key={i}>
                    {'\n'}
                    {childIndent}
                    <JsonValue
                        value={v}
                        depth={depth + 1}
                        stream={false}
                        isMobile={isMobile}
                    />
                    {i < value.length - 1 && <Punct>,</Punct>}
                </span>
            ))}
            {'\n'}
            {indent}
            <Punct>]</Punct>
        </span>
    );
}

function JsonObject({
    value,
    depth,
    stream,
    isMobile,
}: {
    value: Record<string, unknown>;
    depth: number;
    stream?: boolean;
    isMobile?: boolean;
}) {
    const keys = Object.keys(value);
    const collapseThreshold = isMobile ? 3 : 4;
    const [collapsed, setCollapsed] = useState(() => depth >= collapseThreshold);

    if (keys.length === 0) return <Punct>{'{}'}</Punct>;

    const indent = '  '.repeat(depth);
    const childIndent = '  '.repeat(depth + 1);

    if (collapsed) {
        return (
            <span>
                <Toggle collapsed onToggle={() => setCollapsed(false)} label="expand object" />
                <Punct>{'{'}</Punct>
                <Comment>
                    {' '}
                    {keys.length} key{keys.length === 1 ? '' : 's'}{' '}
                </Comment>
                <Punct>{'}'}</Punct>
            </span>
        );
    }

    const useStreamLines = stream === true && depth === 0;

    return (
        <span>
            <Toggle
                collapsed={false}
                onToggle={() => setCollapsed(true)}
                label="collapse object"
            />
            <Punct>{'{'}</Punct>
            {keys.map((k, i) => {
                const valueNode = (
                    <JsonValue
                        value={value[k]}
                        depth={depth + 1}
                        stream={false}
                        isMobile={isMobile}
                    />
                );
                return useStreamLines ? (
                    <span
                        key={k}
                        className="json-stream-line"
                        style={{
                            display: 'block',
                            animationDelay: `${i * STREAM_STAGGER_MS}ms`,
                        }}
                    >
                        {childIndent}
                        <span
                            style={{
                                color: THEME.attribute,
                                textShadow: glow(THEME.attribute),
                            }}
                        >{`"${k}"`}</span>
                        <Punct>: </Punct>
                        {valueNode}
                        {i < keys.length - 1 && <Punct>,</Punct>}
                    </span>
                ) : (
                    <span key={k}>
                        {'\n'}
                        {childIndent}
                        <span
                            style={{
                                color: THEME.attribute,
                                textShadow: glow(THEME.attribute),
                            }}
                        >{`"${k}"`}</span>
                        <Punct>: </Punct>
                        {valueNode}
                        {i < keys.length - 1 && <Punct>,</Punct>}
                    </span>
                );
            })}
            {!useStreamLines && '\n'}
            {!useStreamLines && indent}
            <Punct>{'}'}</Punct>
        </span>
    );
}

function Punct({ children }: { children: ReactNode }) {
    return <span style={{ color: THEME.punctuation }}>{children}</span>;
}

function Comment({ children }: { children: ReactNode }) {
    return <span style={{ color: THEME.comment }}>{children}</span>;
}

function Toggle({
    collapsed,
    onToggle,
    label,
}: {
    collapsed: boolean;
    onToggle: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={label}
            className="mr-1 inline-flex size-3.5 items-center justify-center rounded-sm text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70"
        >
            <span className="font-berkeley-mono text-[10px] leading-none">
                {collapsed ? '▸' : '▾'}
            </span>
        </button>
    );
}
