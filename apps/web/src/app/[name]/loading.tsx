import { Skeleton } from '@tokens/ui/skeleton';

export default function AssetLoading() {
    return (
        <main className="min-h-dvh bg-gradient-to-b from-white via-white to-white relative overflow-x-hidden">
            <div className="mx-auto max-w-7xl px-6 pt-0 pb-12 relative z-10">
                {/* Header */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-0 sm:gap-5 mb-8">
                    <div className="flex cols-span-1 items-start flex-col sm:flex-row sm:col-span-8 gap-2 sm:items-end">
                        <Skeleton className="size-[60px] rounded-full bg-gray-100" />
                        <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-8 w-48 bg-gray-100" />
                                <Skeleton className="h-6 w-16 rounded-md bg-gray-100" />
                            </div>
                            <Skeleton className="h-4 w-full max-w-md bg-gray-100" />
                        </div>
                    </div>
                    <div className="hidden sm:flex sm:col-span-4 items-end justify-end gap-2">
                        <Skeleton className="size-8 rounded-full bg-gray-100" />
                        <Skeleton className="size-8 rounded-full bg-gray-100" />
                        <Skeleton className="size-8 rounded-full bg-gray-100" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 lg:items-start">
                    <div className="lg:col-span-8 space-y-16">
                        {/* Chart */}
                        <div className="bg-white rounded-[32px] border border-border-light shadow-[0_8px_40px_rgba(0,0,0,0.03)] p-6">
                            <Skeleton className="h-5 w-24 bg-gray-100" />
                            <Skeleton className="h-10 w-40 bg-gray-100 mt-4" />
                            <Skeleton className="h-64 w-full bg-gray-100 mt-6" />
                        </div>

                        {/* Stats */}
                        <div>
                            <Skeleton className="h-6 w-20 bg-gray-100 mb-6 mt-12" />
                            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border-light overflow-hidden mb-px [&>*:first-child]:pl-0">
                                {Array.from({ length: 4 }, (_, index) => (
                                    <div key={index} className="px-6 py-5">
                                        <Skeleton className="h-4 w-20 bg-gray-100 mb-3" />
                                        <Skeleton className="h-6 w-24 bg-gray-100" />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border-light border-t border-border-light overflow-hidden [&>*:first-child]:pl-0">
                                {Array.from({ length: 4 }, (_, index) => (
                                    <div key={index} className="px-6 py-5">
                                        <Skeleton className="h-4 w-20 bg-gray-100 mb-3" />
                                        <Skeleton className="h-6 w-24 bg-gray-100" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Markets */}
                        <div>
                            <Skeleton className="h-6 w-24 bg-gray-100 mb-6 mt-12" />
                            <div className="bg-white rounded-[32px] border border-border-medium shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden">
                                <div className="p-8 space-y-4">
                                    {Array.from({ length: 6 }, (_, index) => (
                                        <Skeleton key={index} className="h-8 w-full bg-gray-100" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Variants */}
                        <section className="mt-10">
                            <Skeleton className="h-6 w-28 bg-gray-100" />
                            <Skeleton className="h-4 w-80 bg-gray-100 mt-4" />
                            <div className="mt-6 bg-white rounded-[32px] border border-border-light shadow-[0_8px_40px_rgba(0,0,0,0.03)] p-8 space-y-4">
                                {Array.from({ length: 5 }, (_, index) => (
                                    <Skeleton key={index} className="h-10 w-full bg-gray-100" />
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="lg:sticky lg:top-24 space-y-8">
                            <div className="hidden lg:block">
                                <Skeleton className="h-10 w-full bg-gray-100 rounded-xl" />
                            </div>

                            <section>
                                <Skeleton className="h-5 w-40 bg-gray-100 mb-4" />
                                <Skeleton className="h-4 w-full bg-gray-100" />
                                <Skeleton className="h-4 w-4/5 bg-gray-100 mt-2" />
                                <Skeleton className="h-4 w-3/5 bg-gray-100 mt-2" />
                            </section>

                            <section>
                                <Skeleton className="h-5 w-24 bg-gray-100 mb-4" />
                                <Skeleton className="h-4 w-full bg-gray-100" />
                                <Skeleton className="h-4 w-11/12 bg-gray-100 mt-2" />
                                <Skeleton className="h-4 w-3/4 bg-gray-100 mt-2" />
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
