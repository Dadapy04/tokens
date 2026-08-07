import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@/components/google-analytics';

import { hasUsableClerkPublishableKey } from '@/lib/clerk-config';
import './globals.css';

// Keep internal traffic out of the public GA property until a dedicated app stream exists.
const GA_MEASUREMENT_ID: string | undefined = undefined;

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Tokens | App',
    description: 'Authenticated dashboard for Tokens projects, API keys, and usage.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
    const hasClerk = hasUsableClerkPublishableKey(clerkPublishableKey);

    const body = (
        <body className={`${inter.variable} font-sans min-h-dvh bg-background antialiased`}>
            {GA_MEASUREMENT_ID ? <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} /> : null}
            {children}
        </body>
    );

    if (!hasClerk) {
        return <html lang="en">{body}</html>;
    }

    return (
        <ClerkProvider publishableKey={clerkPublishableKey}>
            <html lang="en">{body}</html>
        </ClerkProvider>
    );
}
