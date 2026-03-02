/**
 * useBudget Hook
 * 
 * Fetches and manages budget data for a project.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { BudgetResponse, BudgetStatus } from "@/types/tokens";

interface UseBudgetOptions {
    projectId: string;
    enabled?: boolean;
    refetchInterval?: number;
}

interface UseBudgetResult {
    budget: BudgetResponse | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    updateBudget: (data: { totalCredits?: number; softLimitPercent?: number; hardLimitPercent?: number }) => Promise<void>;
}

export function useBudget(options: UseBudgetOptions): UseBudgetResult {
    const { projectId, enabled = true, refetchInterval } = options;

    const [budget, setBudget] = useState<BudgetResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBudget = useCallback(async () => {
        if (!projectId || !enabled) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/v1/budgets?projectId=${encodeURIComponent(projectId)}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setBudget(null);
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Failed to fetch budget");
            }

            const result = await response.json();
            setBudget(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    }, [projectId, enabled]);

    const updateBudget = useCallback(async (data: { totalCredits?: number; softLimitPercent?: number; hardLimitPercent?: number }) => {
        if (!projectId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/v1/budgets?projectId=${encodeURIComponent(projectId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Failed to update budget");
            }

            // Refetch to get updated state
            await fetchBudget();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [projectId, fetchBudget]);

    useEffect(() => {
        fetchBudget();
    }, [fetchBudget]);

    useEffect(() => {
        if (refetchInterval && enabled) {
            const interval = setInterval(fetchBudget, refetchInterval);
            return () => clearInterval(interval);
        }
    }, [refetchInterval, enabled, fetchBudget]);

    return {
        budget,
        isLoading,
        error,
        refetch: fetchBudget,
        updateBudget,
    };
}

/**
 * Get status color for budget status
 */
export function getBudgetStatusColor(status: BudgetStatus): string {
    switch (status) {
        case "healthy":
            return "text-green-500";
        case "warning":
            return "text-yellow-500";
        case "exceeded":
            return "text-orange-500";
        case "critical":
            return "text-red-500";
        default:
            return "text-gray-500";
    }
}

/**
 * Get background color for budget status
 */
export function getBudgetStatusBgColor(status: BudgetStatus): string {
    switch (status) {
        case "healthy":
            return "bg-green-500";
        case "warning":
            return "bg-yellow-500";
        case "exceeded":
            return "bg-orange-500";
        case "critical":
            return "bg-red-500";
        default:
            return "bg-gray-500";
    }
}
