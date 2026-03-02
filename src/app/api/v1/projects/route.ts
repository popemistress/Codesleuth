/**
 * /api/v1/projects
 * 
 * CRUD operations for projects.
 * Requires user authentication via NextAuth.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus } from "@/types/tokens";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateProjectSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(2000).optional(),
});

const ListQuerySchema = z.object({
    status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
    limit: z.coerce.number().min(1).max(100).optional().default(20),
    offset: z.coerce.number().min(0).optional().default(0),
});

// ============================================================================
// GET /api/v1/projects
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

        // Parse query params
        const searchParams = request.nextUrl.searchParams;
        const queryData = {
            status: searchParams.get("status") || undefined,
            limit: searchParams.get("limit") || undefined,
            offset: searchParams.get("offset") || undefined,
        };

        const parseResult = ListQuerySchema.safeParse(queryData);
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

        const { status, limit, offset } = parseResult.data;

        // Build query
        const where = {
            userId: session.user.id,
            ...(status && { status: status as ProjectStatus }),
        };

        // Get projects with count
        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                include: {
                    budget: {
                        select: {
                            totalCredits: true,
                            usedCredits: true,
                        },
                    },
                    _count: {
                        select: { phases: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.project.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: projects.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                status: p.status,
                budget: p.budget
                    ? {
                        totalCredits: p.budget.totalCredits,
                        usedCredits: p.budget.usedCredits,
                        usedPercent: Math.round((p.budget.usedCredits / p.budget.totalCredits) * 10000) / 100,
                    }
                    : null,
                phaseCount: p._count.phases,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
            })),
            meta: {
                total,
                limit,
                offset,
                hasMore: offset + projects.length < total,
            },
        });
    } catch (error) {
        console.error("[Projects GET] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST /api/v1/projects
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
        const parseResult = CreateProjectSchema.safeParse(body);
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

        const { name, description } = parseResult.data;

        // Check subscription project limit
        const subscription = await prisma.subscription.findUnique({
            where: { userId: session.user.id },
        });

        const projectLimit = subscription?.projectLimit ?? 3; // Free tier default
        const currentCount = await prisma.project.count({
            where: {
                userId: session.user.id,
                status: { in: ["ACTIVE", "PAUSED"] },
            },
        });

        if (projectLimit > 0 && currentCount >= projectLimit) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "LIMIT_EXCEEDED",
                        message: `Project limit reached (${projectLimit}). Upgrade your subscription.`,
                    },
                },
                { status: 403 }
            );
        }

        // Create project
        const project = await prisma.project.create({
            data: {
                name,
                description,
                userId: session.user.id,
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    status: project.status,
                    createdAt: project.createdAt.toISOString(),
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[Projects POST] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}
