/**
 * Internal Auth for Orchestrator API
 * 
 * Uses HMAC-SHA256 signing to authenticate requests from the orchestrator service.
 * This is used for internal service-to-service communication, not user authentication.
 */

import { createHmac, timingSafeEqual } from "crypto";

const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET;

if (!ORCHESTRATOR_SECRET && process.env.NODE_ENV === "production") {
    console.error("[InternalAuth] ORCHESTRATOR_SECRET is not set in production!");
}

/**
 * Generate a signature for a request payload
 */
export function signPayload(payload: string, timestamp: number): string {
    if (!ORCHESTRATOR_SECRET) {
        throw new Error("ORCHESTRATOR_SECRET is not configured");
    }

    const message = `${timestamp}.${payload}`;
    const hmac = createHmac("sha256", ORCHESTRATOR_SECRET);
    hmac.update(message);
    return hmac.digest("hex");
}

/**
 * Verify the signature of a request
 */
export function verifySignature(
    payload: string,
    timestamp: number,
    signature: string
): boolean {
    if (!ORCHESTRATOR_SECRET) {
        console.error("[InternalAuth] Cannot verify: ORCHESTRATOR_SECRET not configured");
        return false;
    }

    // Check timestamp is within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    if (Math.abs(now - timestamp) > fiveMinutes) {
        console.warn("[InternalAuth] Signature expired or timestamp invalid");
        return false;
    }

    const expectedSignature = signPayload(payload, timestamp);

    // Use timing-safe comparison to prevent timing attacks
    try {
        const sigBuffer = Buffer.from(signature, "hex");
        const expectedBuffer = Buffer.from(expectedSignature, "hex");

        if (sigBuffer.length !== expectedBuffer.length) {
            return false;
        }

        return timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
        return false;
    }
}

/**
 * Create auth headers for an outgoing request to internal API
 */
export function createAuthHeaders(payload: string): {
    "X-Orchestrator-Timestamp": string;
    "X-Orchestrator-Signature": string;
} {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signPayload(payload, timestamp);

    return {
        "X-Orchestrator-Timestamp": timestamp.toString(),
        "X-Orchestrator-Signature": signature,
    };
}

/**
 * Validate a request from headers
 */
export function validateRequest(
    payload: string,
    headers: Headers
): { valid: boolean; error?: string } {
    const timestampHeader = headers.get("X-Orchestrator-Timestamp");
    const signatureHeader = headers.get("X-Orchestrator-Signature");

    if (!timestampHeader || !signatureHeader) {
        return { valid: false, error: "Missing authentication headers" };
    }

    const timestamp = parseInt(timestampHeader, 10);
    if (isNaN(timestamp)) {
        return { valid: false, error: "Invalid timestamp" };
    }

    if (!verifySignature(payload, timestamp, signatureHeader)) {
        return { valid: false, error: "Invalid signature" };
    }

    return { valid: true };
}
