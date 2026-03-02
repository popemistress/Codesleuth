/**
 * BudgetCard Component
 * 
 * Card displaying budget status with meter and details.
 */

"use client";

import { BudgetMeter } from "./BudgetMeter";
import { formatCreditsAsUSD } from "@/lib/tokens/cost-normalizer";
import type { BudgetResponse } from "@/types/tokens";

interface BudgetCardProps {
    budget: BudgetResponse;
    className?: string;
}

export function BudgetCard({ budget, className = "" }: BudgetCardProps) {
    const remainingCredits = budget.totalCredits - budget.usedCredits;

    return (
        <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Budget Overview</h3>
                <StatusBadge status={budget.status} />
            </div>

            {/* Budget Meter */}
            <BudgetMeter
                usedPercent={budget.usedPercent}
                softLimit={budget.softLimit}
                hardLimit={budget.hardLimit}
                criticalLimit={budget.criticalLimit}
                status={budget.status}
                size="lg"
                className="mb-6"
            />

            {/* Credit Details */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                        {formatCreditsAsUSD(budget.usedCredits)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Used</p>
                </div>
                <div className="text-center border-x border-gray-700">
                    <p className="text-2xl font-bold text-white">
                        {formatCreditsAsUSD(budget.totalCredits)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Total Budget</p>
                </div>
                <div className="text-center">
                    <p className={`text-2xl font-bold ${remainingCredits > 0 ? "text-green-400" : "text-red-400"}`}>
                        {formatCreditsAsUSD(remainingCredits)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Remaining</p>
                </div>
            </div>

            {/* Threshold Info */}
            <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Soft Limit: {budget.softLimit}%</span>
                    <span>Hard Limit: {budget.hardLimit}%</span>
                    <span>Critical: {budget.criticalLimit}%</span>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors = {
        healthy: "bg-green-500/20 text-green-400 border-green-500/30",
        warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        exceeded: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        critical: "bg-red-500/20 text-red-400 border-red-500/30",
    };

    const colorClass = colors[status as keyof typeof colors] || "bg-gray-500/20 text-gray-400 border-gray-500/30";

    return (
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${colorClass} capitalize`}>
            {status}
        </span>
    );
}
