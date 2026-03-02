/**
 * useTokenUsage Hook
 * 
 * Fetches token usage data from the API with caching and refetching.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { UsageResponse, UsageBucket } from "@/types/tokens";

interface UseTokenUsageOptions {
    projectId: string;
    startDate?: string;
    endDate?: string;
    groupBy?: "hour" | "day" | "agent" | "phase";
    enabled?: boolean;
    refetchInterval?: number;
}

interface UseTokenUsageResult {
    data: {
        totalPromptTokens: number;
        totalCompletionTokens: number;
        totalCredits: number;
        breakdown: UsageBucket[];
    } | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useTokenUsage(options: UseTokenUsageOptions): UseTokenUsageResult {
    const { projectId, startDate, endDate, groupBy, enabled = true, refetchInterval } = options;

    const [data, setData] = useState<UseTokenUsageResult["data"]>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsage = useCallback(async () => {
        if (!projectId || !enabled) return;

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ projectId });
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);
            if (groupBy) params.set("groupBy", groupBy);

            const response = await fetch(`/api/v1/tokens/usage?${params.toString()}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Failed to fetch usage data");
            }

            const result: UsageResponse = await response.json();
            setData(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    }, [projectId, startDate, endDate, groupBy, enabled]);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    useEffect(() => {
        if (refetchInterval && enabled) {
            const interval = setInterval(fetchUsage, refetchInterval);
            return () => clearInterval(interval);
        }
    }, [refetchInterval, enabled, fetchUsage]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchUsage,
    };
}
