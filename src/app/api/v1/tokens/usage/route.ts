/**
 * GET /api/v1/tokens/usage
 * 
 * Query token usage data with various grouping options.
 * Requires user authentication via NextAuth.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    getUsageByProject,
    getUsageByTimeRange,
    getUsageByAgent,
    getUsageByPhase,
} from "@/lib/timescale";
import type { UsageResponse } from "@/types/tokens";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const UsageQuerySchema = z.object({
    projectId: z.string().min(1),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    groupBy: z.enum(["hour", "day", "agent", "phase"]).optional(),
});

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const queryData = {
            projectId: searchParams.get("projectId") || "",
            startDate: searchParams.get("startDate") || undefined,
            endDate: searchParams.get("endDate") || undefined,
            groupBy: searchParams.get("groupBy") || undefined,
        };

        const parseResult = UsageQuerySchema.safeParse(queryData);
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

        const { projectId, startDate, endDate, groupBy } = parseResult.data;

        // Verify user owns the project
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

        // Set default date range (last 30 days)
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get total usage
        const totalUsage = await getUsageByProject(projectId, start, end);

        // Get breakdown based on groupBy parameter
        let breakdown;
        switch (groupBy) {
            case "hour":
                breakdown = await getUsageByTimeRange(projectId, start, end, "hour");
                break;
            case "day":
                breakdown = await getUsageByTimeRange(projectId, start, end, "day");
                break;
            case "agent":
                breakdown = await getUsageByAgent(projectId, start, end);
                break;
            case "phase":
                breakdown = await getUsageByPhase(projectId, start, end);
                break;
            default:
                // Default to daily breakdown
                breakdown = await getUsageByTimeRange(projectId, start, end, "day");
        }

        const response: UsageResponse = {
            data: {
                totalPromptTokens: totalUsage.totalPromptTokens,
                totalCompletionTokens: totalUsage.totalCompletionTokens,
                totalCredits: totalUsage.totalCredits,
                breakdown,
            },
            meta: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                projectId,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[TokenUsage] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}
