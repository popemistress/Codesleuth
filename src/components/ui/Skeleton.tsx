export function CardSkeleton() {
    return (
        <div className="card animate-pulse">
            <div className="h-4 bg-surface-elevated rounded w-3/4 mb-4" />
            <div className="h-3 bg-surface-elevated rounded w-full mb-2" />
            <div className="h-3 bg-surface-elevated rounded w-5/6" />
        </div>
    );
}

export function BlogCardSkeleton() {
    return (
        <div className="card animate-pulse">
            <div className="h-48 bg-surface-elevated rounded-lg mb-4" />
            <div className="h-4 bg-surface-elevated rounded w-1/4 mb-3" />
            <div className="h-6 bg-surface-elevated rounded w-3/4 mb-3" />
            <div className="h-3 bg-surface-elevated rounded w-full mb-2" />
            <div className="h-3 bg-surface-elevated rounded w-5/6 mb-4" />
            <div className="flex gap-2">
                <div className="h-6 bg-surface-elevated rounded-full w-16" />
                <div className="h-6 bg-surface-elevated rounded-full w-20" />
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="card p-0 animate-pulse">
            <div className="p-4 border-b border-border">
                <div className="grid grid-cols-4 gap-4">
                    <div className="h-4 bg-surface-elevated rounded" />
                    <div className="h-4 bg-surface-elevated rounded" />
                    <div className="h-4 bg-surface-elevated rounded" />
                    <div className="h-4 bg-surface-elevated rounded" />
                </div>
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="p-4 border-b border-border last:border-b-0">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="h-4 bg-surface-elevated rounded w-3/4" />
                        <div className="h-4 bg-surface-elevated rounded w-1/2" />
                        <div className="h-4 bg-surface-elevated rounded w-2/3" />
                        <div className="h-4 bg-surface-elevated rounded w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function StatsSkeleton() {
    return (
        <div className="grid md:grid-cols-4 gap-6 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card">
                    <div className="h-3 bg-surface-elevated rounded w-1/2 mb-3" />
                    <div className="h-8 bg-surface-elevated rounded w-1/3" />
                </div>
            ))}
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-surface-elevated" />
                <div>
                    <div className="h-6 bg-surface-elevated rounded w-32 mb-2" />
                    <div className="h-4 bg-surface-elevated rounded w-48 mb-2" />
                    <div className="h-6 bg-surface-elevated rounded-full w-16" />
                </div>
            </div>
            <div className="space-y-6">
                <div>
                    <div className="h-4 bg-surface-elevated rounded w-24 mb-2" />
                    <div className="h-12 bg-surface-elevated rounded" />
                </div>
                <div>
                    <div className="h-4 bg-surface-elevated rounded w-32 mb-2" />
                    <div className="h-12 bg-surface-elevated rounded" />
                </div>
            </div>
        </div>
    );
}

export function AgentCardSkeleton() {
    return (
        <div className="card animate-pulse">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-elevated" />
                <div>
                    <div className="h-5 bg-surface-elevated rounded w-32 mb-2" />
                    <div className="h-3 bg-surface-elevated rounded w-24" />
                </div>
            </div>
            <div className="h-3 bg-surface-elevated rounded w-full mb-2" />
            <div className="h-3 bg-surface-elevated rounded w-5/6 mb-4" />
            <div className="flex gap-2">
                <div className="h-6 bg-surface-elevated rounded-full w-16" />
                <div className="h-6 bg-surface-elevated rounded-full w-20" />
                <div className="h-6 bg-surface-elevated rounded-full w-14" />
            </div>
        </div>
    );
}

export function PageSkeleton() {
    return (
        <div className="min-h-screen animate-pulse">
            {/* Header skeleton */}
            <div className="h-16 bg-surface border-b border-border" />

            {/* Hero skeleton */}
            <div className="py-24">
                <div className="container max-w-4xl mx-auto text-center">
                    <div className="h-6 bg-surface-elevated rounded-full w-24 mx-auto mb-6" />
                    <div className="h-12 bg-surface-elevated rounded w-3/4 mx-auto mb-4" />
                    <div className="h-6 bg-surface-elevated rounded w-1/2 mx-auto mb-8" />
                    <div className="flex gap-4 justify-center">
                        <div className="h-12 bg-surface-elevated rounded-lg w-36" />
                        <div className="h-12 bg-surface-elevated rounded-lg w-36" />
                    </div>
                </div>
            </div>

            {/* Content skeleton */}
            <div className="py-16">
                <div className="container">
                    <div className="grid md:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <CardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
