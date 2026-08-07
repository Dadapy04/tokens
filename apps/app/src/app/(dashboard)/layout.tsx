import { hasUsableClerkPublishableKey } from '@/lib/clerk-config';
import { TopNav } from '@/components/global/top-nav';
import { Providers } from './providers';

/**
 * Dashboard route group: the heavy client providers (Convex websocket,
 * motion, sonner, nuqs, tooltips) and TopNav live here so auth routes
 * (/sign-in, /sign-up) don't load any of it.
 */
export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const hasClerk = hasUsableClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());

    if (!hasClerk) {
        return <main className="mx-auto w-full">{children}</main>;
    }

    return (
        <Providers>
            <TopNav />
            <main className="mx-auto w-full">{children}</main>
        </Providers>
    );
}
