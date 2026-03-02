/**
 * Token Budget Middleware
 * 
 * Middleware that wraps agent execution to:
 * 1. Check budget status before execution
 * 2. Inject budget enforcement contracts
 * 3. Record token usage after execution
 * 4. Emit real-time events
 */

import { prisma } from "@/lib/prisma";
import { getProjectTotalUsage, recordToLedger } from "@/lib/timescale";
import { calculateCredits } from "@/lib/tokens/cost-normalizer";
import { determineEnforcementAction, shouldProceed, type ThresholdConfig } from "./thresholds";
import { generateFullContractText, getSystemConstraints } from "./contracts";
import { emitTokenEvent } from "../sse-emitter";
import type { Provider, EnforcementAction, TokenRecordedEvent, ThresholdCrossedEvent } from "@/types/tokens";

// ============================================================================
// TYPES
// ============================================================================

export interface AgentExecutionContext {
    projectId: string;
    phaseId?: string;
    agentId?: string;
    userId: string;
    provider: Provider;
    model: string;
    requestId?: string;
}

export interface AgentExecutionResult {
    promptTokens: number;
    completionTokens: number;
    response: unknown;
}

export interface BudgetCheckResult {
    canProceed: boolean;
    enforcementAction: EnforcementAction;
    contractText: string;
    systemConstraints: string[];
    budgetPercent: number;
    creditsRemaining: number;
    message: string;
}

export interface MiddlewareOptions {
    /** Whether to emit SSE events */
    emitEvents?: boolean;
    /** Custom thresholds to override project defaults */
    thresholds?: ThresholdConfig;
    /** Whether to skip recording (for dry runs) */
    skipRecording?: boolean;
    /** Override approval status */
    hasApproval?: boolean;
}

// ============================================================================
// PRE-EXECUTION CHECK
// ============================================================================

/**
 * Check budget status before agent execution
 * Returns contract text to inject into the prompt
 */
export async function checkBudgetBeforeExecution(
    context: AgentExecutionContext,
    options: MiddlewareOptions = {}
): Promise<BudgetCheckResult> {
    // Get project and budget
    const project = await prisma.project.findUnique({
        where: { id: context.projectId },
        include: { budget: true },
    });

    if (!project) {
        throw new Error(`Project not found: ${context.projectId}`);
    }

    if (!project.budget) {
        // No budget configured - allow everything
        return {
            canProceed: true,
            enforcementAction: "none",
            contractText: "",
            systemConstraints: [],
            budgetPercent: 0,
            creditsRemaining: Infinity,
            message: "No budget configured",
        };
    }

    // Get current usage from TimescaleDB
    const usage = await getProjectTotalUsage(context.projectId);

    // Build thresholds from budget or use defaults
    const thresholds: ThresholdConfig = options.thresholds ?? {
        softLimit: project.budget.softLimitPercent,
        hardLimit: project.budget.hardLimitPercent,
        criticalLimit: project.budget.criticalLimit,
    };

    // Determine enforcement action
    const decision = determineEnforcementAction(
        usage.totalCredits,
        project.budget.totalCredits,
        thresholds
    );

    // Check if we can proceed
    const canProceed = shouldProceed(decision, options.hasApproval);

    // Generate contract text and constraints
    const contractText = generateFullContractText(decision);
    const systemConstraints = getSystemConstraints(decision);

    return {
        canProceed,
        enforcementAction: decision.action,
        contractText,
        systemConstraints,
        budgetPercent: decision.percentUsed,
        creditsRemaining: decision.creditsRemaining,
        message: decision.message,
    };
}

// ============================================================================
// POST-EXECUTION RECORDING
// ============================================================================

/**
 * Record token usage after agent execution
 */
export async function recordTokensAfterExecution(
    context: AgentExecutionContext,
    result: AgentExecutionResult,
    preCheckResult: BudgetCheckResult,
    options: MiddlewareOptions = {}
): Promise<{
    id: string;
    costCredits: number;
    newBudgetPercent: number;
    thresholdCrossed: "soft" | "hard" | "critical" | null;
}> {
    // Calculate cost
    const costCredits = calculateCredits(
        context.provider,
        context.model,
        result.promptTokens,
        result.completionTokens
    );

    // Skip recording if requested
    if (options.skipRecording) {
        return {
            id: "dry-run",
            costCredits,
            newBudgetPercent: preCheckResult.budgetPercent,
            thresholdCrossed: null,
        };
    }

    // Record to ledger
    const ledgerResult = await recordToLedger({
        projectId: context.projectId,
        phaseId: context.phaseId,
        agentId: context.agentId,
        userId: context.userId,
        provider: context.provider,
        model: context.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        costCredits,
        budgetPercentBefore: preCheckResult.budgetPercent,
        enforcementAction: preCheckResult.enforcementAction,
        requestId: context.requestId,
    });

    // Update budget usage in PostgreSQL (denormalized)
    const budget = await prisma.budget.findUnique({
        where: { projectId: context.projectId },
    });

    let newBudgetPercent = preCheckResult.budgetPercent;
    let thresholdCrossed: "soft" | "hard" | "critical" | null = null;

    if (budget) {
        await prisma.budget.update({
            where: { id: budget.id },
            data: {
                usedCredits: { increment: costCredits },
                usedPromptTokens: { increment: result.promptTokens },
                usedCompletionTokens: { increment: result.completionTokens },
            },
        });

        // Calculate new percentage
        newBudgetPercent = ((budget.usedCredits + costCredits) / budget.totalCredits) * 100;

        // Check for threshold crossings
        const oldPercent = preCheckResult.budgetPercent;
        if (newBudgetPercent >= budget.criticalLimit * 100 && oldPercent < budget.criticalLimit * 100) {
            thresholdCrossed = "critical";
        } else if (newBudgetPercent >= budget.hardLimitPercent * 100 && oldPercent < budget.hardLimitPercent * 100) {
            thresholdCrossed = "hard";
        } else if (newBudgetPercent >= budget.softLimitPercent * 100 && oldPercent < budget.softLimitPercent * 100) {
            thresholdCrossed = "soft";
        }
    }

    // Emit SSE events if enabled
    if (options.emitEvents !== false) {
        // Emit token recorded event
        const recordedEvent: TokenRecordedEvent = {
            type: "token_recorded",
            data: {
                projectId: context.projectId,
                phaseId: context.phaseId,
                agentId: context.agentId,
                promptTokens: result.promptTokens,
                completionTokens: result.completionTokens,
                costCredits,
                budgetPercent: newBudgetPercent,
                enforcementAction: preCheckResult.enforcementAction,
                timestamp: new Date().toISOString(),
            },
        };
        await emitTokenEvent(context.projectId, recordedEvent);

        // Emit threshold crossed event if applicable
        if (thresholdCrossed) {
            const crossedEvent: ThresholdCrossedEvent = {
                type: "threshold_crossed",
                data: {
                    projectId: context.projectId,
                    threshold: thresholdCrossed,
                    budgetPercent: newBudgetPercent,
                    message: getThresholdMessage(thresholdCrossed, newBudgetPercent),
                },
            };
            await emitTokenEvent(context.projectId, crossedEvent);
        }
    }

    return {
        id: ledgerResult.id,
        costCredits,
        newBudgetPercent: Math.round(newBudgetPercent * 100) / 100,
        thresholdCrossed,
    };
}

// ============================================================================
// FULL MIDDLEWARE WRAPPER
// ============================================================================

/**
 * Wrap an agent execution with budget enforcement
 */
export async function withBudgetEnforcement<T>(
    context: AgentExecutionContext,
    executeFn: (contractText: string) => Promise<AgentExecutionResult & { response: T }>,
    options: MiddlewareOptions = {}
): Promise<{
    response: T;
    budgetResult: {
        costCredits: number;
        budgetPercent: number;
        enforcementAction: EnforcementAction;
        thresholdCrossed: "soft" | "hard" | "critical" | null;
    };
}> {
    // Pre-execution check
    const preCheck = await checkBudgetBeforeExecution(context, options);

    if (!preCheck.canProceed) {
        throw new BudgetEnforcementError(
            preCheck.enforcementAction,
            preCheck.message,
            preCheck.budgetPercent
        );
    }

    // Execute with contract injected
    const result = await executeFn(preCheck.contractText);

    // Post-execution recording
    const postResult = await recordTokensAfterExecution(context, result, preCheck, options);

    return {
        response: result.response,
        budgetResult: {
            costCredits: postResult.costCredits,
            budgetPercent: postResult.newBudgetPercent,
            enforcementAction: preCheck.enforcementAction,
            thresholdCrossed: postResult.thresholdCrossed,
        },
    };
}

// ============================================================================
// ERROR CLASS
// ============================================================================

export class BudgetEnforcementError extends Error {
    constructor(
        public readonly action: EnforcementAction,
        message: string,
        public readonly budgetPercent: number
    ) {
        super(message);
        this.name = "BudgetEnforcementError";
    }
}

// ============================================================================
// HELPERS
// ============================================================================

function getThresholdMessage(threshold: "soft" | "hard" | "critical", percent: number): string {
    switch (threshold) {
        case "critical":
            return `Critical budget threshold crossed (${percent.toFixed(1)}%). All operations blocked.`;
        case "hard":
            return `Hard budget limit exceeded (${percent.toFixed(1)}%). Approval required to continue.`;
        case "soft":
            return `Soft budget limit reached (${percent.toFixed(1)}%). Context compression enabled.`;
    }
}
