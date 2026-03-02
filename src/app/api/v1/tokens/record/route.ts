/**
 * POST /api/v1/tokens/record
 * 
 * Record token usage from agent execution.
 * This is an internal API called by the orchestrator middleware.
 * 
 * Authentication: HMAC signature from orchestrator service
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordToLedger, checkRequestExists, getProjectTotalUsage } from "@/lib/timescale";
import { calculateCredits } from "@/lib/tokens/cost-normalizer";
import { validateRequest } from "@/lib/tokens/internal-auth";
import { prisma } from "@/lib/prisma";
import type { EnforcementAction, RecordTokenResponse } from "@/types/tokens";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const RecordTokenSchema = z.object({
    projectId: z.string().min(1),
    phaseId: z.string().optional(),
    agentId: z.string().optional(),
    provider: z.enum(["anthropic", "openai", "google"]),
    model: z.string().min(1),
    promptTokens: z.number().int().min(0),
    completionTokens: z.number().int().min(0),
    requestId: z.string().uuid().optional(),
});

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        // Parse body
        const body = await request.text();

        // Validate internal auth (skip in development if no secret)
        if (process.env.NODE_ENV === "production" || process.env.ORCHESTRATOR_SECRET) {
            const authResult = validateRequest(body, request.headers);
            if (!authResult.valid) {
                return NextResponse.json(
                    { success: false, error: { code: "UNAUTHORIZED", message: authResult.error } },
                    { status: 401 }
                );
            }
        }

        // Parse and validate JSON
        let data;
        try {
            data = JSON.parse(body);
        } catch {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
                { status: 400 }
            );
        }

        const parseResult = RecordTokenSchema.safeParse(data);
        if (!parseResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Validation failed",
                        details: parseResult.error.flatten().fieldErrors,
                    },
                },
                { status: 400 }
            );
        }

        const { projectId, phaseId, agentId, provider, model, promptTokens, completionTokens, requestId } =
            parseResult.data;

        // Idempotency check
        if (requestId) {
            const exists = await checkRequestExists(requestId);
            if (exists) {
                return NextResponse.json(
                    { success: false, error: { code: "DUPLICATE_REQUEST", message: "Request already processed" } },
                    { status: 409 }
                );
            }
        }

        // Get project and budget
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { budget: true },
        });

        if (!project) {
            return NextResponse.json(
                { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found" } },
                { status: 404 }
            );
        }

        // Calculate cost
        const costCredits = calculateCredits(provider, model, promptTokens, completionTokens);

        // Get current budget usage
        let budgetPercent = 0;
        let enforcementAction: EnforcementAction = "none";
        let budgetRemaining = 0;

        if (project.budget) {
            const currentUsage = await getProjectTotalUsage(projectId);
            const currentCredits = currentUsage.totalCredits;
            budgetPercent = (currentCredits / project.budget.totalCredits) * 100;

            // Determine enforcement action based on current usage BEFORE this call
            if (budgetPercent >= project.budget.criticalLimit * 100) {
                enforcementAction = "critical";
            } else if (budgetPercent >= project.budget.hardLimitPercent * 100) {
                enforcementAction = "stop";
            } else if (budgetPercent >= project.budget.softLimitPercent * 100) {
                enforcementAction = "compress";
            }

            budgetRemaining = Math.max(0, project.budget.totalCredits - currentCredits - costCredits);

            // Update budget usage (denormalized for fast reads)
            await prisma.budget.update({
                where: { id: project.budget.id },
                data: {
                    usedCredits: { increment: costCredits },
                    usedPromptTokens: { increment: promptTokens },
                    usedCompletionTokens: { increment: completionTokens },
                },
            });
        }

        // Record to TimescaleDB ledger
        const ledgerResult = await recordToLedger({
            projectId,
            phaseId,
            agentId,
            userId: project.userId,
            provider,
            model,
            promptTokens,
            completionTokens,
            costCredits,
            budgetPercentBefore: budgetPercent,
            enforcementAction,
            requestId,
        });

        // Calculate new budget percent after this call
        const newBudgetPercent = project.budget
            ? ((project.budget.usedCredits + costCredits) / project.budget.totalCredits) * 100
            : 0;

        const response: RecordTokenResponse = {
            success: true,
            data: {
                id: ledgerResult.id,
                costCredits,
                budgetPercent: Math.round(newBudgetPercent * 100) / 100,
                enforcementAction,
                budgetRemaining: Math.round(budgetRemaining * 100) / 100,
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("[TokenRecord] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}
