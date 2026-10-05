interface ChartCardProps {
    title: string;
    children: React.ReactNode;
}

// Chart Card Component
export default function ChartCard({ title, children }: ChartCardProps) {
    return (
        <div className="rounded-xl bg-card p-6 shadow-lg shadow-primary border border-card-border">
            <h3 className="mb-4 text-base font-semibold text-foreground">
                {title}
            </h3>
            <div className="h-72">{children}</div>
        </div>
    );
}
