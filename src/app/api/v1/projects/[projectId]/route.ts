/**
 * /api/v1/projects/[projectId]
 * 
 * Get, update, delete a specific project.
 * Requires user authentication via NextAuth.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectTotalUsage } from "@/lib/timescale";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const UpdateProjectSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).optional().nullable(),
    status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
});

// ============================================================================
// GET /api/v1/projects/[projectId]
// ============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const { projectId } = await params;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                budget: true,
                phases: {
                    include: {
                        agent: {
                            select: { id: true, name: true, type: true },
                        },
                    },
                    orderBy: { order: "asc" },
                },
            },
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

        // Get real-time usage from TimescaleDB
        const usage = await getProjectTotalUsage(projectId);

        return NextResponse.json({
            success: true,
            data: {
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                budget: project.budget
                    ? {
                        id: project.budget.id,
                        totalCredits: project.budget.totalCredits,
                        usedCredits: usage.totalCredits,
                        usedPercent: Math.round((usage.totalCredits / project.budget.totalCredits) * 10000) / 100,
                        softLimitPercent: project.budget.softLimitPercent * 100,
                        hardLimitPercent: project.budget.hardLimitPercent * 100,
                    }
                    : null,
                phases: project.phases.map((p) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    order: p.order,
                    status: p.status,
                    estimatedCredits: p.estimatedCredits,
                    agent: p.agent,
                    startedAt: p.startedAt?.toISOString(),
                    completedAt: p.completedAt?.toISOString(),
                })),
                usage: {
                    totalPromptTokens: usage.totalPromptTokens,
                    totalCompletionTokens: usage.totalCompletionTokens,
                    totalCredits: usage.totalCredits,
                    callCount: usage.callCount,
                },
                createdAt: project.createdAt.toISOString(),
                updatedAt: project.updatedAt.toISOString(),
            },
        });
    } catch (error) {
        console.error("[Project GET] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

// ============================================================================
// PATCH /api/v1/projects/[projectId]
// ============================================================================

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const { projectId } = await params;

        const body = await request.json();
        const parseResult = UpdateProjectSchema.safeParse(body);
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

        const project = await prisma.project.findUnique({
            where: { id: projectId },
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

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: parseResult.data,
        });

        return NextResponse.json({
            success: true,
            data: {
                id: updated.id,
                name: updated.name,
                description: updated.description,
                status: updated.status,
                updatedAt: updated.updatedAt.toISOString(),
            },
        });
    } catch (error) {
        console.error("[Project PATCH] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

// ============================================================================
// DELETE /api/v1/projects/[projectId]
// ============================================================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const { projectId } = await params;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
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

        // Soft delete (archive) by default
        await prisma.project.update({
            where: { id: projectId },
            data: { status: "ARCHIVED" },
        });

        return NextResponse.json({ success: true, message: "Project archived" });
    } catch (error) {
        console.error("[Project DELETE] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}
