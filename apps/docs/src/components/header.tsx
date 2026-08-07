import Link from 'next/link';

import { Logo } from './logo';

export function Header() {
    return (
        <header className="z-40 border-b border-sand-300 bg-sand-100/5 backdrop-blur-sm">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
                <Link href="/" className="flex items-center justify-center group gap-2">
                    <Logo width={24} height={24} />
                    <div className="flex justify-end items-end">
                        <span className="text-sand-1400 font-diatype-bold text-2xl">Tokens</span>
                        <span className="text-sand-1000 font-inter-medium text-2xl">API</span>
                    </div>
                </Link>
                <div />
            </div>
        </header>
    );
}
