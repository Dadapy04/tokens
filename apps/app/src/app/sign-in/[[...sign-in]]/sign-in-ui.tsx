'use client';

import { useSearchParams } from 'next/navigation';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useEffect, useMemo, useState } from 'react';
import { IconGithubLogo } from 'symbols-react';

import { Button } from '@tokens/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tokens/ui/card';
import { cn } from '@tokens/ui/cn';

import { AuthCardDashes } from './components/auth-card-dashes';
import { SolanaWalletPickerDialog } from './components/solana-wallet-picker-dialog';
import { SolanaLogo } from './components/solana-logo';
import { isAccountAlreadyExistsMessage, isAccountNotFoundMessage, resolveClerkErrorMessage } from './lib/clerk-errors';
import { getRedirectUrlComplete } from './lib/redirect-url';
import { listSolanaWalletOptions } from './lib/solana-wallets';

type OAuthStrategy = 'oauth_github';
type AuthMethod = 'github' | 'solana';

const AUTH_LOAD_TIMEOUT_MS = 6000;

interface ProviderConfig {
    id: 'github';
    label: string;
    strategy: OAuthStrategy;
    icon: React.ReactNode;
}

export function SignInUi(): React.JSX.Element {
    const searchParams = useSearchParams();
    const signInState = useSignIn();
    const signUpState = useSignUp();

    const isSignInLoaded = signInState.isLoaded;
    const isSignUpLoaded = signUpState.isLoaded;
    const signIn = signInState.signIn;
    const signUp = signUpState.signUp;
    const setActive = signInState.setActive;

    const [activeMethod, setActiveMethod] = useState<AuthMethod | null>(null);
    const [isSolanaPickerOpen, setIsSolanaPickerOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [authLoadTimedOut, setAuthLoadTimedOut] = useState(false);

    const redirectUrlComplete = useMemo(() => {
        return getRedirectUrlComplete(searchParams);
    }, [searchParams]);

    const providers: ProviderConfig[] = useMemo(() => {
        return [
            {
                id: 'github',
                label: 'Continue with GitHub',
                strategy: 'oauth_github',
                icon: <IconGithubLogo className="!size-5.5 fill-white/50" />,
            },
        ];
    }, []);

    const solanaWalletOptions = listSolanaWalletOptions();
    const isAuthReady = isSignInLoaded && Boolean(signIn);

    useEffect(() => {
        if (isAuthReady) {
            setAuthLoadTimedOut(false);
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setAuthLoadTimedOut(true);
        }, AUTH_LOAD_TIMEOUT_MS);

        return () => window.clearTimeout(timeoutId);
    }, [isAuthReady]);

    function showAuthUnavailableMessage() {
        setError(
            authLoadTimedOut
                ? 'Authentication did not finish loading. Check the production Clerk publishable key and allowed domain configuration.'
                : 'Authentication is still loading. Try again in a moment.',
        );
    }

    async function startOAuth(strategy: OAuthStrategy) {
        if (activeMethod) return;
        if (!isAuthReady || !signIn) {
            showAuthUnavailableMessage();
            return;
        }

        setError(null);
        setActiveMethod('github');

        try {
            await signIn.authenticateWithRedirect({
                strategy,
                redirectUrl: '/sign-in/sso-callback',
                redirectUrlComplete,
            });
        } catch (caught) {
            setError(resolveClerkErrorMessage(caught));
            setActiveMethod(null);
        }
    }

    async function startSolana(walletName: string) {
        if (activeMethod) return;
        if (!isAuthReady || !setActive || !signIn) {
            showAuthUnavailableMessage();
            return;
        }

        setError(null);
        setActiveMethod('solana');

        try {
            const result = await signIn.authenticateWithSolana({ walletName });
            if (result.status === 'complete' && result.createdSessionId) {
                await setActive({
                    session: result.createdSessionId,
                    redirectUrl: redirectUrlComplete,
                });
                return;
            }

            setError(`Solana sign-in incomplete (status: ${result.status}). Try GitHub instead.`);
            setActiveMethod(null);
        } catch (caught) {
            const message = resolveClerkErrorMessage(caught);

            // Common case: user tries Solana on the sign-in screen, but the wallet isn't linked yet.
            // Fall back to a Solana sign-up flow to create the account.
            if (isAccountNotFoundMessage(message) && isSignUpLoaded && signUp) {
                try {
                    const result = await signUp.authenticateWithSolana({ walletName });
                    if (result.status !== 'complete' || !result.createdSessionId) {
                        setError(`Solana sign-up incomplete (status: ${result.status}). Try GitHub instead.`);
                        setActiveMethod(null);
                        return;
                    }

                    await setActive({
                        session: result.createdSessionId,
                        redirectUrl: redirectUrlComplete,
                    });
                    return;
                } catch (fallbackError) {
                    const fallbackMessage = resolveClerkErrorMessage(fallbackError);

                    // If the wallet is already linked, switch back to a Solana sign-in flow.
                    if (isAccountAlreadyExistsMessage(fallbackMessage)) {
                        try {
                            const result = await signIn.authenticateWithSolana({ walletName });
                            if (result.status !== 'complete' || !result.createdSessionId) {
                                setError(`Solana sign-in incomplete (status: ${result.status}). Try GitHub instead.`);
                                setActiveMethod(null);
                                return;
                            }

                            await setActive({
                                session: result.createdSessionId,
                                redirectUrl: redirectUrlComplete,
                            });
                            return;
                        } catch (signInFallbackError) {
                            setError(resolveClerkErrorMessage(signInFallbackError));
                            setActiveMethod(null);
                            return;
                        }
                    }

                    setError(fallbackMessage);
                    setActiveMethod(null);
                    return;
                }
            }

            setError(message);
            setActiveMethod(null);
        }
    }

    const isBusy = activeMethod !== null;
    const authLoadError =
        authLoadTimedOut && !isAuthReady
            ? 'Authentication did not finish loading. Check the production Clerk publishable key and allowed domain configuration.'
            : null;
    const displayedError = error ?? authLoadError;

    return (
        <div className="group relative rounded-xl p-4">
            <AuthCardDashes />

            <Card
                className="relative rounded-[20px] bg-white overflow-hidden 
                            shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),inset_0_-4px_30px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.05)]
                            dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-4px_30px_rgba(47,44,48,0.9),0_4px_16px_rgba(0,0,0,0.6)]"
            >
                <CardHeader className="space-y-2">
                    <CardTitle className="text-title-sm">Login to Tokens</CardTitle>
                    <CardDescription className="text-body-md text-pretty">
                        Authenticate with your preferred provider to use Tokens API.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                    {providers.map(provider => (
                        <Button
                            key={provider.id}
                            type="button"
                            variant="default"
                            className={cn('w-full', isBusy && activeMethod !== 'github' && 'opacity-60')}
                            onClick={() => startOAuth(provider.strategy)}
                            disabled={isBusy}
                        >
                            {provider.icon}
                            <span className="flex-1 mr-6">{provider.label}</span>
                        </Button>
                    ))}

                    <Button
                        type="button"
                        variant="default"
                        className={cn('w-full', isBusy && activeMethod !== 'solana' && 'opacity-60')}
                        onClick={() => {
                            if (!isAuthReady || !setActive || !signIn) {
                                showAuthUnavailableMessage();
                                return;
                            }
                            setIsSolanaPickerOpen(true);
                        }}
                        disabled={isBusy}
                    >
                        <SolanaLogo width={16} height={16} className="opacity-50" />
                        <span className="flex-1 mr-6">Continue with Solana</span>
                    </Button>

                    <SolanaWalletPickerDialog
                        open={isSolanaPickerOpen}
                        onOpenChange={setIsSolanaPickerOpen}
                        walletOptions={solanaWalletOptions}
                        isBusy={isBusy}
                        onPickWallet={walletName => void startSolana(walletName)}
                    />

                    <div id="clerk-captcha" data-cl-theme="auto" data-cl-size="flexible" />

                    {displayedError && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                            {displayedError}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
