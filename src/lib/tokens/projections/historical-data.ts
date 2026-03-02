/**
 * Historical Data Collection Service
 * 
 * Collects and analyzes historical project completion data
 * to build the foundation for cost projections.
 */

import { prisma } from "@/lib/prisma";
import { query, getProjectTotalUsage } from "@/lib/timescale";
import type { ProjectCompletion, AgentType } from "@/types/tokens";

// ============================================================================
// TYPES
// ============================================================================

export interface HistoricalSummary {
    totalProjects: number;
    averageCreditsPerProject: number;
    medianCreditsPerProject: number;
    averagePhaseCosts: Record<string, number>;
    averageAgentCosts: Record<string, number>;
    creditsPerComplexityTier: Record<string, number>;
}

export interface PhaseHistoricalData {
    phaseName: string;
    avgCredits: number;
    medianCredits: number;
    minCredits: number;
    maxCredits: number;
    sampleSize: number;
    standardDeviation: number;
}

export interface AgentHistoricalData {
    agentType: AgentType;
    avgCreditsPerExecution: number;
    avgPromptTokens: number;
    avgCompletionTokens: number;
    sampleSize: number;
}

// ============================================================================
// HISTORICAL DATA COLLECTION
// ============================================================================

/**
 * Get aggregated historical summary across all completed projects
 */
export async function getHistoricalSummary(): Promise<HistoricalSummary> {
    // Get completed projects from TimescaleDB
    const result = await query<{
        project_id: string;
        total_credits: number;
        total_prompt_tokens: number;
        total_completion_tokens: number;
    }>(
        `SELECT 
      project_id,
      SUM(cost_credits) as total_credits,
      SUM(prompt_tokens) as total_prompt_tokens,
      SUM(completion_tokens) as total_completion_tokens
    FROM token_ledger
    GROUP BY project_id
    HAVING SUM(cost_credits) > 0
    ORDER BY total_credits DESC`
    );

    if (result.length === 0) {
        return {
            totalProjects: 0,
            averageCreditsPerProject: 0,
            medianCreditsPerProject: 0,
            averagePhaseCosts: {},
            averageAgentCosts: {},
            creditsPerComplexityTier: {},
        };
    }

    const credits: number[] = result.map((r) => Number(r.total_credits));
    const avgCredits = credits.reduce((a: number, b: number) => a + b, 0) / credits.length;
    const sortedCredits = [...credits].sort((a, b) => a - b);
    const medianCredits = sortedCredits[Math.floor(sortedCredits.length / 2)];

    // Get phase costs
    const phaseCosts = await getAveragePhaseCosts();

    // Get agent costs
    const agentCosts = await getAverageAgentCosts();

    return {
        totalProjects: result.length,
        averageCreditsPerProject: Math.round(avgCredits * 100) / 100,
        medianCreditsPerProject: Math.round(medianCredits * 100) / 100,
        averagePhaseCosts: phaseCosts,
        averageAgentCosts: agentCosts,
        creditsPerComplexityTier: await getCreditsPerComplexityTier(),
    };
}

/**
 * Get average costs per phase type
 */
async function getAveragePhaseCosts(): Promise<Record<string, number>> {
    // Use raw query to get phase usage directly from TimescaleDB
    const phaseUsages = await query<{
        phase_id: string;
        total_credits: number;
    }>(
        `SELECT 
      phase_id,
      SUM(cost_credits) as total_credits
    FROM token_ledger
    WHERE phase_id IS NOT NULL
    GROUP BY phase_id`
    );

    if (phaseUsages.length === 0) {
        return {};
    }

    // Get phase names from Prisma
    const phaseIds = phaseUsages.map((p) => p.phase_id);
    const phases = await prisma.phase.findMany({
        where: {
            id: { in: phaseIds },
            status: "COMPLETED",
        },
        select: { id: true, name: true },
    });

    const phaseNameMap = new Map(phases.map((p) => [p.id, p.name]));
    const costs: Record<string, { total: number; count: number }> = {};

    for (const usage of phaseUsages) {
        const phaseName = phaseNameMap.get(usage.phase_id);
        if (!phaseName) continue;

        const normalizedName = normalizePhaseName(phaseName);

        if (!costs[normalizedName]) {
            costs[normalizedName] = { total: 0, count: 0 };
        }
        costs[normalizedName].total += Number(usage.total_credits);
        costs[normalizedName].count += 1;
    }

    const result: Record<string, number> = {};
    for (const [name, data] of Object.entries(costs)) {
        if (data.count > 0) {
            result[name] = Math.round((data.total / data.count) * 100) / 100;
        }
    }

    return result;
}

/**
 * Get average costs per agent type
 */
async function getAverageAgentCosts(): Promise<Record<string, number>> {
    const result = await query<{
        agent_id: string;
        avg_credits: number;
        call_count: number;
    }>(
        `SELECT 
      agent_id,
      AVG(cost_credits) as avg_credits,
      COUNT(*) as call_count
    FROM token_ledger
    WHERE agent_id IS NOT NULL
    GROUP BY agent_id`
    );

    if (result.length === 0) {
        return {};
    }

    // Get agent types from Prisma
    const agentIds = result.map((r) => r.agent_id);
    const agents = await prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, type: true },
    });

    const agentTypeMap = new Map(agents.map((a) => [a.id, a.type]));
    const costs: Record<string, number> = {};

    for (const row of result) {
        const agentType = agentTypeMap.get(row.agent_id);
        if (agentType) {
            costs[agentType] = Number(row.avg_credits);
        }
    }

    return costs;
}

/**
 * Get average credits per complexity tier
 */
async function getCreditsPerComplexityTier(): Promise<Record<string, number>> {
    // For now, estimate based on project size
    // In production, this would come from stored completion data
    return {
        simple: 50,      // ~$0.50 worth
        medium: 250,     // ~$2.50 worth
        complex: 1000,   // ~$10 worth
        enterprise: 5000, // ~$50 worth
    };
}

/**
 * Get detailed historical data for a specific phase type
 */
export async function getPhaseHistoricalData(phaseName: string): Promise<PhaseHistoricalData | null> {
    // Find phases matching the name pattern
    const phases = await prisma.phase.findMany({
        where: {
            status: "COMPLETED",
            name: {
                contains: phaseName,
                mode: "insensitive",
            },
        },
        select: { id: true, name: true },
    });

    if (phases.length === 0) {
        return null;
    }

    const phaseIds = phases.map((p) => p.id);

    // Get credits for each phase from TimescaleDB
    const usages = await query<{
        phase_id: string;
        total_credits: number;
    }>(
        `SELECT 
      phase_id,
      SUM(cost_credits) as total_credits
    FROM token_ledger
    WHERE phase_id = ANY($1)
    GROUP BY phase_id`,
        [phaseIds]
    );

    const credits: number[] = usages.map((u) => Number(u.total_credits));

    if (credits.length === 0) {
        return null;
    }

    const sortedCredits = [...credits].sort((a, b) => a - b);
    const avg = credits.reduce((a: number, b: number) => a + b, 0) / credits.length;
    const median = sortedCredits[Math.floor(sortedCredits.length / 2)];
    const min = sortedCredits[0];
    const max = sortedCredits[sortedCredits.length - 1];

    // Calculate standard deviation
    const squaredDiffs = credits.map((c) => Math.pow(c - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a: number, b: number) => a + b, 0) / credits.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    return {
        phaseName: normalizePhaseName(phaseName),
        avgCredits: Math.round(avg * 100) / 100,
        medianCredits: Math.round(median * 100) / 100,
        minCredits: Math.round(min * 100) / 100,
        maxCredits: Math.round(max * 100) / 100,
        sampleSize: credits.length,
        standardDeviation: Math.round(stdDev * 100) / 100,
    };
}

/**
 * Get historical data for a specific agent type
 */
export async function getAgentHistoricalData(agentType: AgentType): Promise<AgentHistoricalData | null> {
    const agents = await prisma.agent.findMany({
        where: { type: agentType },
        select: { id: true },
    });

    if (agents.length === 0) {
        return null;
    }

    const agentIds = agents.map((a) => a.id);

    const result = await query<{
        avg_credits: number;
        avg_prompt: number;
        avg_completion: number;
        sample_size: number;
    }>(
        `SELECT 
      AVG(cost_credits) as avg_credits,
      AVG(prompt_tokens) as avg_prompt,
      AVG(completion_tokens) as avg_completion,
      COUNT(*) as sample_size
    FROM token_ledger
    WHERE agent_id = ANY($1)`,
        [agentIds]
    );

    if (result.length === 0 || Number(result[0].sample_size) === 0) {
        return null;
    }

    const row = result[0];
    return {
        agentType,
        avgCreditsPerExecution: Math.round(Number(row.avg_credits) * 100) / 100,
        avgPromptTokens: Math.round(Number(row.avg_prompt)),
        avgCompletionTokens: Math.round(Number(row.avg_completion)),
        sampleSize: Number(row.sample_size),
    };
}

/**
 * Record a project completion for future projections
 */
export async function recordProjectCompletion(
    projectId: string,
    complexityTier: "simple" | "medium" | "complex" | "enterprise",
    featureCount?: number
): Promise<ProjectCompletion> {
    // Get project usage
    const usage = await getProjectTotalUsage(projectId);

    // Get project details
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            phases: {
                select: { id: true, name: true },
            },
        },
    });

    if (!project) {
        throw new Error(`Project not found: ${projectId}`);
    }

    // Get phase breakdown from TimescaleDB
    const phaseUsages = await query<{
        phase_id: string;
        total_credits: number;
    }>(
        `SELECT 
      phase_id,
      SUM(cost_credits) as total_credits
    FROM token_ledger
    WHERE project_id = $1 AND phase_id IS NOT NULL
    GROUP BY phase_id`,
        [projectId]
    );

    // Map phase IDs to names
    const phaseNameMap = new Map(project.phases.map((p) => [p.id, p.name]));
    const phaseBreakdown: Record<string, number> = {};

    for (const usage of phaseUsages) {
        const phaseName = phaseNameMap.get(usage.phase_id);
        if (phaseName) {
            phaseBreakdown[phaseName] = Number(usage.total_credits);
        }
    }

    // Store completion record (in a real implementation, this would go to a dedicated table)
    const completion: ProjectCompletion = {
        id: `completion-${projectId}`,
        projectId,
        complexityTier,
        featureCount,
        totalTokens: usage.totalPromptTokens + usage.totalCompletionTokens,
        totalCredits: usage.totalCredits,
        phaseBreakdown,
        createdAt: new Date().toISOString(),
    };

    console.log("[HistoricalData] Recorded completion:", completion);

    return completion;
}

// ============================================================================
// HELPERS
// ============================================================================

function normalizePhaseName(name: string): string {
    // Normalize phase names for grouping
    const lower = name.toLowerCase();

    if (lower.includes("discovery") || lower.includes("planning")) {
        return "Discovery";
    }
    if (lower.includes("design") || lower.includes("architecture")) {
        return "Design";
    }
    if (lower.includes("implement") || lower.includes("build") || lower.includes("develop")) {
        return "Implementation";
    }
    if (lower.includes("test") || lower.includes("verify") || lower.includes("qa")) {
        return "Testing";
    }
    if (lower.includes("deploy") || lower.includes("release") || lower.includes("launch")) {
        return "Deployment";
    }
    if (lower.includes("security") || lower.includes("audit")) {
        return "Security";
    }

    return name;
}
