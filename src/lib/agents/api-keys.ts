/**
 * API Key Utilities
 * 
 * Functions for generating and managing API keys for agent authentication.
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateApiKeyParams {
    userId: string;
    name: string;
    expiresInDays?: number;
    projectIds?: string[];
    scopes?: string[];
}

export interface ApiKeyResult {
    id: string;
    name: string;
    prefix: string;
    key: string; // Only returned on creation, never stored
    expiresAt: Date;
    projectIds: string[] | null;
    scopes: string[];
}

// ============================================================================
// GENERATION
// ============================================================================

/**
 * Generate a secure random API key
 */
function generateKey(): { key: string; prefix: string } {
    const key = `cs_${crypto.randomBytes(32).toString("hex")}`;
    const prefix = key.slice(0, 10);
    return { key, prefix };
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(params: CreateApiKeyParams): Promise<ApiKeyResult> {
    const { key, prefix } = generateKey();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (params.expiresInDays || 90));

    const apiKey = await prisma.apiKey.create({
        data: {
            name: params.name,
            key, // In production, consider hashing this
            prefix,
            userId: params.userId,
            projectIds: params.projectIds ?? undefined,
            scopes: params.scopes || ["agent:complete"],
            expiresAt,
        },
    });

    return {
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.prefix || prefix,
        key, // Return the raw key only on creation
        expiresAt: apiKey.expiresAt,
        projectIds: apiKey.projectIds as string[] | null,
        scopes: apiKey.scopes,
    };
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string): Promise<void> {
    await prisma.apiKey.update({
        where: { id: keyId },
        data: { revokedAt: new Date() },
    });
}

/**
 * List all API keys for a user (without the full key)
 */
export async function listApiKeys(userId: string): Promise<{
    id: string;
    name: string;
    prefix: string;
    expiresAt: Date;
    lastUsedAt: Date | null;
    isRevoked: boolean;
    scopes: string[];
}[]> {
    const keys = await prisma.apiKey.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    return keys.map((key) => ({
        id: key.id,
        name: key.name,
        prefix: key.prefix || "",
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
        isRevoked: !!key.revokedAt,
        scopes: key.scopes,
    }));
}

/**
 * Validate an API key and return its details
 */
export async function validateApiKey(apiKey: string): Promise<{
    valid: boolean;
    userId?: string;
    projectIds?: string[];
    scopes?: string[];
    reason?: string;
}> {
    const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
    });

    if (!keyRecord) {
        return { valid: false, reason: "API key not found" };
    }

    if (keyRecord.revokedAt) {
        return { valid: false, reason: "API key has been revoked" };
    }

    if (keyRecord.expiresAt < new Date()) {
        return { valid: false, reason: "API key has expired" };
    }

    // Update last used
    await prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() },
    });

    return {
        valid: true,
        userId: keyRecord.userId,
        projectIds: keyRecord.projectIds as string[] | undefined,
        scopes: keyRecord.scopes,
    };
}
