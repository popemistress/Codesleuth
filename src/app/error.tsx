"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-error" />
                </div>
                <h1 className="text-2xl font-bold mb-4">Something went wrong!</h1>
                <p className="text-foreground-muted mb-8">
                    We apologize for the inconvenience. Our team has been notified and is
                    working to fix the issue.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={reset} className="btn btn-primary">
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <Link href="/" className="btn btn-secondary">
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>
                </div>
                {error.digest && (
                    <p className="mt-8 text-xs text-foreground-subtle">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
