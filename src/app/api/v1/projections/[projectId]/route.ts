/**
 * GET /api/v1/projections/[projectId]
 * POST /api/v1/projections/[projectId]
 * 
 * Project cost projection endpoints.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
    generateProjection,
    calculateVariance,
} from "@/lib/tokens/projections";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ComplexityTierSchema = z.enum(["simple", "medium", "complex", "enterprise"]);

const ProjectionQuerySchema = z.object({
    complexityTier: ComplexityTierSchema.optional(),
    featureCount: z.coerce.number().int().positive().optional(),
    includeVariance: z.coerce.boolean().optional(),
});

const CustomEstimatesSchema = z.record(z.string(), z.number().positive());

const PostBodySchema = z.object({
    complexityTier: ComplexityTierSchema.optional(),
    featureCount: z.number().int().positive().optional(),
    customEstimates: CustomEstimatesSchema.optional(),
    saveProjection: z.boolean().optional(),
});

// ============================================================================
// GET - Generate projection for a project
// ============================================================================

interface ProjectWithBudget {
    id: string;
    userId: string;
    budget: {
        totalCredits: number;
    } | null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        // Authenticate
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
            include: { budget: true },
        }) as ProjectWithBudget | null;

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

        // Parse query params
        const queryParams = Object.fromEntries(request.nextUrl.searchParams);
        const validatedQuery = ProjectionQuerySchema.safeParse(queryParams);

        if (!validatedQuery.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: validatedQuery.error.message } },
                { status: 400 }
            );
        }

        const { complexityTier, featureCount, includeVariance } = validatedQuery.data;

        // Generate projection
        const projection = await generateProjection({
            projectId,
            complexityTier,
            featureCount,
        });

        // Add budget comparison if available
        let budgetComparison = null;
        if (project.budget) {
            const budgetTotal = project.budget.totalCredits;
            budgetComparison = {
                budgetTotal,
                projectedTotal: projection.estimatedTotalCredits,
                projectedRemaining: budgetTotal - projection.estimatedTotalCredits,
                isUnderBudget: projection.estimatedTotalCredits <= budgetTotal,
                utilizationPercent: Math.round((projection.estimatedTotalCredits / budgetTotal) * 10000) / 100,
            };
        }

        // Include variance if requested and there's previous projection data
        let variance = null;
        if (includeVariance) {
            // In a real implementation, we'd retrieve stored projections
            // For now, calculate variance against current usage
            variance = await calculateVariance(projectId, projection);
        }

        return NextResponse.json({
            success: true,
            data: {
                projection,
                budgetComparison,
                variance,
            },
        });
    } catch (error) {
        console.error("[Projections GET] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST - Generate projection with custom parameters
// ============================================================================

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        // Authenticate
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
            include: { budget: true },
        }) as ProjectWithBudget | null;

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

        // Parse body
        const body = await request.json();
        const validatedBody = PostBodySchema.safeParse(body);

        if (!validatedBody.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: validatedBody.error.message } },
                { status: 400 }
            );
        }

        const { complexityTier, featureCount, customEstimates } = validatedBody.data;

        // Generate projection with custom estimates
        const projection = await generateProjection({
            projectId,
            complexityTier,
            featureCount,
            customEstimates,
        });

        // Budget comparison
        let budgetComparison = null;
        if (project.budget) {
            const budgetTotal = project.budget.totalCredits;
            budgetComparison = {
                budgetTotal,
                projectedTotal: projection.estimatedTotalCredits,
                projectedRemaining: budgetTotal - projection.estimatedTotalCredits,
                isUnderBudget: projection.estimatedTotalCredits <= budgetTotal,
                utilizationPercent: Math.round((projection.estimatedTotalCredits / budgetTotal) * 10000) / 100,
            };
        }

        return NextResponse.json({
            success: true,
            data: {
                projection,
                budgetComparison,
            },
        });
    } catch (error) {
        console.error("[Projections POST] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}
