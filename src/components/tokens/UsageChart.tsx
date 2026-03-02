/**
 * UsageChart Component
 * 
 * Line/bar chart for visualizing token usage over time.
 * Uses pure SVG for zero dependencies.
 */

"use client";

import { useMemo } from "react";
import type { UsageBucket } from "@/types/tokens";

interface UsageChartProps {
    data: UsageBucket[];
    type?: "line" | "bar";
    height?: number;
    showLegend?: boolean;
    className?: string;
}

export function UsageChart({
    data,
    type = "bar",
    height = 200,
    showLegend = true,
    className = "",
}: UsageChartProps) {
    const chartData = useMemo(() => {
        if (!data.length) return null;

        const maxCredits = Math.max(...data.map((d) => d.credits), 1);
        const padding = 40;
        const chartWidth = 100; // Percentage-based

        return {
            maxCredits,
            padding,
            chartWidth,
            items: data.map((d, i) => ({
                ...d,
                x: (i / (data.length - 1 || 1)) * 100,
                barX: (i / data.length) * 100,
                barWidth: (1 / data.length) * 100 * 0.8,
                y: ((d.credits / maxCredits) * 100),
                label: formatLabel(d.bucket),
            })),
        };
    }, [data]);

    if (!chartData || data.length === 0) {
        return (
            <div className={`flex items-center justify-center h-[${height}px] bg-gray-800/30 rounded-lg ${className}`}>
                <p className="text-gray-500">No usage data available</p>
            </div>
        );
    }

    return (
        <div className={`w-full ${className}`}>
            {/* Legend */}
            {showLegend && (
                <div className="flex items-center gap-4 mb-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-400 to-blue-600" />
                        <span className="text-gray-400">Prompt Tokens</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-400 to-purple-600" />
                        <span className="text-gray-400">Completion Tokens</span>
                    </div>
                </div>
            )}

            {/* Chart */}
            <svg
                viewBox={`0 0 100 ${height / 4}`}
                className="w-full"
                preserveAspectRatio="none"
                style={{ height }}
            >
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                    <line
                        key={y}
                        x1="0"
                        y1={(100 - y) / 100 * (height / 4)}
                        x2="100"
                        y2={(100 - y) / 100 * (height / 4)}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="0.2"
                    />
                ))}

                {type === "bar" ? (
                    // Bar chart
                    <>
                        {chartData.items.map((item, index) => (
                            <g key={index}>
                                {/* Bar background */}
                                <rect
                                    x={item.barX + "%"}
                                    y="0"
                                    width={item.barWidth + "%"}
                                    height={height / 4}
                                    fill="rgba(255,255,255,0.02)"
                                    rx="1"
                                />
                                {/* Credit bar */}
                                <rect
                                    x={item.barX + "%"}
                                    y={(100 - item.y) / 100 * (height / 4)}
                                    width={item.barWidth + "%"}
                                    height={(item.y / 100) * (height / 4)}
                                    fill="url(#barGradient)"
                                    rx="1"
                                    className="transition-all duration-300"
                                />
                            </g>
                        ))}
                    </>
                ) : (
                    // Line chart
                    <>
                        {/* Area fill */}
                        <path
                            d={`
                M 0,${height / 4}
                ${chartData.items.map((item) => `L ${item.x},${(100 - item.y) / 100 * (height / 4)}`).join(" ")}
                L 100,${height / 4}
                Z
              `}
                            fill="url(#areaGradient)"
                            opacity="0.3"
                        />
                        {/* Line */}
                        <path
                            d={`
                M ${chartData.items[0]?.x || 0},${(100 - (chartData.items[0]?.y || 0)) / 100 * (height / 4)}
                ${chartData.items.slice(1).map((item) => `L ${item.x},${(100 - item.y) / 100 * (height / 4)}`).join(" ")}
              `}
                            fill="none"
                            stroke="url(#lineGradient)"
                            strokeWidth="0.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {/* Data points */}
                        {chartData.items.map((item, index) => (
                            <circle
                                key={index}
                                cx={item.x + "%"}
                                cy={(100 - item.y) / 100 * (height / 4)}
                                r="1.5"
                                fill="#8b5cf6"
                                className="opacity-0 hover:opacity-100 transition-opacity"
                            />
                        ))}
                    </>
                )}

                {/* Gradients */}
                <defs>
                    <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
                {chartData.items.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((item, i) => (
                    <span key={i}>{item.label}</span>
                ))}
            </div>
        </div>
    );
}

function formatLabel(bucket: string): string {
    const date = new Date(bucket);
    if (isNaN(date.getTime())) return bucket;

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
