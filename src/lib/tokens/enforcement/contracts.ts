/**
 * Budget Enforcement Contracts
 * 
 * These contracts are injected into agent prompts to influence behavior
 * based on current budget status. They provide context-aware instructions
 * that guide agents to operate within budget constraints.
 */

import type { EnforcementAction } from "@/types/tokens";
import { type EnforcementDecision } from "./thresholds";

// ============================================================================
// CONTRACT TYPES
// ============================================================================

export interface BudgetContract {
    /** Contract type for identification */
    type: EnforcementAction;
    /** Priority level (higher = more important) */
    priority: number;
    /** Human-readable status message */
    statusMessage: string;
    /** Instructions to inject into agent prompt */
    promptInstructions: string;
    /** System-level constraints */
    systemConstraints: string[];
    /** Whether the agent should acknowledge this contract */
    requiresAcknowledgment: boolean;
}

// ============================================================================
// CONTRACT TEMPLATES
// ============================================================================

const HEALTHY_CONTRACT: BudgetContract = {
    type: "none",
    priority: 0,
    statusMessage: "Budget healthy - normal operation",
    promptInstructions: "",
    systemConstraints: [],
    requiresAcknowledgment: false,
};

const COMPRESS_CONTRACT: BudgetContract = {
    type: "compress",
    priority: 2,
    statusMessage: "Budget approaching limit - context compression enabled",
    promptInstructions: `
## BUDGET AWARENESS CONTRACT

**Status**: ⚠️ Budget at warning threshold

**Required Behaviors**:
1. **Minimize context usage**: Only include essential information in responses
2. **Prefer concise outputs**: Use bullet points over paragraphs where appropriate
3. **Avoid redundancy**: Do not repeat information already established
4. **Batch operations**: Combine multiple small operations into single actions
5. **Skip optional elaboration**: Focus on direct answers without extensive explanation

**Token Conservation Strategies**:
- Use shorter variable names in code examples
- Limit code comments to essential clarifications
- Avoid verbose error handling demonstrations
- Prefer referencing documentation over inline explanations
`,
    systemConstraints: [
        "COMPRESS_CONTEXT_ENABLED",
        "PREFER_CONCISE_RESPONSES",
        "SKIP_OPTIONAL_ELABORATION",
    ],
    requiresAcknowledgment: false,
};

const STOP_CONTRACT: BudgetContract = {
    type: "stop",
    priority: 3,
    statusMessage: "Budget exceeded - approval required to continue",
    promptInstructions: `
## BUDGET ENFORCEMENT CONTRACT - APPROVAL REQUIRED

**Status**: 🛑 Budget limit exceeded

**MANDATORY BEHAVIORS**:
1. **STOP all generative operations** until approval is received
2. **Report current status**: Summarize progress and remaining work
3. **Request explicit approval**: Ask user if they want to continue
4. **Estimate remaining cost**: Provide token/credit estimate for completion

**Required Response Format**:
Before proceeding with ANY task, you MUST:
1. State: "Budget limit reached. Approval required to continue."
2. Summarize what has been completed
3. Estimate remaining work and cost
4. Ask: "Do you want to approve additional budget to continue?"

**DO NOT** proceed with any substantive work until approval is received.
`,
    systemConstraints: [
        "REQUIRE_APPROVAL_BEFORE_PROCEEDING",
        "BLOCK_GENERATIVE_OPERATIONS",
        "REPORT_PROGRESS_ON_STOP",
    ],
    requiresAcknowledgment: true,
};

const CRITICAL_CONTRACT: BudgetContract = {
    type: "critical",
    priority: 4,
    statusMessage: "CRITICAL: Budget severely exceeded - all operations blocked",
    promptInstructions: `
## CRITICAL BUDGET ENFORCEMENT

**Status**: 🚨 CRITICAL - Operations blocked

**MANDATORY RESPONSE**:
This project has exceeded its critical budget threshold. 
All AI operations are suspended until budget is increased or reset.

**Required Response**:
"This project has reached its critical budget limit and cannot proceed.
Please contact your administrator or increase the project budget to continue."

**NO EXCEPTIONS**: Do not attempt any workarounds or continue in any capacity.
`,
    systemConstraints: [
        "HARD_BLOCK_ALL_OPERATIONS",
        "NO_WORKAROUNDS_PERMITTED",
        "REQUIRE_BUDGET_RESET",
    ],
    requiresAcknowledgment: true,
};

// ============================================================================
// CONTRACT GENERATION
// ============================================================================

/**
 * Generate a budget enforcement contract based on current enforcement decision
 */
export function generateContract(decision: EnforcementDecision): BudgetContract {
    const baseContract = getBaseContract(decision.action);

    // Customize with actual values
    return {
        ...baseContract,
        statusMessage: interpolateMessage(baseContract.statusMessage, decision),
        promptInstructions: interpolateMessage(baseContract.promptInstructions, decision),
    };
}

/**
 * Get the base contract template for an enforcement action
 */
function getBaseContract(action: EnforcementAction): BudgetContract {
    switch (action) {
        case "critical":
            return CRITICAL_CONTRACT;
        case "stop":
            return STOP_CONTRACT;
        case "compress":
        case "warn":
            return COMPRESS_CONTRACT;
        case "none":
        default:
            return HEALTHY_CONTRACT;
    }
}

/**
 * Interpolate decision values into contract messages
 */
function interpolateMessage(template: string, decision: EnforcementDecision): string {
    return template
        .replace(/\{percentUsed\}/g, decision.percentUsed.toFixed(1))
        .replace(/\{creditsRemaining\}/g, decision.creditsRemaining.toFixed(2))
        .replace(/\{status\}/g, decision.status);
}

/**
 * Generate a compact contract header for system prompts
 */
export function generateContractHeader(decision: EnforcementDecision): string {
    if (decision.action === "none") {
        return ""; // No header needed for healthy budgets
    }

    const lines = [
        `[BUDGET: ${decision.status.toUpperCase()} | ${decision.percentUsed.toFixed(1)}% used | ${decision.creditsRemaining.toFixed(0)} credits remaining]`,
    ];

    if (decision.shouldBlock) {
        lines.push("[ENFORCEMENT: BLOCKED - Approval required]");
    } else if (decision.action === "compress") {
        lines.push("[ENFORCEMENT: COMPRESS - Minimize token usage]");
    }

    return lines.join("\n");
}

/**
 * Generate full contract text for injection into agent prompts
 */
export function generateFullContractText(decision: EnforcementDecision): string {
    const contract = generateContract(decision);

    if (!contract.promptInstructions) {
        return "";
    }

    const header = generateContractHeader(decision);
    return `${header}\n\n${contract.promptInstructions}`;
}

/**
 * Check if the contract requires user acknowledgment before proceeding
 */
export function requiresAcknowledgment(decision: EnforcementDecision): boolean {
    const contract = generateContract(decision);
    return contract.requiresAcknowledgment;
}

/**
 * Get system constraints for programmatic enforcement
 */
export function getSystemConstraints(decision: EnforcementDecision): string[] {
    const contract = generateContract(decision);
    return contract.systemConstraints;
}
