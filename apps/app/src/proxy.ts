import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

function parseAuthorizedParties(): string[] | undefined {
    const raw = process.env.CLERK_AUTHORIZED_PARTIES?.trim();
    if (!raw) return undefined;

    const parties = raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    return parties.length > 0 ? parties : undefined;
}

const authorizedParties = parseAuthorizedParties();

export default clerkMiddleware(
    async (auth, req) => {
        // `auth.protect()` can rewrite to `/404` in some dev-instance + deployed-domain
        // configurations (e.g. missing dev browser). Prefer an explicit redirect so the
        // user can always reach `/sign-in`.
        const { isAuthenticated, redirectToSignIn } = await auth();

        if (isPublicRoute(req)) {
            if (isAuthenticated) return NextResponse.redirect(new URL('/', req.url));
            return NextResponse.next();
        }

        if (!isAuthenticated) return redirectToSignIn({ returnBackUrl: req.url });
    },
    authorizedParties ? { authorizedParties } : undefined,
);

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
