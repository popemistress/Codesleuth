export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="relative">
                    {/* Animated Logo */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mx-auto mb-6 animate-pulse" />
                    <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mx-auto blur-xl opacity-50 animate-pulse" />
                </div>
                <p className="text-foreground-muted animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
