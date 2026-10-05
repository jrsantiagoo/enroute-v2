// Dashboard Skeleton Screen
export default function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            {/* Alert banner placeholder */}
            <div className="h-12 w-full animate-pulse rounded-lg bg-border/60" />

            {/* Header placeholder */}
            <div className="flex animate-pulse items-center justify-between">
                <div className="flex flex-col justify-center gap-2">
                    <div className="h-7 w-44 rounded-md bg-border" />
                    <div className="h-4 w-64 rounded-md bg-border" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-56 rounded-lg bg-border" />
                    <div className="h-10 w-32 rounded-lg bg-border" />
                </div>
            </div>

            {/* Stat cards placeholder */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-col gap-4 rounded-xl border border-card-border bg-card p-6 shadow-lg shadow-primary"
                    >
                        <div className="h-4 w-3/4 animate-pulse rounded-md bg-border" />
                        <div className="h-8 w-1/2 animate-pulse rounded-md bg-border" />
                    </div>
                ))}
            </div>

            {/* Charts placeholder */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-card-border bg-card p-6 shadow-lg shadow-primary"
                    >
                        <div className="h-4 w-1/3 animate-pulse rounded-md bg-border" />
                        <div className="mt-4 h-72 animate-pulse rounded-md bg-border/60" />
                    </div>
                ))}
            </div>

            {/* Orders table placeholder */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-lg shadow-primary">
                <div className="flex animate-pulse items-center justify-between">
                    <div className="h-4 w-16 rounded-md bg-border" />
                    <div className="h-9 w-64 rounded-lg bg-border" />
                </div>
                <div className="mt-6 space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-4 animate-pulse rounded-md bg-border ${
                                i % 2 === 0 ? "w-full" : "w-11/12"
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
