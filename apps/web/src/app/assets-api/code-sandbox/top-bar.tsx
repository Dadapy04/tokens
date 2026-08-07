import { STATUS_ERR_DOT, STATUS_OK_DOT } from './constants';

export function TopBar({
    status,
    requestPath,
}: {
    status: number | null;
    requestPath: string;
}) {
    const isPending = status === null;
    const isOk = !isPending && status >= 200 && status < 300;
    return (
        <div className="flex items-center justify-between gap-4 border-b border-[#2c2c2d] px-6 py-[22px]">
            <div className="flex min-w-0 items-center gap-3 font-berkeley-mono text-[length:var(--text-body-md-size)] leading-[1.4]">
                <span className="shrink-0 text-[#00FFA3]">GET</span>
                <span className="min-w-0 truncate text-text-extra-high">
                    <span className="hidden md:inline">{`api.tokens.xyz${requestPath}`}</span>
                    <span className="md:hidden">{requestPath}</span>
                </span>
            </div>
            <div className="flex shrink-0 items-center gap-3 font-berkeley-mono text-[length:var(--text-body-md-size)] leading-[1.4]">
                <span
                    aria-hidden
                    className={`size-[6px] rounded-full ${isPending ? 'status-pulse' : ''}`}
                    style={{
                        background: isPending
                            ? 'rgba(255,255,255,0.32)'
                            : isOk
                              ? STATUS_OK_DOT
                              : STATUS_ERR_DOT,
                    }}
                />
                <span className="text-text-medium tabular-nums">
                    {isPending ? '···' : status}
                </span>
            </div>
        </div>
    );
}
