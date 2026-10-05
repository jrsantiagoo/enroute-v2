interface StatCardProps {
    title: string;
    value: string;
    unit?: string;
    subtitle?: React.ReactNode;
}

// StatCard Component
export default function StatCard({
    title,
    value,
    unit,
    subtitle,
}: StatCardProps) {
    return (
        <div className="rounded-xl bg-card p-6 shadow-lg shadow-primary border border-card-border">
            <p className="text-[17px] font-semibold text-muted-foreground">
                {title}
            </p>
            <div className="flex gap-4">
                <p className="mt-2 text-3xl font-bold text-foreground">
                    {value}
                    {unit && (
                        <span className="ml-1 text-lg font-normal text-muted-foreground">
                            {unit}
                        </span>
                    )}
                </p>
                {subtitle && (
                    <p className="mt-1.5 text-[15px] text-muted-foreground flex items-end gap-1 ml-auto">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
