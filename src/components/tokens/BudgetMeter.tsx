/**
 * BudgetMeter Component
 * 
 * Visual meter showing current budget usage with thresholds.
 */

"use client";

import { useMemo } from "react";
import type { BudgetStatus } from "@/types/tokens";

interface BudgetMeterProps {
    usedPercent: number;
    softLimit: number;
    hardLimit: number;
    criticalLimit?: number;
    status: BudgetStatus;
    showLabels?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function BudgetMeter({
    usedPercent,
    softLimit,
    hardLimit,
    criticalLimit = 150,
    status,
    showLabels = true,
    size = "md",
    className = "",
}: BudgetMeterProps) {
    const heights = {
        sm: "h-2",
        md: "h-3",
        lg: "h-4",
    };

    const fillColor = useMemo(() => {
        switch (status) {
            case "healthy":
                return "bg-gradient-to-r from-green-400 to-green-500";
            case "warning":
                return "bg-gradient-to-r from-yellow-400 to-yellow-500";
            case "exceeded":
                return "bg-gradient-to-r from-orange-400 to-orange-500";
            case "critical":
                return "bg-gradient-to-r from-red-500 to-red-600";
            default:
                return "bg-gray-400";
        }
    }, [status]);

    // Cap the visual width at critical limit or 100%
    const displayPercent = Math.min(usedPercent, criticalLimit);
    const fillWidth = (displayPercent / criticalLimit) * 100;

    return (
        <div className={`w-full ${className}`}>
            {/* Labels */}
            {showLabels && (
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>0%</span>
                    <span>{softLimit}%</span>
                    <span>{hardLimit}%</span>
                    <span>{criticalLimit}%</span>
                </div>
            )}

            {/* Meter Track */}
            <div className={`relative w-full ${heights[size]} bg-gray-700 rounded-full overflow-hidden`}>
                {/* Threshold markers */}
                <div
                    className="absolute top-0 bottom-0 w-px bg-yellow-500/50"
                    style={{ left: `${(softLimit / criticalLimit) * 100}%` }}
                />
                <div
                    className="absolute top-0 bottom-0 w-px bg-orange-500/50"
                    style={{ left: `${(hardLimit / criticalLimit) * 100}%` }}
                />

                {/* Fill bar */}
                <div
                    className={`absolute top-0 left-0 bottom-0 ${fillColor} transition-all duration-500 ease-out rounded-full`}
                    style={{ width: `${Math.min(fillWidth, 100)}%` }}
                />

                {/* Glow effect for warning+ states */}
                {status !== "healthy" && (
                    <div
                        className={`absolute top-0 left-0 bottom-0 ${fillColor} opacity-30 blur-sm`}
                        style={{ width: `${Math.min(fillWidth, 100)}%` }}
                    />
                )}
            </div>

            {/* Current value */}
            {showLabels && (
                <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-medium text-white">
                        {usedPercent.toFixed(1)}% used
                    </span>
                    <span className={`text-xs font-medium ${getStatusTextColor(status)}`}>
                        {getStatusLabel(status)}
                    </span>
                </div>
            )}
        </div>
    );
}

function getStatusTextColor(status: BudgetStatus): string {
    switch (status) {
        case "healthy":
            return "text-green-400";
        case "warning":
            return "text-yellow-400";
        case "exceeded":
            return "text-orange-400";
        case "critical":
            return "text-red-400";
        default:
            return "text-gray-400";
    }
}

function getStatusLabel(status: BudgetStatus): string {
    switch (status) {
        case "healthy":
            return "Healthy";
        case "warning":
            return "Warning";
        case "exceeded":
            return "Exceeded";
        case "critical":
            return "Critical";
        default:
            return "Unknown";
    }
}
