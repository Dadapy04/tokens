import { CurationUi } from './curation-ui';
import { hasUsableClerkPublishableKey } from '@/lib/clerk-config';

export default async function Page() {
    const adminApiUrl = process.env.TOKENS_CLOUDRUN_ADMIN_URL?.trim();
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
    if (!adminApiUrl) {
        return (
            <div className="mx-auto max-w-2xl p-6">
                <div className="rounded-md border border-border-medium bg-card p-4 text-body-md">
                    <div className="font-inter-medium">Missing `TOKENS_CLOUDRUN_ADMIN_URL`</div>
                    <div className="text-muted-foreground">
                        Set it for the admin app so it can talk to the admin Cloud Run service.
                    </div>
                </div>
            </div>
        );
    }

    if (!hasUsableClerkPublishableKey(clerkPublishableKey)) {
        return (
            <div className="mx-auto max-w-2xl p-6">
                <div className="rounded-md border border-border-medium bg-card p-4 text-body-md">
                    <div className="font-inter-medium">Missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`</div>
                    <div className="text-muted-foreground">
                        Set Clerk env vars for the admin app before using curation tools.
                    </div>
                </div>
            </div>
        );
    }

    return <CurationUi />;
}
