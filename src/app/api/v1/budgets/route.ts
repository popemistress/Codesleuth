/**
 * /api/v1/budgets
 * 
 * CRUD operations for project budgets.
 * Requires user authentication via NextAuth.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectTotalUsage } from "@/lib/timescale";
import type { BudgetResponse, BudgetStatus } from "@/types/tokens";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateBudgetSchema = z.object({
    projectId: z.string().min(1),
    totalCredits: z.number().positive(),
    softLimitPercent: z.number().min(0).max(1).optional().default(0.8),
    hardLimitPercent: z.number().min(0).max(1.5).optional().default(1.0),
});

const UpdateBudgetSchema = z.object({
    totalCredits: z.number().positive().optional(),
    softLimitPercent: z.number().min(0).max(1).optional(),
    hardLimitPercent: z.number().min(0).max(1.5).optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

function getBudgetStatus(usedPercent: number, softLimit: number, hardLimit: number): BudgetStatus {
    if (usedPercent >= 1.5) return "critical";
    if (usedPercent >= hardLimit) return "exceeded";
    if (usedPercent >= softLimit) return "warning";
    return "healthy";
}

// ============================================================================
// GET /api/v1/budgets?projectId=xxx
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const projectId = request.nextUrl.searchParams.get("projectId");
        if (!projectId) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "projectId is required" } },
                { status: 400 }
            );
        }

        // Get project with budget
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

        if (project.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        if (!project.budget) {
            return NextResponse.json(
                { success: false, error: { code: "BUDGET_NOT_FOUND", message: "No budget configured for this project" } },
                { status: 404 }
            );
        }

        // Get real-time usage from TimescaleDB
        const usage = await getProjectTotalUsage(projectId);
        const usedPercent = usage.totalCredits / project.budget.totalCredits;

        const response: BudgetResponse = {
            projectId,
            totalCredits: project.budget.totalCredits,
            usedCredits: usage.totalCredits,
            usedPercent: Math.round(usedPercent * 10000) / 100, // Percentage with 2 decimals
            softLimit: project.budget.softLimitPercent * 100,
            hardLimit: project.budget.hardLimitPercent * 100,
            criticalLimit: project.budget.criticalLimit * 100,
            status: getBudgetStatus(usedPercent, project.budget.softLimitPercent, project.budget.hardLimitPercent),
        };

        return NextResponse.json({ success: true, data: response });
    } catch (error) {
        console.error("[Budget GET] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST /api/v1/budgets
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const parseResult = CreateBudgetSchema.safeParse(body);
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

        const { projectId, totalCredits, softLimitPercent, hardLimitPercent } = parseResult.data;

        // Verify project ownership
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

        if (project.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        if (project.budget) {
            return NextResponse.json(
                { success: false, error: { code: "DUPLICATE", message: "Budget already exists for this project" } },
                { status: 409 }
            );
        }

        // Create budget
        const budget = await prisma.budget.create({
            data: {
                projectId,
                totalCredits,
                softLimitPercent,
                hardLimitPercent,
                criticalLimit: 1.5, // 150%
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: budget.id,
                    projectId: budget.projectId,
                    totalCredits: budget.totalCredits,
                    softLimitPercent: budget.softLimitPercent,
                    hardLimitPercent: budget.hardLimitPercent,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[Budget POST] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

// ============================================================================
// PATCH /api/v1/budgets?projectId=xxx
// ============================================================================

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const projectId = request.nextUrl.searchParams.get("projectId");
        if (!projectId) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "projectId is required" } },
                { status: 400 }
            );
        }

        const body = await request.json();
        const parseResult = UpdateBudgetSchema.safeParse(body);
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

        // Get project with budget
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

        if (project.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        if (!project.budget) {
            return NextResponse.json(
                { success: false, error: { code: "BUDGET_NOT_FOUND", message: "No budget configured" } },
                { status: 404 }
            );
        }

        // Update budget
        const budget = await prisma.budget.update({
            where: { id: project.budget.id },
            data: parseResult.data,
        });

        return NextResponse.json({
            success: true,
            data: {
                id: budget.id,
                projectId: budget.projectId,
                totalCredits: budget.totalCredits,
                softLimitPercent: budget.softLimitPercent,
                hardLimitPercent: budget.hardLimitPercent,
            },
        });
    } catch (error) {
        console.error("[Budget PATCH] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

// ============================================================================
// DELETE /api/v1/budgets?projectId=xxx
// ============================================================================

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const projectId = request.nextUrl.searchParams.get("projectId");
        if (!projectId) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "projectId is required" } },
                { status: 400 }
            );
        }

        // Get project with budget
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

        if (project.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        if (!project.budget) {
            return NextResponse.json(
                { success: false, error: { code: "BUDGET_NOT_FOUND", message: "No budget configured" } },
                { status: 404 }
            );
        }

        // Delete budget
        await prisma.budget.delete({
            where: { id: project.budget.id },
        });

        return NextResponse.json({ success: true, message: "Budget deleted" });
    } catch (error) {
        console.error("[Budget DELETE] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}
