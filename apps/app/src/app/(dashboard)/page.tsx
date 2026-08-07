import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { DashboardUi } from './dashboard-ui';

export default async function Page() {
    const { isAuthenticated } = await auth();
    if (!isAuthenticated) redirect('/sign-in');

    const backendConfigured = Boolean(
        process.env.TOKENS_CLOUDRUN_USAGE_URL?.trim() && process.env.TOKENS_CLOUDRUN_AUTH_TOKEN?.trim(),
    );

    if (!backendConfigured) {
        return (
            <div className="rounded-md border border-border-medium bg-card p-4 text-body-md">
                <div className="font-inter-medium">Dashboard backend is not configured</div>
                <div className="text-muted-foreground">
                    Set `TOKENS_CLOUDRUN_USAGE_URL` + `TOKENS_CLOUDRUN_AUTH_TOKEN`.
                </div>
            </div>
        );
    }

    return <DashboardUi />;
}
