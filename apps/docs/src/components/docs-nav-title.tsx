import { Logo } from './logo';

export function DocsNavTitle() {
    return (
        <>
            <div className="flex items-center gap-1">
                <Logo width={20} height={20} />
                <span className="text-sand-1400 font-diatype-bold text-xl">Tokens</span>
                <span className="text-sand-1000/50 font-inter-medium text-lg">API</span>
            </div>
        </>
    );
}
