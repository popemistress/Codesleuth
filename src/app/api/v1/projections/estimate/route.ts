/**
 * GET /api/v1/projections/estimate
 * 
 * Quick cost estimation without requiring a project.
 * Useful for pre-project budgeting.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { quickEstimate, getHistoricalSummary } from "@/lib/tokens/projections";
import { formatCreditsAsUSD } from "@/lib/tokens/cost-normalizer";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const EstimateQuerySchema = z.object({
    complexity: z.enum(["simple", "medium", "complex", "enterprise"]),
    features: z.coerce.number().int().positive().optional().default(1),
    includeBreakdown: z.coerce.boolean().optional().default(false),
});

// ============================================================================
// GET - Quick estimate endpoint
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        // Authenticate
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        // Parse query params
        const queryParams = Object.fromEntries(request.nextUrl.searchParams);
        const validatedQuery = EstimateQuerySchema.safeParse(queryParams);

        if (!validatedQuery.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "complexity parameter is required" } },
                { status: 400 }
            );
        }

        const { complexity, features, includeBreakdown } = validatedQuery.data;

        // Get quick estimate
        const estimate = await quickEstimate(complexity, features);

        // Build response
        const response: Record<string, unknown> = {
            complexity,
            featureCount: features,
            estimatedCredits: estimate.estimate,
            estimatedUSD: formatCreditsAsUSD(estimate.estimate),
            range: {
                low: {
                    credits: estimate.range.low,
                    usd: formatCreditsAsUSD(estimate.range.low),
                },
                high: {
                    credits: estimate.range.high,
                    usd: formatCreditsAsUSD(estimate.range.high),
                },
            },
        };

        // Include breakdown if requested
        if (includeBreakdown) {
            const historicalData = await getHistoricalSummary();

            // Get multiplier for complexity
            const multipliers: Record<string, number> = {
                simple: 1.0,
                medium: 2.5,
                complex: 5.0,
                enterprise: 12.0,
            };
            const multiplier = multipliers[complexity];
            const featureMultiplier = 1 + (features - 1) * 0.15;

            // Phase breakdown
            const defaultPhases: Record<string, number> = {
                Discovery: 15,
                Design: 25,
                Implementation: 60,
                Testing: 20,
                Security: 15,
                Deployment: 10,
                Polish: 10,
            };

            const breakdown = Object.entries(defaultPhases).map(([phase, baseCredits]) => {
                const adjusted = baseCredits * multiplier * featureMultiplier;
                return {
                    phase,
                    credits: Math.round(adjusted * 100) / 100,
                    usd: formatCreditsAsUSD(adjusted),
                    percentOfTotal: Math.round((adjusted / estimate.estimate) * 10000) / 100,
                };
            });

            response.breakdown = breakdown;
            response.methodology = historicalData.totalProjects > 10
                ? "Historical Pattern Analysis"
                : "Baseline Estimates";
        }

        return NextResponse.json({
            success: true,
            data: response,
        });
    } catch (error) {
        console.error("[Estimate GET] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}
