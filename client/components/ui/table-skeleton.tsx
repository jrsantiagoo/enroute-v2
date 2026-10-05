"use client";

import Skeleton from "@/components/ui/skeleton";

// A skeleton card for tables
export default function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div
            role="status"
            aria-label="Loading table"
            className="rounded-xl bg-card p-6 shadow-lg shadow-primary border border-card-border"
        >
            {/* view toggle & search placeholders */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-8 w-64" />
            </div>

            {/* header & row bars */}
            <div className="overflow-hidden rounded-lg flex flex-col gap-2 p-3">
                <Skeleton className="h-9 w-full" />
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        </div>
    );
}
