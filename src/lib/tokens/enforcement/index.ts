/**
 * Token Budget Enforcement Module
 * 
 * Exports all enforcement-related functionality.
 */

// Threshold logic
export {
    determineEnforcementAction,
    shouldProceed,
    getEnforcementPriority,
    getMostSevereAction,
    DEFAULT_THRESHOLDS,
    type ThresholdConfig,
    type EnforcementDecision,
} from "./thresholds";

// Contracts
export {
    generateContract,
    generateContractHeader,
    generateFullContractText,
    requiresAcknowledgment,
    getSystemConstraints,
    type BudgetContract,
} from "./contracts";

// Middleware
export {
    checkBudgetBeforeExecution,
    recordTokensAfterExecution,
    withBudgetEnforcement,
    BudgetEnforcementError,
    type AgentExecutionContext,
    type AgentExecutionResult,
    type BudgetCheckResult,
    type MiddlewareOptions,
} from "./middleware";
