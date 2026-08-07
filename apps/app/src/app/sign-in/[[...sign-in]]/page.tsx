import { Logo } from '@/components/logo';
import Link from 'next/link';

import { hasUsableClerkPublishableKey } from '@/lib/clerk-config';
import { AuthCardDashes } from './components/auth-card-dashes';
import { SignInUi } from './sign-in-ui';

export const metadata = {
    title: 'Sign in | Tokens',
};

export default function Page() {
    const hasClerk = hasUsableClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

    return (
        <div className="group relative min-h-dvh overflow-hidden bg-background flex flex-col justify-center items-center">
            <AuthCardDashes />

            <main className="relative z-10 mx-auto flex w-full h-full flex-col justify-center items-center px-4 py-10">
                <div className="flex flex-col gap-6 items-center justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none"
                    >
                        <Logo width={36} height={36} className="opacity-60" />
                        <span className="sr-only">Tokens</span>
                    </Link>
                    <div className="w-full max-w-sm">
                        {hasClerk ? (
                            <SignInUi />
                        ) : (
                            <div className="rounded-xl border border-border-medium bg-card p-4 text-body-md">
                                <div className="font-inter-medium">Missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`</div>
                                <div className="text-muted-foreground">
                                    Set Clerk env vars for the dashboard app before using sign-in flows.
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="pt-1 text-xs text-muted-foreground text-berkeley-mono text-pretty">
                            By continuing, you agree to our{' '}
                            <a
                                href="https://tokens.xyz/terms-of-service"
                                target="_blank"
                                rel="noreferrer"
                                className="text-foreground underline underline-offset-4"
                            >
                                Terms
                            </a>{' '}
                            and{' '}
                            <a
                                href="https://tokens.xyz/privacy"
                                target="_blank"
                                rel="noreferrer"
                                className="text-foreground underline underline-offset-4"
                            >
                                Privacy Policy
                            </a>
                            .
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
