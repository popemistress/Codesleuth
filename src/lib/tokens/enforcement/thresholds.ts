/**
 * Budget Thresholds & Enforcement Logic
 * 
 * Determines the appropriate enforcement action based on current budget usage.
 * This is the core decision engine for the token budget system.
 */

import type { EnforcementAction, BudgetStatus } from "@/types/tokens";

// ============================================================================
// THRESHOLD CONFIGURATION
// ============================================================================

export interface ThresholdConfig {
    /** Soft limit (default 80%) - triggers compression */
    softLimit: number;
    /** Hard limit (default 100%) - triggers stop/approval flow */
    hardLimit: number;
    /** Critical limit (default 150%) - hard stop, no override */
    criticalLimit: number;
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
    softLimit: 0.8,
    hardLimit: 1.0,
    criticalLimit: 1.5,
};

// ============================================================================
// ENFORCEMENT ACTIONS
// ============================================================================

export interface EnforcementDecision {
    action: EnforcementAction;
    status: BudgetStatus;
    percentUsed: number;
    creditsRemaining: number;
    message: string;
    shouldBlock: boolean;
    requiresApproval: boolean;
}

/**
 * Determine the enforcement action based on current usage
 */
export function determineEnforcementAction(
    usedCredits: number,
    totalCredits: number,
    thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): EnforcementDecision {
    const percentUsed = totalCredits > 0 ? usedCredits / totalCredits : 0;
    const creditsRemaining = Math.max(0, totalCredits - usedCredits);

    // Critical: Hard stop, no override possible
    if (percentUsed >= thresholds.criticalLimit) {
        return {
            action: "critical",
            status: "critical",
            percentUsed: Math.round(percentUsed * 10000) / 100,
            creditsRemaining,
            message: `CRITICAL: Budget exceeded ${Math.round(percentUsed * 100)}%. All operations blocked.`,
            shouldBlock: true,
            requiresApproval: false, // No approval possible at critical level
        };
    }

    // Hard limit: Stop and request approval
    if (percentUsed >= thresholds.hardLimit) {
        return {
            action: "stop",
            status: "exceeded",
            percentUsed: Math.round(percentUsed * 10000) / 100,
            creditsRemaining,
            message: `Budget exceeded (${Math.round(percentUsed * 100)}%). Approval required to continue.`,
            shouldBlock: true,
            requiresApproval: true,
        };
    }

    // Soft limit: Compress context and warn
    if (percentUsed >= thresholds.softLimit) {
        return {
            action: "compress",
            status: "warning",
            percentUsed: Math.round(percentUsed * 10000) / 100,
            creditsRemaining,
            message: `Budget at ${Math.round(percentUsed * 100)}%. Enabling context compression.`,
            shouldBlock: false,
            requiresApproval: false,
        };
    }

    // Below soft limit: Normal operation
    return {
        action: "none",
        status: "healthy",
        percentUsed: Math.round(percentUsed * 10000) / 100,
        creditsRemaining,
        message: `Budget healthy at ${Math.round(percentUsed * 100)}%.`,
        shouldBlock: false,
        requiresApproval: false,
    };
}

/**
 * Check if an action should proceed given the current enforcement decision
 */
export function shouldProceed(
    decision: EnforcementDecision,
    hasApproval: boolean = false
): boolean {
    if (decision.action === "critical") {
        return false; // Never proceed at critical level
    }

    if (decision.shouldBlock && !hasApproval) {
        return false; // Blocked and no approval
    }

    return true;
}

/**
 * Get the enforcement priority for sorting/comparison
 * Higher number = more severe
 */
export function getEnforcementPriority(action: EnforcementAction): number {
    switch (action) {
        case "critical":
            return 4;
        case "stop":
            return 3;
        case "compress":
            return 2;
        case "warn":
            return 1;
        case "none":
        default:
            return 0;
    }
}

/**
 * Get the most severe enforcement action from a list
 */
export function getMostSevereAction(actions: EnforcementAction[]): EnforcementAction {
    if (actions.length === 0) return "none";

    return actions.reduce((most, current) => {
        return getEnforcementPriority(current) > getEnforcementPriority(most)
            ? current
            : most;
    }, "none" as EnforcementAction);
}
