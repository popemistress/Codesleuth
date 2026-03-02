/**
 * TokenStats Component
 * 
 * Summary statistics cards for token usage.
 */

"use client";

import { formatCredits, formatCreditsAsUSD } from "@/lib/tokens/cost-normalizer";

interface TokenStatsProps {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalCredits: number;
    callCount?: number;
    className?: string;
}

export function TokenStats({
    totalPromptTokens,
    totalCompletionTokens,
    totalCredits,
    callCount,
    className = "",
}: TokenStatsProps) {
    const totalTokens = totalPromptTokens + totalCompletionTokens;

    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
            <StatCard
                label="Total Tokens"
                value={formatNumber(totalTokens)}
                subValue={`${formatNumber(totalPromptTokens)} / ${formatNumber(totalCompletionTokens)}`}
                subLabel="prompt / completion"
                icon={<TokenIcon />}
                color="blue"
            />
            <StatCard
                label="Credits Used"
                value={formatCredits(totalCredits)}
                subValue={formatCreditsAsUSD(totalCredits)}
                subLabel="USD equivalent"
                icon={<CreditIcon />}
                color="purple"
            />
            <StatCard
                label="Prompt Tokens"
                value={formatNumber(totalPromptTokens)}
                subValue={`${((totalPromptTokens / totalTokens) * 100 || 0).toFixed(1)}%`}
                subLabel="of total"
                icon={<InputIcon />}
                color="green"
            />
            <StatCard
                label={callCount !== undefined ? "API Calls" : "Completion Tokens"}
                value={callCount !== undefined ? formatNumber(callCount) : formatNumber(totalCompletionTokens)}
                subValue={callCount !== undefined
                    ? `${(totalTokens / (callCount || 1)).toFixed(0)} tokens/call`
                    : `${((totalCompletionTokens / totalTokens) * 100 || 0).toFixed(1)}%`
                }
                subLabel={callCount !== undefined ? "avg" : "of total"}
                icon={callCount !== undefined ? <CallIcon /> : <OutputIcon />}
                color="amber"
            />
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string;
    subValue: string;
    subLabel: string;
    icon: React.ReactNode;
    color: "blue" | "purple" | "green" | "amber";
}

function StatCard({ label, value, subValue, subLabel, icon, color }: StatCardProps) {
    const colorClasses = {
        blue: "from-blue-500/20 to-blue-600/10 border-blue-500/20",
        purple: "from-purple-500/20 to-purple-600/10 border-purple-500/20",
        green: "from-green-500/20 to-green-600/10 border-green-500/20",
        amber: "from-amber-500/20 to-amber-600/10 border-amber-500/20",
    };

    const iconColors = {
        blue: "text-blue-400",
        purple: "text-purple-400",
        green: "text-green-400",
        amber: "text-amber-400",
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
                <span className={iconColors[color]}>{icon}</span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="text-gray-300">{subValue}</span>
                <span>{subLabel}</span>
            </div>
        </div>
    );
}

function formatNumber(num: number): string {
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
        return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toLocaleString();
}

// Icons
function TokenIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
    );
}

function CreditIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function InputIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );
}

function OutputIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
    );
}

function CallIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}
