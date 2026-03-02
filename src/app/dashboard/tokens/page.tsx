/**
 * Token Usage Dashboard Page
 * 
 * Real-time dashboard for monitoring token usage and budget status.
 */

"use client";

import { useState, useCallback } from "react";
import { useTokenUsage } from "@/hooks/useTokenUsage";
import { useTokenEvents } from "@/hooks/useTokenEvents";
import { useBudget } from "@/hooks/useBudget";
import { BudgetCard, UsageChart, TokenStats, ActivityFeed } from "@/components/tokens";

// Demo project ID - in real app, this would come from route params or context
const DEMO_PROJECT_ID = "demo-project";

export default function TokenDashboardPage() {
    const [selectedProjectId] = useState(DEMO_PROJECT_ID);
    const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");

    // Calculate date range
    const getDateRange = useCallback(() => {
        const endDate = new Date();
        const startDate = new Date();

        switch (timeRange) {
            case "24h":
                startDate.setHours(startDate.getHours() - 24);
                break;
            case "7d":
                startDate.setDate(startDate.getDate() - 7);
                break;
            case "30d":
                startDate.setDate(startDate.getDate() - 30);
                break;
        }

        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };
    }, [timeRange]);

    const { startDate, endDate } = getDateRange();

    // Fetch data
    const { data: usageData, isLoading: usageLoading, error: usageError } = useTokenUsage({
        projectId: selectedProjectId,
        startDate,
        endDate,
        groupBy: timeRange === "24h" ? "hour" : "day",
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const { budget, isLoading: budgetLoading } = useBudget({
        projectId: selectedProjectId,
        refetchInterval: 30000,
    });

    const { events, isConnected, error: sseError } = useTokenEvents({
        projectId: selectedProjectId,
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Token Usage Dashboard</h1>
                            <p className="text-sm text-gray-400 mt-1">Real-time monitoring and budget tracking</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Connection Status */}
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                                <span className="text-xs text-gray-400">{isConnected ? "Live" : "Disconnected"}</span>
                            </div>

                            {/* Time Range Selector */}
                            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                                {(["24h", "7d", "30d"] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === range
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-400 hover:text-white hover:bg-gray-700"
                                            }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error States */}
                {usageError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm">{usageError}</p>
                    </div>
                )}
                {sseError && (
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-yellow-400 text-sm">{sseError}</p>
                    </div>
                )}

                {/* Budget Card */}
                <div className="mb-8">
                    {budgetLoading ? (
                        <div className="h-48 bg-gray-800/30 rounded-xl animate-pulse" />
                    ) : budget ? (
                        <BudgetCard budget={budget} />
                    ) : (
                        <div className="h-48 bg-gray-800/30 rounded-xl flex items-center justify-center border border-dashed border-gray-700">
                            <div className="text-center">
                                <p className="text-gray-400 mb-2">No budget configured</p>
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                                    Set Budget
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="mb-8">
                    {usageLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-28 bg-gray-800/30 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : usageData ? (
                        <TokenStats
                            totalPromptTokens={usageData.totalPromptTokens}
                            totalCompletionTokens={usageData.totalCompletionTokens}
                            totalCredits={usageData.totalCredits}
                            callCount={usageData.breakdown.length}
                        />
                    ) : null}
                </div>

                {/* Charts & Activity Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Usage Chart */}
                    <div className="lg:col-span-2 bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Usage Over Time</h3>
                        {usageLoading ? (
                            <div className="h-64 bg-gray-700/30 rounded-lg animate-pulse" />
                        ) : usageData?.breakdown ? (
                            <UsageChart
                                data={usageData.breakdown}
                                type="bar"
                                height={256}
                            />
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-500">
                                No data available
                            </div>
                        )}
                    </div>

                    {/* Activity Feed */}
                    <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                            <span className="text-xs text-gray-500">{events.length} events</span>
                        </div>
                        <ActivityFeed events={events} maxItems={15} />
                    </div>
                </div>
            </main>
        </div>
    );
}
