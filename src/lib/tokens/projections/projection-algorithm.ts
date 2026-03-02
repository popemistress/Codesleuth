/**
 * Projection Algorithm
 * 
 * Estimates remaining project costs based on:
 * 1. Current project progress
 * 2. Historical completion data
 * 3. Phase-specific patterns
 * 4. Agent-specific patterns
 */

import { prisma } from "@/lib/prisma";
import { getProjectTotalUsage } from "@/lib/timescale";
import { getHistoricalSummary, getPhaseHistoricalData } from "./historical-data";
import type { PhaseProjection, AgentType } from "@/types/tokens";

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectionResult {
    /** Total estimated credits for project completion */
    estimatedTotalCredits: number;
    /** Confidence interval */
    confidenceInterval: {
        low: number;
        high: number;
    };
    /** Breakdown by phase */
    phases: PhaseProjection[];
    /** Overall confidence score (0-1) */
    overallConfidence: number;
    /** Methodology used for projection */
    methodology: string;
    /** Credits already used */
    usedCredits: number;
    /** Estimated remaining credits */
    remainingCredits: number;
}

export interface ProjectionInput {
    projectId: string;
    complexityTier?: "simple" | "medium" | "complex" | "enterprise";
    featureCount?: number;
    customEstimates?: Record<string, number>; // phase name -> estimated credits
}

// ============================================================================
// DEFAULT PHASE ESTIMATES
// ============================================================================

// Baseline estimates per complexity tier (in Credits)
const COMPLEXITY_MULTIPLIERS: Record<string, number> = {
    simple: 1.0,
    medium: 2.5,
    complex: 5.0,
    enterprise: 12.0,
};

// Default phase costs (in Credits) for a "simple" project
const DEFAULT_PHASE_ESTIMATES: Record<string, number> = {
    Discovery: 15,
    Design: 25,
    Implementation: 60,
    Testing: 20,
    Security: 15,
    Deployment: 10,
    Polish: 10,
};

// Agent cost estimates per execution (in Credits)
const DEFAULT_AGENT_COSTS: Record<AgentType, number> = {
    PRODUCT_DISCOVERY: 5,
    TECHNICAL_DESIGN: 8,
    BUILDER: 15,
    SECURITY: 6,
    VERIFIER: 4,
    CRITIC: 3,
};

// ============================================================================
// PROJECTION ALGORITHM
// ============================================================================

/**
 * Generate a cost projection for a project
 */
export async function generateProjection(input: ProjectionInput): Promise<ProjectionResult> {
    const { projectId, complexityTier = "medium", featureCount, customEstimates } = input;

    // Get project with phases
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            phases: {
                orderBy: { order: "asc" },
                include: {
                    agent: {
                        select: { type: true },
                    },
                },
            },
        },
    });

    if (!project) {
        throw new Error(`Project not found: ${projectId}`);
    }

    // Get current usage
    const currentUsage = await getProjectTotalUsage(projectId);

    // Get historical data for reference
    const historicalSummary = await getHistoricalSummary();

    // Calculate complexity multiplier
    const multiplier = COMPLEXITY_MULTIPLIERS[complexityTier] || 2.5;

    // Feature count adjustment (more features = higher cost)
    const featureMultiplier = featureCount ? 1 + (featureCount - 1) * 0.15 : 1.0;

    // Generate phase projections
    const phaseProjections: PhaseProjection[] = [];
    let totalEstimated = 0;
    let completedPhases = 0;
    const totalPhases = project.phases.length;

    for (const phase of project.phases) {
        const phaseStatus = mapPhaseStatus(phase.status);
        const phaseName = normalizePhaseName(phase.name);

        let estimatedCredits: number;
        let actualCredits: number | undefined;
        let confidence: number;

        if (phaseStatus === "completed") {
            // Use actual usage for completed phases
            const phaseUsage = await getPhaseUsage(phase.id);
            actualCredits = phaseUsage.totalCredits;
            estimatedCredits = actualCredits;
            confidence = 1.0;
            completedPhases++;
        } else if (customEstimates?.[phaseName] !== undefined) {
            // Use custom estimate if provided
            estimatedCredits = customEstimates[phaseName];
            confidence = 0.8;
        } else {
            // Calculate estimate based on historical data and complexity
            const historicalPhaseData = await getPhaseHistoricalData(phaseName);
            const baseEstimate = historicalPhaseData?.avgCredits
                || historicalSummary.averagePhaseCosts[phaseName]
                || DEFAULT_PHASE_ESTIMATES[phaseName]
                || 20;

            estimatedCredits = baseEstimate * multiplier * featureMultiplier;

            // Adjust by agent type if assigned
            if (phase.agent) {
                const agentBaseCost = DEFAULT_AGENT_COSTS[phase.agent.type as AgentType] || 10;
                // Estimate ~3-10 agent executions per phase based on complexity
                const executionCount = Math.ceil(3 * multiplier);
                const agentEstimate = agentBaseCost * executionCount;
                estimatedCredits = Math.max(estimatedCredits, agentEstimate);
            }

            // Round to 2 decimal places
            estimatedCredits = Math.round(estimatedCredits * 100) / 100;

            // Confidence based on data availability
            confidence = historicalPhaseData
                ? Math.min(0.9, 0.5 + historicalPhaseData.sampleSize * 0.05)
                : 0.5;
        }

        totalEstimated += estimatedCredits;

        phaseProjections.push({
            phaseId: phase.id,
            phaseName: phase.name,
            status: phaseStatus,
            actualCredits,
            estimatedCredits,
            confidence,
        });
    }

    // Calculate confidence interval
    const progressRatio = totalPhases > 0 ? completedPhases / totalPhases : 0;
    const uncertaintyFactor = 1 - progressRatio * 0.5; // Decreases as more phases complete
    const intervalWidth = totalEstimated * 0.2 * uncertaintyFactor;

    const confidenceInterval = {
        low: Math.max(0, Math.round((totalEstimated - intervalWidth) * 100) / 100),
        high: Math.round((totalEstimated + intervalWidth) * 100) / 100,
    };

    // Overall confidence based on progress and data quality
    const overallConfidence = Math.round(
        (0.3 + progressRatio * 0.5 + (historicalSummary.totalProjects > 0 ? 0.2 : 0)) * 100
    ) / 100;

    // Calculate remaining
    const remainingCredits = Math.max(0, totalEstimated - currentUsage.totalCredits);

    // Determine methodology
    let methodology = "Baseline Estimates";
    if (historicalSummary.totalProjects > 10) {
        methodology = "Historical Pattern Analysis";
    } else if (historicalSummary.totalProjects > 0) {
        methodology = "Hybrid (Limited Historical Data)";
    }
    if (customEstimates && Object.keys(customEstimates).length > 0) {
        methodology += " + Custom Estimates";
    }

    return {
        estimatedTotalCredits: Math.round(totalEstimated * 100) / 100,
        confidenceInterval,
        phases: phaseProjections,
        overallConfidence,
        methodology,
        usedCredits: currentUsage.totalCredits,
        remainingCredits: Math.round(remainingCredits * 100) / 100,
    };
}

/**
 * Quick estimate without detailed phase breakdown
 */
export async function quickEstimate(
    complexityTier: "simple" | "medium" | "complex" | "enterprise",
    featureCount: number = 1
): Promise<{ estimate: number; range: { low: number; high: number } }> {
    const multiplier = COMPLEXITY_MULTIPLIERS[complexityTier];
    const featureMultiplier = 1 + (featureCount - 1) * 0.15;

    // Base estimate (sum of all default phase costs)
    const baseTotal = Object.values(DEFAULT_PHASE_ESTIMATES).reduce((a, b) => a + b, 0);
    const estimate = baseTotal * multiplier * featureMultiplier;

    return {
        estimate: Math.round(estimate * 100) / 100,
        range: {
            low: Math.round(estimate * 0.7 * 100) / 100,
            high: Math.round(estimate * 1.5 * 100) / 100,
        },
    };
}

// ============================================================================
// VARIANCE TRACKING
// ============================================================================

export interface VarianceReport {
    projectId: string;
    estimatedCredits: number;
    actualCredits: number;
    varianceCredits: number;
    variancePercent: number;
    phaseVariances: Array<{
        phaseId: string;
        phaseName: string;
        estimated: number;
        actual: number;
        variancePercent: number;
    }>;
    analysis: string;
}

/**
 * Calculate variance between projections and actual usage
 */
export async function calculateVariance(
    projectId: string,
    originalProjection: ProjectionResult
): Promise<VarianceReport> {
    const currentUsage = await getProjectTotalUsage(projectId);

    const varianceCredits = currentUsage.totalCredits - originalProjection.estimatedTotalCredits;
    const variancePercent = originalProjection.estimatedTotalCredits > 0
        ? (varianceCredits / originalProjection.estimatedTotalCredits) * 100
        : 0;

    // Calculate phase-level variances
    const phaseVariances: VarianceReport["phaseVariances"] = [];

    for (const phase of originalProjection.phases) {
        if (phase.actualCredits !== undefined) {
            const variance = phase.actualCredits - phase.estimatedCredits;
            const varPct = phase.estimatedCredits > 0
                ? (variance / phase.estimatedCredits) * 100
                : 0;

            phaseVariances.push({
                phaseId: phase.phaseId,
                phaseName: phase.phaseName,
                estimated: phase.estimatedCredits,
                actual: phase.actualCredits,
                variancePercent: Math.round(varPct * 100) / 100,
            });
        }
    }

    // Generate analysis
    let analysis: string;
    if (Math.abs(variancePercent) < 10) {
        analysis = "Projection was accurate. Actual usage within 10% of estimate.";
    } else if (variancePercent > 0) {
        analysis = `Project ran ${variancePercent.toFixed(1)}% over estimate. Consider adjusting complexity tier or phase estimates for similar projects.`;
    } else {
        analysis = `Project completed ${Math.abs(variancePercent).toFixed(1)}% under estimate. Efficiency gains noted.`;
    }

    return {
        projectId,
        estimatedCredits: originalProjection.estimatedTotalCredits,
        actualCredits: currentUsage.totalCredits,
        varianceCredits: Math.round(varianceCredits * 100) / 100,
        variancePercent: Math.round(variancePercent * 100) / 100,
        phaseVariances,
        analysis,
    };
}

// ============================================================================
// HELPERS
// ============================================================================

function mapPhaseStatus(status: string): "completed" | "in_progress" | "pending" {
    switch (status) {
        case "COMPLETED":
            return "completed";
        case "IN_PROGRESS":
            return "in_progress";
        default:
            return "pending";
    }
}

function normalizePhaseName(name: string): string {
    const lower = name.toLowerCase();

    if (lower.includes("discovery") || lower.includes("planning")) return "Discovery";
    if (lower.includes("design") || lower.includes("architecture")) return "Design";
    if (lower.includes("implement") || lower.includes("build") || lower.includes("develop")) return "Implementation";
    if (lower.includes("test") || lower.includes("verify") || lower.includes("qa")) return "Testing";
    if (lower.includes("security") || lower.includes("audit")) return "Security";
    if (lower.includes("deploy") || lower.includes("release") || lower.includes("launch")) return "Deployment";
    if (lower.includes("polish") || lower.includes("refine")) return "Polish";

    return name;
}

async function getPhaseUsage(phaseId: string): Promise<{ totalCredits: number }> {
    const { query } = await import("@/lib/timescale");

    const result = await query<{ total_credits: number }>(
        `SELECT COALESCE(SUM(cost_credits), 0) as total_credits
     FROM token_ledger
     WHERE phase_id = $1`,
        [phaseId]
    );

    return {
        totalCredits: result.length > 0 ? Number(result[0].total_credits) : 0,
    };
}
