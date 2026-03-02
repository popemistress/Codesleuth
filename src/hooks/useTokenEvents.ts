/**
 * useTokenEvents Hook
 * 
 * Subscribes to real-time token events via SSE.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { TokenEvent } from "@/types/tokens";

interface UseTokenEventsOptions {
    projectId?: string;
    onEvent?: (event: TokenEvent) => void;
    enabled?: boolean;
}

interface UseTokenEventsResult {
    isConnected: boolean;
    lastEvent: TokenEvent | null;
    events: TokenEvent[];
    error: string | null;
    reconnect: () => void;
}

export function useTokenEvents(options: UseTokenEventsOptions = {}): UseTokenEventsResult {
    const { projectId, onEvent, enabled = true } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<TokenEvent | null>(null);
    const [events, setEvents] = useState<TokenEvent[]>([]);
    const [error, setError] = useState<string | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const connectRef = useRef<() => void>(() => { });

    const connect = useCallback(() => {
        if (!enabled) return;

        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        // Build URL
        const url = projectId
            ? `/api/v1/events?projectId=${encodeURIComponent(projectId)}`
            : "/api/v1/events";

        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setIsConnected(true);
            setError(null);
        };

        eventSource.onerror = () => {
            setIsConnected(false);
            setError("Connection lost. Reconnecting...");

            // Auto-reconnect after 5 seconds using ref
            reconnectTimeoutRef.current = setTimeout(() => {
                connectRef.current();
            }, 5000);
        };

        // Handle connected event
        eventSource.addEventListener("connected", (e) => {
            const data = JSON.parse((e as MessageEvent).data);
            console.log("[TokenEvents] Connected:", data);
        });

        // Handle token_recorded event
        eventSource.addEventListener("token_recorded", (e) => {
            const data = JSON.parse((e as MessageEvent).data);
            const event: TokenEvent = { type: "token_recorded", data };
            setLastEvent(event);
            setEvents((prev) => [...prev.slice(-99), event]); // Keep last 100
            onEvent?.(event);
        });

        // Handle threshold_crossed event
        eventSource.addEventListener("threshold_crossed", (e) => {
            const data = JSON.parse((e as MessageEvent).data);
            const event: TokenEvent = { type: "threshold_crossed", data };
            setLastEvent(event);
            setEvents((prev) => [...prev.slice(-99), event]);
            onEvent?.(event);
        });

        // Handle phase_completed event
        eventSource.addEventListener("phase_completed", (e) => {
            const data = JSON.parse((e as MessageEvent).data);
            const event: TokenEvent = { type: "phase_completed", data };
            setLastEvent(event);
            setEvents((prev) => [...prev.slice(-99), event]);
            onEvent?.(event);
        });

        // Handle budget_updated event
        eventSource.addEventListener("budget_updated", (e) => {
            const data = JSON.parse((e as MessageEvent).data);
            const event: TokenEvent = { type: "budget_updated", data };
            setLastEvent(event);
            setEvents((prev) => [...prev.slice(-99), event]);
            onEvent?.(event);
        });
    }, [projectId, enabled, onEvent]);

    // Keep ref in sync with latest connect function
    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        if (enabled) {
            connect();
        }

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect, enabled]);

    return {
        isConnected,
        lastEvent,
        events,
        error,
        reconnect: connect,
    };
}

