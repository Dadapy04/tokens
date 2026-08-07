import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';

import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Tokens | Docs',
    description: 'Tokens documentation.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className="light">
            <body className={`${inter.variable} font-sans min-h-dvh bg-bg1 antialiased`}>
                <RootProvider
                    theme={{
                        forcedTheme: 'light',
                        enableSystem: false,
                        defaultTheme: 'light',
                    }}
                >
                    {children}
                </RootProvider>
            </body>
        </html>
    );
}
