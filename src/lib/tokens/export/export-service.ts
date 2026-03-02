/**
 * Export Service
 * 
 * Generates exportable reports in various formats (CSV, JSON, PDF-ready).
 * Enterprise feature.
 */

import { prisma } from "@/lib/prisma";
import { getUsageByProject, getUsageByTimeRange, getUsageByPhase, getUsageByAgent } from "@/lib/timescale";
import { formatCreditsAsUSD, creditsToUSD } from "@/lib/tokens/cost-normalizer";
import { checkFeatureAccess } from "../subscription";

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = "csv" | "json" | "markdown";

export interface ExportOptions {
    format: ExportFormat;
    projectId: string;
    startDate: Date;
    endDate: Date;
    includePhaseBreakdown?: boolean;
    includeAgentBreakdown?: boolean;
    includeDailyBreakdown?: boolean;
}

export interface ExportResult {
    filename: string;
    contentType: string;
    content: string;
    meta: {
        projectId: string;
        projectName: string;
        generatedAt: string;
        period: { start: string; end: string };
        totals: {
            credits: number;
            usd: string;
            promptTokens: number;
            completionTokens: number;
            callCount: number;
        };
    };
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

/**
 * Generate usage report export
 */
export async function generateExport(
    userId: string,
    options: ExportOptions
): Promise<ExportResult> {
    // Check feature access
    const access = await checkFeatureAccess(userId, "export");
    if (!access.hasAccess) {
        throw new Error(access.reason || "Export feature requires Enterprise subscription");
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
        where: { id: options.projectId },
        select: { id: true, name: true, userId: true },
    });

    if (!project || project.userId !== userId) {
        throw new Error("Project not found or access denied");
    }

    // Get usage data
    const usage = await getUsageByProject(options.projectId, options.startDate, options.endDate);

    // Get breakdowns if requested
    let phaseBreakdown: Awaited<ReturnType<typeof getUsageByPhase>> = [];
    let agentBreakdown: Awaited<ReturnType<typeof getUsageByAgent>> = [];
    let dailyBreakdown: Awaited<ReturnType<typeof getUsageByTimeRange>> = [];

    if (options.includePhaseBreakdown) {
        phaseBreakdown = await getUsageByPhase(options.projectId, options.startDate, options.endDate);
    }
    if (options.includeAgentBreakdown) {
        agentBreakdown = await getUsageByAgent(options.projectId, options.startDate, options.endDate);
    }
    if (options.includeDailyBreakdown) {
        dailyBreakdown = await getUsageByTimeRange(options.projectId, options.startDate, options.endDate, "day");
    }

    // Generate content based on format
    let content: string;
    let contentType: string;
    let extension: string;

    switch (options.format) {
        case "csv":
            content = generateCSV(usage, phaseBreakdown, agentBreakdown, dailyBreakdown);
            contentType = "text/csv";
            extension = "csv";
            break;
        case "json":
            content = generateJSON(project, usage, phaseBreakdown, agentBreakdown, dailyBreakdown, options);
            contentType = "application/json";
            extension = "json";
            break;
        case "markdown":
            content = generateMarkdown(project, usage, phaseBreakdown, agentBreakdown, dailyBreakdown, options);
            contentType = "text/markdown";
            extension = "md";
            break;
        default:
            throw new Error(`Unsupported format: ${options.format}`);
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${project.name.toLowerCase().replace(/\s+/g, "-")}-usage-${timestamp}.${extension}`;

    return {
        filename,
        contentType,
        content,
        meta: {
            projectId: project.id,
            projectName: project.name,
            generatedAt: new Date().toISOString(),
            period: {
                start: options.startDate.toISOString(),
                end: options.endDate.toISOString(),
            },
            totals: {
                credits: usage.totalCredits,
                usd: formatCreditsAsUSD(usage.totalCredits),
                promptTokens: usage.totalPromptTokens,
                completionTokens: usage.totalCompletionTokens,
                callCount: usage.callCount,
            },
        },
    };
}

// ============================================================================
// FORMAT GENERATORS
// ============================================================================

function generateCSV(
    usage: { totalCredits: number; totalPromptTokens: number; totalCompletionTokens: number; callCount: number },
    phaseBreakdown: Array<{ phaseId: string; credits: number; promptTokens: number; completionTokens: number; callCount: number }>,
    agentBreakdown: Array<{ agentId: string; credits: number; promptTokens: number; completionTokens: number; callCount: number }>,
    dailyBreakdown: Array<{ bucket: string; credits: number; promptTokens: number; completionTokens: number; callCount: number }>
): string {
    const lines: string[] = [];

    // Summary section
    lines.push("# Summary");
    lines.push("Metric,Value");
    lines.push(`Total Credits,${usage.totalCredits}`);
    lines.push(`Total USD,${creditsToUSD(usage.totalCredits)}`);
    lines.push(`Prompt Tokens,${usage.totalPromptTokens}`);
    lines.push(`Completion Tokens,${usage.totalCompletionTokens}`);
    lines.push(`Total Tokens,${usage.totalPromptTokens + usage.totalCompletionTokens}`);
    lines.push(`API Calls,${usage.callCount}`);
    lines.push("");

    // Daily breakdown
    if (dailyBreakdown.length > 0) {
        lines.push("# Daily Usage");
        lines.push("Date,Credits,Prompt Tokens,Completion Tokens,Calls");
        for (const day of dailyBreakdown) {
            lines.push(`${day.bucket.split("T")[0]},${day.credits},${day.promptTokens},${day.completionTokens},${day.callCount}`);
        }
        lines.push("");
    }

    // Phase breakdown
    if (phaseBreakdown.length > 0) {
        lines.push("# Phase Breakdown");
        lines.push("Phase ID,Credits,Prompt Tokens,Completion Tokens,Calls");
        for (const phase of phaseBreakdown) {
            lines.push(`${phase.phaseId},${phase.credits},${phase.promptTokens},${phase.completionTokens},${phase.callCount}`);
        }
        lines.push("");
    }

    // Agent breakdown
    if (agentBreakdown.length > 0) {
        lines.push("# Agent Breakdown");
        lines.push("Agent ID,Credits,Prompt Tokens,Completion Tokens,Calls");
        for (const agent of agentBreakdown) {
            lines.push(`${agent.agentId},${agent.credits},${agent.promptTokens},${agent.completionTokens},${agent.callCount}`);
        }
    }

    return lines.join("\n");
}

function generateJSON(
    project: { id: string; name: string },
    usage: { totalCredits: number; totalPromptTokens: number; totalCompletionTokens: number; callCount: number },
    phaseBreakdown: Array<{ phaseId: string; credits: number; promptTokens: number; completionTokens: number; callCount: number }>,
    agentBreakdown: Array<{ agentId: string; credits: number; promptTokens: number; completionTokens: number; callCount: number }>,
    dailyBreakdown: Array<{ bucket: string; credits: number; promptTokens: number; completionTokens: number; callCount: number }>,
    options: ExportOptions
): string {
    const data: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        project: {
            id: project.id,
            name: project.name,
        },
        period: {
            start: options.startDate.toISOString(),
            end: options.endDate.toISOString(),
        },
        summary: {
            totalCredits: usage.totalCredits,
            totalUSD: creditsToUSD(usage.totalCredits),
            promptTokens: usage.totalPromptTokens,
            completionTokens: usage.totalCompletionTokens,
            totalTokens: usage.totalPromptTokens + usage.totalCompletionTokens,
            apiCalls: usage.callCount,
        },
    };

    if (options.includeDailyBreakdown && dailyBreakdown.length > 0) {
        data.dailyUsage = dailyBreakdown.map((d) => ({
            date: d.bucket.split("T")[0],
            credits: d.credits,
            promptTokens: d.promptTokens,
            completionTokens: d.completionTokens,
            calls: d.callCount,
        }));
    }

    if (options.includePhaseBreakdown && phaseBreakdown.length > 0) {
        data.phaseBreakdown = phaseBreakdown;
    }

    if (options.includeAgentBreakdown && agentBreakdown.length > 0) {
        data.agentBreakdown = agentBreakdown;
    }

    return JSON.stringify(data, null, 2);
}

function generateMarkdown(
    project: { id: string; name: string },
    usage: { totalCredits: number; totalPromptTokens: number; totalCompletionTokens: number; callCount: number },
    phaseBreakdown: Array<{ phaseId: string; credits: number; promptTokens: number; completionTokens: number; callCount: number }>,
    agentBreakdown: Array<{ agentId: string; credits: number; promptTokens: number; completionTokens: number; callCount: number }>,
    dailyBreakdown: Array<{ bucket: string; credits: number; promptTokens: number; completionTokens: number; callCount: number }>,
    options: ExportOptions
): string {
    const lines: string[] = [];

    lines.push(`# Token Usage Report: ${project.name}`);
    lines.push("");
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push(`**Period:** ${options.startDate.toISOString().split("T")[0]} to ${options.endDate.toISOString().split("T")[0]}`);
    lines.push("");

    lines.push("## Summary");
    lines.push("");
    lines.push("| Metric | Value |");
    lines.push("|--------|-------|");
    lines.push(`| **Total Credits** | ${usage.totalCredits.toFixed(2)} |`);
    lines.push(`| **Total USD** | ${formatCreditsAsUSD(usage.totalCredits)} |`);
    lines.push(`| **Prompt Tokens** | ${usage.totalPromptTokens.toLocaleString()} |`);
    lines.push(`| **Completion Tokens** | ${usage.totalCompletionTokens.toLocaleString()} |`);
    lines.push(`| **Total Tokens** | ${(usage.totalPromptTokens + usage.totalCompletionTokens).toLocaleString()} |`);
    lines.push(`| **API Calls** | ${usage.callCount.toLocaleString()} |`);
    lines.push("");

    if (options.includeDailyBreakdown && dailyBreakdown.length > 0) {
        lines.push("## Daily Usage");
        lines.push("");
        lines.push("| Date | Credits | Prompt | Completion | Calls |");
        lines.push("|------|---------|--------|------------|-------|");
        for (const day of dailyBreakdown) {
            lines.push(`| ${day.bucket.split("T")[0]} | ${day.credits.toFixed(2)} | ${day.promptTokens.toLocaleString()} | ${day.completionTokens.toLocaleString()} | ${day.callCount} |`);
        }
        lines.push("");
    }

    if (options.includePhaseBreakdown && phaseBreakdown.length > 0) {
        lines.push("## Phase Breakdown");
        lines.push("");
        lines.push("| Phase | Credits | Prompt | Completion | Calls |");
        lines.push("|-------|---------|--------|------------|-------|");
        for (const phase of phaseBreakdown) {
            lines.push(`| ${phase.phaseId.slice(0, 8)}... | ${phase.credits.toFixed(2)} | ${phase.promptTokens.toLocaleString()} | ${phase.completionTokens.toLocaleString()} | ${phase.callCount} |`);
        }
        lines.push("");
    }

    if (options.includeAgentBreakdown && agentBreakdown.length > 0) {
        lines.push("## Agent Breakdown");
        lines.push("");
        lines.push("| Agent | Credits | Prompt | Completion | Calls |");
        lines.push("|-------|---------|--------|------------|-------|");
        for (const agent of agentBreakdown) {
            lines.push(`| ${agent.agentId.slice(0, 8)}... | ${agent.credits.toFixed(2)} | ${agent.promptTokens.toLocaleString()} | ${agent.completionTokens.toLocaleString()} | ${agent.callCount} |`);
        }
        lines.push("");
    }

    lines.push("---");
    lines.push("*Generated by CodeSleuth Token Budget Management System*");

    return lines.join("\n");
}
