import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { hasUsableClerkPublishableKey } from '@/lib/clerk-config';

export const metadata = {
    title: 'Signing in… | Tokens',
};

export default function Page() {
    if (!hasUsableClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)) {
        return <div id="clerk-captcha" />;
    }

    return (
        <>
            <AuthenticateWithRedirectCallback />
            <div id="clerk-captcha" />
        </>
    );
}
