// Token Budget Management System Types
// =============================================================================

// ============================================================================
// CORE TYPES
// ============================================================================

export type Provider = "anthropic" | "openai" | "google";

export type EnforcementAction =
    | "none"
    | "compress"
    | "warn"
    | "stop"
    | "critical";

export type BudgetStatus =
    | "healthy"
    | "warning"
    | "exceeded"
    | "critical";

export type ProjectStatus =
    | "ACTIVE"
    | "PAUSED"
    | "COMPLETED"
    | "ARCHIVED";

export type PhaseStatus =
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "FAILED"
    | "PAUSED";

export type AgentType =
    | "PRODUCT_DISCOVERY"
    | "TECHNICAL_DESIGN"
    | "BUILDER"
    | "SECURITY"
    | "VERIFIER"
    | "CRITIC";

export type SubscriptionTier =
    | "FREE"
    | "PREMIUM"
    | "ENTERPRISE";

// ============================================================================
// TOKEN LEDGER TYPES
// ============================================================================

export interface TokenLedgerEntry {
    id: string;
    projectId: string;
    phaseId?: string;
    agentId?: string;
    userId: string;
    provider: Provider;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costCredits: number;
    budgetPercentBefore?: number;
    enforcementAction?: EnforcementAction;
    requestId?: string;
    createdAt: string;
}

export interface RecordTokenRequest {
    projectId: string;
    phaseId?: string;
    agentId?: string;
    provider: Provider;
    model: string;
    promptTokens: number;
    completionTokens: number;
    requestId?: string;
}

export interface RecordTokenResponse {
    success: boolean;
    data: {
        id: string;
        costCredits: number;
        budgetPercent: number;
        enforcementAction: EnforcementAction;
        budgetRemaining: number;
    };
}

// ============================================================================
// BUDGET TYPES
// ============================================================================

export interface Budget {
    id: string;
    projectId: string;
    totalCredits: number;
    softLimitPercent: number;
    hardLimitPercent: number;
    criticalLimit: number;
    usedCredits: number;
    usedPromptTokens: number;
    usedCompletionTokens: number;
    createdAt: string;
    updatedAt: string;
}

export interface BudgetResponse {
    projectId: string;
    totalCredits: number;
    usedCredits: number;
    usedPercent: number;
    softLimit: number;
    hardLimit: number;
    criticalLimit: number;
    status: BudgetStatus;
    projectedCompletion?: number;
}

export interface CreateBudgetRequest {
    projectId: string;
    totalCredits: number;
    softLimitPercent?: number;
    hardLimitPercent?: number;
}

export interface UpdateBudgetRequest {
    totalCredits?: number;
    softLimitPercent?: number;
    hardLimitPercent?: number;
}

// ============================================================================
// USAGE TYPES
// ============================================================================

export interface UsageBucket {
    bucket: string;
    promptTokens: number;
    completionTokens: number;
    credits: number;
    callCount: number;
}

export interface UsageQueryParams {
    projectId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: "hour" | "day" | "phase" | "agent";
}

export interface UsageResponse {
    data: {
        totalPromptTokens: number;
        totalCompletionTokens: number;
        totalCredits: number;
        breakdown: UsageBucket[];
    };
    meta: {
        startDate: string;
        endDate: string;
        projectId?: string;
    };
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface Project {
    id: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Phase {
    id: string;
    name: string;
    description?: string;
    order: number;
    status: PhaseStatus;
    estimatedTokens?: number;
    estimatedCredits?: number;
    projectId: string;
    agentId?: string;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Agent {
    id: string;
    name: string;
    description?: string;
    type: AgentType;
    avgPromptTokens?: number;
    avgCompletionTokens?: number;
    avgCostPerExecution?: number;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// PROJECTION TYPES
// ============================================================================

export interface PhaseProjection {
    phaseId: string;
    phaseName: string;
    status: "completed" | "in_progress" | "pending";
    actualCredits?: number;
    estimatedCredits: number;
    confidence: number; // 0-1
}

export interface ProjectionResponse {
    data: {
        estimatedTotalCredits: number;
        confidenceInterval: {
            low: number;
            high: number;
        };
        phases: PhaseProjection[];
        methodology: string;
    };
}

export interface ProjectCompletion {
    id: string;
    projectId: string;
    complexityTier: "simple" | "medium" | "complex" | "enterprise";
    featureCount?: number;
    totalTokens: number;
    totalCredits: number;
    durationHours?: number;
    phaseBreakdown?: Record<string, number>;
    predictedCredits?: number;
    variancePercent?: number;
    createdAt: string;
}

// ============================================================================
// SSE EVENT TYPES
// ============================================================================

export type TokenEventType =
    | "token_recorded"
    | "threshold_crossed"
    | "phase_completed"
    | "budget_updated";

export interface TokenRecordedEvent {
    type: "token_recorded";
    data: {
        projectId: string;
        phaseId?: string;
        agentId?: string;
        promptTokens: number;
        completionTokens: number;
        costCredits: number;
        budgetPercent: number;
        enforcementAction: EnforcementAction;
        timestamp: string;
    };
}

export interface ThresholdCrossedEvent {
    type: "threshold_crossed";
    data: {
        projectId: string;
        threshold: "soft" | "hard" | "critical";
        budgetPercent: number;
        message: string;
    };
}

export interface PhaseCompletedEvent {
    type: "phase_completed";
    data: {
        projectId: string;
        phaseId: string;
        actualCredits: number;
        wasUnderBudget: boolean;
    };
}

export interface BudgetUpdatedEvent {
    type: "budget_updated";
    data: {
        projectId: string;
        totalCredits: number;
        usedCredits: number;
        usedPercent: number;
        status: BudgetStatus;
    };
}

export type TokenEvent =
    | TokenRecordedEvent
    | ThresholdCrossedEvent
    | PhaseCompletedEvent
    | BudgetUpdatedEvent;

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export interface Subscription {
    id: string;
    tier: SubscriptionTier;
    monthlyCredits: number;
    projectLimit: number;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    userId: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SubscriptionLimits {
    tier: SubscriptionTier;
    monthlyCredits: number;
    projectLimit: number;
    features: {
        realtimeDashboard: boolean;
        phaseBreakdown: boolean;
        agentAttribution: boolean;
        projections: boolean;
        export: boolean;
        apiAccess: boolean;
    };
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
    FREE: {
        tier: "FREE",
        monthlyCredits: 10000, // $10 worth
        projectLimit: 3,
        features: {
            realtimeDashboard: false,
            phaseBreakdown: false,
            agentAttribution: false,
            projections: false,
            export: false,
            apiAccess: false,
        },
    },
    PREMIUM: {
        tier: "PREMIUM",
        monthlyCredits: 100000, // $100 worth
        projectLimit: 20,
        features: {
            realtimeDashboard: true,
            phaseBreakdown: true,
            agentAttribution: true,
            projections: true,
            export: false,
            apiAccess: true,
        },
    },
    ENTERPRISE: {
        tier: "ENTERPRISE",
        monthlyCredits: 1000000, // $1000 worth
        projectLimit: -1, // Unlimited
        features: {
            realtimeDashboard: true,
            phaseBreakdown: true,
            agentAttribution: true,
            projections: true,
            export: true,
            apiAccess: true,
        },
    },
};

// ============================================================================
// API ERROR TYPES
// ============================================================================

export type TokenAPIErrorCode =
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "PROJECT_NOT_FOUND"
    | "BUDGET_NOT_FOUND"
    | "BUDGET_EXCEEDED"
    | "RATE_LIMITED"
    | "INTERNAL_ERROR";

export interface TokenAPIError {
    code: TokenAPIErrorCode;
    message: string;
    details?: Record<string, unknown>;
}
