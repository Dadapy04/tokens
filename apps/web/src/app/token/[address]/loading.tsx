import { Skeleton } from '@tokens/ui/skeleton';

export default function TokenLoading() {
    return (
        <main className="min-h-dvh bg-background">
            {/* Header */}
            <div className="border-b border-border-light">
                <div className="mx-auto max-w-7xl px-6 py-4">
                    <Skeleton className="h-5 w-16 bg-gray-100" />
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 pb-8 md:pb-12 pt-0">
                {/* Token Header */}
                <div className="flex items-start gap-5 mb-8">
                    <Skeleton className="h-[72px] w-[72px] rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-48 bg-gray-100" />
                            <Skeleton className="h-6 w-16 rounded-md bg-gray-100" />
                        </div>
                        <Skeleton className="h-4 w-full max-w-md bg-gray-100" />
                    </div>
                </div>

                {/* Price Section */}
                <div className="bg-white rounded-xl border border-border-light p-6 mb-6">
                    <Skeleton className="h-4 w-24 mb-2 bg-gray-100" />
                    <div className="flex items-baseline gap-4">
                        <Skeleton className="h-10 w-40 bg-gray-100" />
                        <Skeleton className="h-6 w-20 rounded-md bg-gray-100" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-border-light p-4">
                            <Skeleton className="h-4 w-20 mb-2 bg-gray-100" />
                            <Skeleton className="h-6 w-24 bg-gray-100" />
                        </div>
                    ))}
                </div>

                {/* Supply Info */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-border-light p-4">
                            <Skeleton className="h-4 w-20 mb-2 bg-gray-100" />
                            <Skeleton className="h-6 w-16 bg-gray-100" />
                        </div>
                    ))}
                </div>

                {/* Description */}
                <div className="bg-white rounded-xl border border-border-light p-6 mb-6">
                    <Skeleton className="h-5 w-16 mb-3 bg-gray-100" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full bg-gray-100" />
                        <Skeleton className="h-4 w-3/4 bg-gray-100" />
                    </div>
                </div>

                {/* Links */}
                <div className="bg-white rounded-xl border border-border-light p-6">
                    <Skeleton className="h-5 w-12 mb-4 bg-gray-100" />
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-28 rounded-lg bg-gray-100" />
                        <Skeleton className="h-10 w-24 rounded-lg bg-gray-100" />
                    </div>
                </div>
            </div>
        </main>
    );
}
