export function PriceChartSkeleton() {
    return (
        <div>
            <div className="bg-white border border-border-light rounded-[24px] overflow-hidden shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.04)]">
                <div className="p-6">
                    {/* Header skeleton */}
                    <div className="flex flex-col space-y-2 mb-4">
                        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                        <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                    </div>
                    {/* Chart skeleton */}
                    <div className="h-[400px] bg-gray-50 rounded-xl animate-pulse" />
                </div>
            </div>
            {/* Controls skeleton */}
            <div className="flex items-center gap-2 mt-4">
                <div className="h-9 w-40 bg-gray-50 border border-border-light rounded-xl animate-pulse" />
                <div className="h-9 w-32 bg-gray-50 border border-border-light rounded-xl animate-pulse" />
            </div>
        </div>
    );
}
