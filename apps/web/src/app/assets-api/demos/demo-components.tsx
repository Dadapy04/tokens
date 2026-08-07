export function DemoEmptyState({ title, message }: { title: string; message: string }) {
    return (
        <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden p-5">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                }}
            />
            <div className="relative max-w-[320px] rounded-[24px] border border-white/8 bg-white/[0.04] px-6 py-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur-xl">
                <div className="text-sm font-medium text-white">{title}</div>
                <p className="mt-2 text-sm leading-6 text-white/48">{message}</p>
            </div>
        </div>
    );
}

export function DemoGridBackground() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
            }}
        />
    );
}
