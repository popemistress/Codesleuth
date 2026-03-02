/**
 * Agent Completion API Endpoint
 * 
 * Allows external agents to make budget-tracked LLM completions via HTTP.
 * Supports API key authentication for server-to-server calls.
 * 
 * POST /api/v1/agents/complete
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { TokenAwareAgent, BudgetExceededError } from "@/lib/agents";
import { getConfiguredProviders } from "@/lib/agents/llm-client";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const CompletionRequestSchema = z.object({
    projectId: z.string().min(1, "projectId is required"),
    userId: z.string().optional(), // Optional, will use API key user if not provided
    agentId: z.string().optional().default("api-agent"),
    phaseId: z.string().optional(),

    // LLM call params
    provider: z.enum(["anthropic", "openai", "google"]),
    model: z.string().min(1, "model is required"),
    prompt: z.string().min(1, "prompt is required"),
    systemPrompt: z.string().optional(),
    maxTokens: z.number().int().positive().max(128000).optional().default(4096),
    temperature: z.number().min(0).max(2).optional().default(0.7),

    // Options
    enforcebudget: z.boolean().optional().default(true),
    autoDowngrade: z.boolean().optional().default(false),
    requestId: z.string().optional(),
});

type CompletionRequestBody = z.infer<typeof CompletionRequestSchema>;

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function authenticateRequest(req: NextRequest): Promise<{
    userId: string;
    projectIds?: string[];
} | null> {
    // Check for API key in Authorization header
    const authHeader = req.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
        const apiKey = authHeader.slice(7);

        // Look up API key in database
        const keyRecord = await prisma.apiKey.findUnique({
            where: { key: apiKey, revokedAt: null },
            include: { user: true },
        });

        if (keyRecord && keyRecord.expiresAt > new Date()) {
            // Update last used timestamp
            await prisma.apiKey.update({
                where: { id: keyRecord.id },
                data: { lastUsedAt: new Date() },
            });

            return {
                userId: keyRecord.userId,
                projectIds: keyRecord.projectIds as string[] | undefined,
            };
        }
    }

    // For internal orchestrator calls
    const orchestratorSecret = req.headers.get("x-orchestrator-secret");
    if (orchestratorSecret && orchestratorSecret === process.env.ORCHESTRATOR_SECRET) {
        return {
            userId: "orchestrator",
        };
    }

    return null;
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate
        const auth = await authenticateRequest(req);
        if (!auth) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "UNAUTHORIZED",
                        message: "Valid API key required. Use Authorization: Bearer <api-key>",
                    },
                },
                { status: 401 }
            );
        }

        // 2. Parse and validate request body
        const body = await req.json();
        const parsed = CompletionRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid request body",
                        details: parsed.error.flatten().fieldErrors,
                    },
                },
                { status: 400 }
            );
        }

        const data: CompletionRequestBody = parsed.data;

        // 3. Check project access
        if (auth.projectIds && !auth.projectIds.includes(data.projectId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "FORBIDDEN",
                        message: "API key does not have access to this project",
                    },
                },
                { status: 403 }
            );
        }

        // 4. Verify project exists
        const project = await prisma.project.findUnique({
            where: { id: data.projectId },
        });

        if (!project) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "NOT_FOUND",
                        message: `Project not found: ${data.projectId}`,
                    },
                },
                { status: 404 }
            );
        }

        // 5. Create agent and make completion
        const agent = new TokenAwareAgent({
            projectId: data.projectId,
            userId: data.userId || auth.userId,
            agentId: data.agentId,
            phaseId: data.phaseId,
            enforcebudget: data.enforcebudget,
            autoDowngrade: data.autoDowngrade,
        });

        const response = await agent.complete({
            provider: data.provider,
            model: data.model,
            prompt: data.prompt,
            systemPrompt: data.systemPrompt,
            maxTokens: data.maxTokens,
            temperature: data.temperature,
            requestId: data.requestId,
        });

        return NextResponse.json({
            success: true,
            data: {
                content: response.content,
                usage: response.usage,
                cost: response.cost,
                model: response.model,
                requestId: response.requestId,
                enforcement: response.enforcement,
            },
        });

    } catch (error) {
        // Handle budget exceeded
        if (error instanceof BudgetExceededError) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "BUDGET_EXCEEDED",
                        message: error.message,
                        details: {
                            projectId: error.projectId,
                            usedCredits: error.usedCredits,
                            budgetCredits: error.budgetCredits,
                        },
                    },
                },
                { status: 402 }
            );
        }

        // Handle other errors
        console.error("[API] /api/v1/agents/complete error:", error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: error instanceof Error ? error.message : "An unexpected error occurred",
                },
            },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint for checking API status and configured providers
 */
export async function GET(req: NextRequest) {
    const auth = await authenticateRequest(req);

    return NextResponse.json({
        success: true,
        data: {
            status: "healthy",
            authenticated: !!auth,
            configuredProviders: getConfiguredProviders(),
            endpoints: {
                complete: "POST /api/v1/agents/complete",
            },
            documentation: "/docs/api/agents",
        },
    });
}
