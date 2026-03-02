/**
 * SSE Event Emitter for Real-time Token Updates
 * 
 * Uses Redis pub/sub to broadcast token events to connected clients.
 * Supports multiple dashboard instances via Redis channel subscriptions.
 */

import { createClient, type RedisClientType } from "redis";
import type { TokenEvent } from "@/types/tokens";

// ============================================================================
// REDIS CLIENT
// ============================================================================

let publisherClient: RedisClientType | null = null;
let subscriberClient: RedisClientType | null = null;

const CHANNEL_PREFIX = "codesleuth:tokens:";

/**
 * Get or create the Redis publisher client
 */
async function getPublisher(): Promise<RedisClientType> {
    if (!publisherClient) {
        publisherClient = createClient({
            url: process.env.REDIS_URL || "redis://localhost:6379",
        });
        publisherClient.on("error", (err) => console.error("[SSE Publisher] Redis error:", err));
        await publisherClient.connect();
    }
    return publisherClient;
}

/**
 * Get or create the Redis subscriber client
 */
async function getSubscriber(): Promise<RedisClientType> {
    if (!subscriberClient) {
        subscriberClient = createClient({
            url: process.env.REDIS_URL || "redis://localhost:6379",
        });
        subscriberClient.on("error", (err) => console.error("[SSE Subscriber] Redis error:", err));
        await subscriberClient.connect();
    }
    return subscriberClient;
}

// ============================================================================
// CHANNEL MANAGEMENT
// ============================================================================

/**
 * Get the Redis channel name for a project
 */
function getProjectChannel(projectId: string): string {
    return `${CHANNEL_PREFIX}project:${projectId}`;
}

/**
 * Get the Redis channel name for a user (all their projects)
 */
function getUserChannel(userId: string): string {
    return `${CHANNEL_PREFIX}user:${userId}`;
}

// ============================================================================
// EVENT PUBLISHING
// ============================================================================

/**
 * Emit a token event to subscribers
 */
export async function emitTokenEvent(
    projectId: string,
    event: TokenEvent,
    userId?: string
): Promise<void> {
    try {
        const publisher = await getPublisher();
        const message = JSON.stringify(event);

        // Publish to project channel
        await publisher.publish(getProjectChannel(projectId), message);

        // Also publish to user channel if provided
        if (userId) {
            await publisher.publish(getUserChannel(userId), message);
        }
    } catch (error) {
        console.error("[SSE Emitter] Failed to emit event:", error);
        // Don't throw - SSE is non-critical
    }
}

/**
 * Emit a batch of events
 */
export async function emitTokenEvents(
    projectId: string,
    events: TokenEvent[],
    userId?: string
): Promise<void> {
    for (const event of events) {
        await emitTokenEvent(projectId, event, userId);
    }
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

export type EventHandler = (event: TokenEvent) => void;

interface Subscription {
    unsubscribe: () => Promise<void>;
}

/**
 * Subscribe to token events for a project
 */
export async function subscribeToProject(
    projectId: string,
    handler: EventHandler
): Promise<Subscription> {
    const subscriber = await getSubscriber();
    const channel = getProjectChannel(projectId);

    await subscriber.subscribe(channel, (message) => {
        try {
            const event = JSON.parse(message) as TokenEvent;
            handler(event);
        } catch (error) {
            console.error("[SSE Subscriber] Failed to parse event:", error);
        }
    });

    return {
        unsubscribe: async () => {
            await subscriber.unsubscribe(channel);
        },
    };
}

/**
 * Subscribe to all token events for a user
 */
export async function subscribeToUser(
    userId: string,
    handler: EventHandler
): Promise<Subscription> {
    const subscriber = await getSubscriber();
    const channel = getUserChannel(userId);

    await subscriber.subscribe(channel, (message) => {
        try {
            const event = JSON.parse(message) as TokenEvent;
            handler(event);
        } catch (error) {
            console.error("[SSE Subscriber] Failed to parse event:", error);
        }
    });

    return {
        unsubscribe: async () => {
            await subscriber.unsubscribe(channel);
        },
    };
}

// ============================================================================
// SSE STREAM HELPERS
// ============================================================================

/**
 * Format an event for SSE transmission
 */
export function formatSSEEvent(event: TokenEvent): string {
    return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

/**
 * Format a heartbeat for SSE (keeps connection alive)
 */
export function formatSSEHeartbeat(): string {
    return `: heartbeat ${Date.now()}\n\n`;
}

/**
 * Create an SSE-compatible ReadableStream for a project
 */
export function createProjectEventStream(projectId: string): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    let subscription: Subscription | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    return new ReadableStream({
        async start(controller) {
            try {
                // Subscribe to project events
                subscription = await subscribeToProject(projectId, (event) => {
                    controller.enqueue(encoder.encode(formatSSEEvent(event)));
                });

                // Send heartbeat every 30 seconds
                heartbeatInterval = setInterval(() => {
                    controller.enqueue(encoder.encode(formatSSEHeartbeat()));
                }, 30000);

                // Send initial connection event
                controller.enqueue(
                    encoder.encode(
                        `event: connected\ndata: ${JSON.stringify({ projectId, timestamp: Date.now() })}\n\n`
                    )
                );
            } catch (error) {
                console.error("[SSE Stream] Failed to start:", error);
                controller.error(error);
            }
        },
        cancel() {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            if (subscription) {
                subscription.unsubscribe().catch(console.error);
            }
        },
    });
}

/**
 * Create an SSE-compatible ReadableStream for a user (all projects)
 */
export function createUserEventStream(userId: string): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    let subscription: Subscription | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    return new ReadableStream({
        async start(controller) {
            try {
                // Subscribe to user events
                subscription = await subscribeToUser(userId, (event) => {
                    controller.enqueue(encoder.encode(formatSSEEvent(event)));
                });

                // Send heartbeat every 30 seconds
                heartbeatInterval = setInterval(() => {
                    controller.enqueue(encoder.encode(formatSSEHeartbeat()));
                }, 30000);

                // Send initial connection event
                controller.enqueue(
                    encoder.encode(
                        `event: connected\ndata: ${JSON.stringify({ userId, timestamp: Date.now() })}\n\n`
                    )
                );
            } catch (error) {
                console.error("[SSE Stream] Failed to start:", error);
                controller.error(error);
            }
        },
        cancel() {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            if (subscription) {
                subscription.unsubscribe().catch(console.error);
            }
        },
    });
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Close all Redis connections (for graceful shutdown)
 */
export async function closeConnections(): Promise<void> {
    if (publisherClient) {
        await publisherClient.disconnect();
        publisherClient = null;
    }
    if (subscriberClient) {
        await subscriberClient.disconnect();
        subscriberClient = null;
    }
}
