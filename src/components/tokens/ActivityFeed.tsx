/**
 * ActivityFeed Component
 * 
 * Real-time feed of token events.
 */

"use client";

import { useEffect, useRef } from "react";
import type { TokenEvent } from "@/types/tokens";

interface ActivityFeedProps {
    events: TokenEvent[];
    maxItems?: number;
    className?: string;
}

export function ActivityFeed({
    events,
    maxItems = 20,
    className = "",
}: ActivityFeedProps) {
    const feedRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new events
    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
    }, [events]);

    const displayEvents = events.slice(-maxItems);

    if (displayEvents.length === 0) {
        return (
            <div className={`flex items-center justify-center h-40 bg-gray-800/30 rounded-lg ${className}`}>
                <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
        );
    }

    return (
        <div
            ref={feedRef}
            className={`space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent ${className}`}
        >
            {displayEvents.map((event, index) => (
                <FeedItem key={index} event={event} />
            ))}
        </div>
    );
}

function FeedItem({ event }: { event: TokenEvent }) {
    const { icon, color, title, description, time } = getEventDetails(event);

    return (
        <div className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
            <div className={`p-2 rounded-lg ${color}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white truncate">{title}</p>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{description}</p>
            </div>
        </div>
    );
}

function getEventDetails(event: TokenEvent): {
    icon: React.ReactNode;
    color: string;
    title: string;
    description: string;
    time: string;
} {
    const timestamp = "timestamp" in event.data
        ? new Date(event.data.timestamp as string)
        : new Date();
    const time = formatTime(timestamp);

    switch (event.type) {
        case "token_recorded":
            return {
                icon: <TokenIcon className="w-4 h-4" />,
                color: "bg-blue-500/20 text-blue-400",
                title: "Tokens Recorded",
                description: `${event.data.promptTokens + event.data.completionTokens} tokens (${event.data.costCredits.toFixed(2)} credits)`,
                time,
            };
        case "threshold_crossed":
            return {
                icon: <AlertIcon className="w-4 h-4" />,
                color: event.data.threshold === "critical"
                    ? "bg-red-500/20 text-red-400"
                    : event.data.threshold === "hard"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-yellow-500/20 text-yellow-400",
                title: `${event.data.threshold.charAt(0).toUpperCase() + event.data.threshold.slice(1)} Threshold`,
                description: event.data.message,
                time,
            };
        case "phase_completed":
            return {
                icon: <CheckIcon className="w-4 h-4" />,
                color: "bg-green-500/20 text-green-400",
                title: "Phase Completed",
                description: `Used ${event.data.actualCredits.toFixed(2)} credits`,
                time,
            };
        case "budget_updated":
            return {
                icon: <EditIcon className="w-4 h-4" />,
                color: "bg-purple-500/20 text-purple-400",
                title: "Budget Updated",
                description: `New limit: ${event.data.totalCredits} credits`,
                time,
            };
        default:
            return {
                icon: <InfoIcon className="w-4 h-4" />,
                color: "bg-gray-500/20 text-gray-400",
                title: "Event",
                description: JSON.stringify((event as TokenEvent).data ?? {}).slice(0, 50),
                time,
            };
    }
}

function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Icons
function TokenIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
    );
}

function AlertIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function EditIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );
}

function InfoIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}
