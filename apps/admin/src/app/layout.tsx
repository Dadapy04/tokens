import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';

import { Providers } from './providers';
import './globals.css';
import { hasUsableClerkPublishableKey } from '@/lib/clerk-config';
import { AdminTopNav } from '@/components/admin-top-nav';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Tokens | Admin',
    description: 'Authenticated operational tooling for Tokens maintainers',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
    const adminApiUrl = process.env.TOKENS_CLOUDRUN_ADMIN_URL?.trim();
    const hasAuthProvider = hasUsableClerkPublishableKey(clerkPublishableKey) && Boolean(adminApiUrl);

    if (!hasUsableClerkPublishableKey(clerkPublishableKey)) {
        return (
            <html lang="en">
                <body className={`${inter.variable} font-sans min-h-dvh bg-background antialiased`}>
                    <Providers>
                        <main className="mx-auto w-full">{children}</main>
                    </Providers>
                </body>
            </html>
        );
    }

    return (
        <ClerkProvider publishableKey={clerkPublishableKey}>
            <html lang="en">
                <body className={`${inter.variable} font-sans min-h-dvh bg-background antialiased`}>
                    <Providers>
                        {hasAuthProvider ? <AdminTopNav /> : null}
                        <main className="mx-auto w-full">{children}</main>
                    </Providers>
                </body>
            </html>
        </ClerkProvider>
    );
}
