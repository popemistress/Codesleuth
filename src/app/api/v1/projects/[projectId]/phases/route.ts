/**
 * /api/v1/projects/[projectId]/phases
 * 
 * CRUD operations for project phases.
 * Requires user authentication via NextAuth.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreatePhaseSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    order: z.number().int().min(0).optional(),
    estimatedTokens: z.number().int().positive().optional(),
    estimatedCredits: z.number().positive().optional(),
    agentId: z.string().optional(),
});

const UpdatePhaseSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
    order: z.number().int().min(0).optional(),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "PAUSED"]).optional(),
    estimatedTokens: z.number().int().positive().optional().nullable(),
    estimatedCredits: z.number().positive().optional().nullable(),
    agentId: z.string().optional().nullable(),
});

// ============================================================================
// GET /api/v1/projects/[projectId]/phases
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

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { userId: true },
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

        const phases = await prisma.phase.findMany({
            where: { projectId },
            include: {
                agent: {
                    select: { id: true, name: true, type: true },
                },
            },
            orderBy: { order: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: phases.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                order: p.order,
                status: p.status,
                estimatedTokens: p.estimatedTokens,
                estimatedCredits: p.estimatedCredits,
                agent: p.agent,
                startedAt: p.startedAt?.toISOString(),
                completedAt: p.completedAt?.toISOString(),
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error("[Phases GET] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST /api/v1/projects/[projectId]/phases
// ============================================================================

export async function POST(
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

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { userId: true },
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

        const body = await request.json();
        const parseResult = CreatePhaseSchema.safeParse(body);
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

        const { name, description, order, estimatedTokens, estimatedCredits, agentId } = parseResult.data;

        // Get next order if not provided
        let phaseOrder = order;
        if (phaseOrder === undefined) {
            const maxOrder = await prisma.phase.aggregate({
                where: { projectId },
                _max: { order: true },
            });
            phaseOrder = (maxOrder._max.order ?? -1) + 1;
        }

        // Verify agent exists if provided
        if (agentId) {
            const agent = await prisma.agent.findUnique({ where: { id: agentId } });
            if (!agent) {
                return NextResponse.json(
                    { success: false, error: { code: "AGENT_NOT_FOUND", message: "Agent not found" } },
                    { status: 400 }
                );
            }
        }

        const phase = await prisma.phase.create({
            data: {
                name,
                description,
                order: phaseOrder,
                estimatedTokens,
                estimatedCredits,
                projectId,
                agentId,
            },
            include: {
                agent: {
                    select: { id: true, name: true, type: true },
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: phase.id,
                    name: phase.name,
                    description: phase.description,
                    order: phase.order,
                    status: phase.status,
                    estimatedTokens: phase.estimatedTokens,
                    estimatedCredits: phase.estimatedCredits,
                    agent: phase.agent,
                    createdAt: phase.createdAt.toISOString(),
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[Phases POST] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

// ============================================================================
// PATCH /api/v1/projects/[projectId]/phases?phaseId=xxx
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
        const phaseId = request.nextUrl.searchParams.get("phaseId");

        if (!phaseId) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "phaseId is required" } },
                { status: 400 }
            );
        }

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { userId: true },
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

        const phase = await prisma.phase.findFirst({
            where: { id: phaseId, projectId },
        });

        if (!phase) {
            return NextResponse.json(
                { success: false, error: { code: "PHASE_NOT_FOUND", message: "Phase not found" } },
                { status: 404 }
            );
        }

        const body = await request.json();
        const parseResult = UpdatePhaseSchema.safeParse(body);
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

        const updateData: Record<string, unknown> = { ...parseResult.data };

        // Handle status transitions
        if (parseResult.data.status === "IN_PROGRESS" && phase.status === "PENDING") {
            updateData.startedAt = new Date();
        }
        if (parseResult.data.status === "COMPLETED" && phase.status !== "COMPLETED") {
            updateData.completedAt = new Date();
        }

        const updated = await prisma.phase.update({
            where: { id: phaseId },
            data: updateData,
            include: {
                agent: {
                    select: { id: true, name: true, type: true },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                id: updated.id,
                name: updated.name,
                description: updated.description,
                order: updated.order,
                status: updated.status,
                estimatedTokens: updated.estimatedTokens,
                estimatedCredits: updated.estimatedCredits,
                agent: updated.agent,
                startedAt: updated.startedAt?.toISOString(),
                completedAt: updated.completedAt?.toISOString(),
                updatedAt: updated.updatedAt.toISOString(),
            },
        });
    } catch (error) {
        console.error("[Phases PATCH] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

// ============================================================================
// DELETE /api/v1/projects/[projectId]/phases?phaseId=xxx
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
        const phaseId = request.nextUrl.searchParams.get("phaseId");

        if (!phaseId) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "phaseId is required" } },
                { status: 400 }
            );
        }

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { userId: true },
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

        const phase = await prisma.phase.findFirst({
            where: { id: phaseId, projectId },
        });

        if (!phase) {
            return NextResponse.json(
                { success: false, error: { code: "PHASE_NOT_FOUND", message: "Phase not found" } },
                { status: 404 }
            );
        }

        await prisma.phase.delete({ where: { id: phaseId } });

        return NextResponse.json({ success: true, message: "Phase deleted" });
    } catch (error) {
        console.error("[Phases DELETE] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}
