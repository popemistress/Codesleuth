/**
 * Token-Aware Agent Wrapper
 * 
 * Provides a budget-tracked wrapper for AI agent LLM calls.
 * Automatically records usage to TimescaleDB and enforces budget limits.
 * 
 * Usage:
 * ```typescript
 * const agent = new TokenAwareAgent({
 *   projectId: "my-project",
 *   agentId: "builder-agent",
 *   userId: "user-123",
 * });
 * 
 * const response = await agent.complete({
 *   provider: "anthropic",
 *   model: "claude-4.5-sonnet",
 *   prompt: "Write a function...",
 * });
 * ```
 */

import { calculateCredits } from "@/lib/tokens/cost-normalizer";
import { recordToLedger, getProjectTotalUsage } from "@/lib/timescale";
import {
    checkBudgetBeforeExecution,
    type BudgetCheckResult,
} from "@/lib/tokens/enforcement";
import { emitTokenEvent } from "@/lib/tokens/sse-emitter";
import { callLLM as callLLMClient, isProviderConfigured } from "./llm-client";
import type { Provider, EnforcementAction } from "@/types/tokens";

// ============================================================================
// TYPES
// ============================================================================

export interface AgentConfig {
    projectId: string;
    agentId?: string;
    phaseId?: string;
    userId: string;

    /** Whether to check budget before each call (default: true) */
    enforcebudget?: boolean;

    /** Whether to auto-downgrade models when budget is low (default: false) */
    autoDowngrade?: boolean;

    /** Callback when budget warning is triggered */
    onBudgetWarning?: (warning: BudgetWarning) => void;

    /** Callback when budget is exceeded */
    onBudgetExceeded?: (error: BudgetExceededError) => void;
}

export interface CompletionRequest {
    provider: Provider;
    model: string;
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;

    /** Custom request ID for idempotency */
    requestId?: string;

    /** Override phase for this specific call */
    phaseId?: string;

    /** Additional metadata to store */
    metadata?: Record<string, unknown>;
}

export interface CompletionResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    cost: {
        credits: number;
        usd: number;
    };
    model: string;
    requestId: string;
    enforcement: {
        action: EnforcementAction;
        wasDowngraded: boolean;
        originalModel?: string;
    };
}

export interface BudgetWarning {
    projectId: string;
    usedCredits: number;
    budgetCredits: number;
    percentUsed: number;
    message: string;
}

export class BudgetExceededError extends Error {
    constructor(
        public readonly projectId: string,
        public readonly usedCredits: number,
        public readonly budgetCredits: number,
        message: string
    ) {
        super(message);
        this.name = "BudgetExceededError";
    }
}

// ============================================================================
// MODEL DOWNGRADE MAP
// ============================================================================

/** Maps expensive models to cheaper alternatives */
const DOWNGRADE_MAP: Record<string, string> = {
    // Anthropic
    "claude-4.5-opus": "claude-4.5-sonnet",
    "claude-4-opus": "claude-4.5-sonnet",
    "claude-opus": "claude-sonnet",
    "claude-4.5-sonnet": "claude-4.5-haiku",
    "claude-sonnet": "claude-haiku",
    "claude-3-opus": "claude-3-sonnet",
    "claude-3-sonnet": "claude-3-haiku",

    // OpenAI
    "gpt-5": "gpt-5-mini",
    "gpt-5-mini": "gpt-5-nano",
    "gpt-4.1": "gpt-4o",
    "gpt-4o": "gpt-4o-mini",
    "gpt-4-turbo": "gpt-4o-mini",
    "gpt-4": "gpt-4o-mini",

    // Google
    "gemini-3-pro": "gemini-3-flash",
    "gemini-3-flash": "gemini-flash-lite",
    "gemini-2.5-pro": "gemini-flash-lite",
};

// ============================================================================
// TOKEN-AWARE AGENT
// ============================================================================

export class TokenAwareAgent {
    private config: Required<Omit<AgentConfig, "onBudgetWarning" | "onBudgetExceeded">> &
        Pick<AgentConfig, "onBudgetWarning" | "onBudgetExceeded">;

    private callCount = 0;

    constructor(config: AgentConfig) {
        this.config = {
            projectId: config.projectId,
            agentId: config.agentId || "default-agent",
            phaseId: config.phaseId || "",
            userId: config.userId,
            enforcebudget: config.enforcebudget ?? true,
            autoDowngrade: config.autoDowngrade ?? false,
            onBudgetWarning: config.onBudgetWarning,
            onBudgetExceeded: config.onBudgetExceeded,
        };
    }

    /**
     * Make a budget-tracked LLM completion call
     */
    async complete(request: CompletionRequest): Promise<CompletionResponse> {
        const {
            provider,
            prompt,
            systemPrompt,
            maxTokens = 4096,
            temperature = 0.7,
            phaseId,
        } = request;

        let model = request.model;
        let wasDowngraded = false;
        let originalModel: string | undefined;

        // Generate request ID if not provided
        const requestId = request.requestId || `${this.config.agentId}-${Date.now()}-${++this.callCount}`;

        // 1. PRE-FLIGHT: Check budget enforcement
        let budgetCheck: BudgetCheckResult | null = null;
        let enforcementAction: EnforcementAction = "none";

        if (this.config.enforcebudget) {
            try {
                budgetCheck = await checkBudgetBeforeExecution({
                    projectId: this.config.projectId,
                    phaseId: phaseId || this.config.phaseId || undefined,
                    agentId: this.config.agentId,
                    userId: this.config.userId,
                    provider,
                    model,
                    requestId,
                });

                enforcementAction = budgetCheck.enforcementAction;

                // Handle enforcement actions
                if (!budgetCheck.canProceed) {
                    const blockError = new BudgetExceededError(
                        this.config.projectId,
                        budgetCheck.budgetPercent,
                        100 - budgetCheck.budgetPercent,
                        budgetCheck.message || "Budget exceeded"
                    );
                    this.config.onBudgetExceeded?.(blockError);
                    throw blockError;
                }

                // Check for warning state (warn or compress triggers warning callback)
                if (enforcementAction === "warn" || enforcementAction === "compress") {
                    this.config.onBudgetWarning?.({
                        projectId: this.config.projectId,
                        usedCredits: budgetCheck.budgetPercent,
                        budgetCredits: 100,
                        percentUsed: budgetCheck.budgetPercent,
                        message: budgetCheck.message || "Budget warning",
                    });

                    // Auto-downgrade if enabled
                    if (this.config.autoDowngrade && DOWNGRADE_MAP[model]) {
                        originalModel = model;
                        model = DOWNGRADE_MAP[model];
                        wasDowngraded = true;
                        console.log(`[TokenAwareAgent] Auto-downgraded from ${originalModel} to ${model}`);
                    }
                }
            } catch (error) {
                // If project not found, proceed without enforcement
                if (error instanceof Error && error.message.includes("Project not found")) {
                    console.warn(`[TokenAwareAgent] Project not found, proceeding without enforcement`);
                } else if (error instanceof BudgetExceededError) {
                    throw error;
                } else {
                    console.error(`[TokenAwareAgent] Budget check failed:`, error);
                }
            }
        }

        // 2. MAKE THE LLM CALL
        // This is where you'd integrate with your actual LLM SDK
        const response = await this.callLLM({
            provider,
            model,
            prompt,
            systemPrompt,
            maxTokens,
            temperature,
        });

        // 3. RECORD USAGE
        const credits = calculateCredits(
            provider,
            model,
            response.usage.promptTokens,
            response.usage.completionTokens
        );

        await recordToLedger({
            projectId: this.config.projectId,
            phaseId: phaseId || this.config.phaseId || undefined,
            agentId: this.config.agentId,
            userId: this.config.userId,
            provider,
            model,
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            costCredits: credits,
            requestId,
            budgetPercentBefore: budgetCheck?.budgetPercent,
            enforcementAction: enforcementAction,
        });

        // 4. PUBLISH SSE EVENT
        await emitTokenEvent(this.config.projectId, {
            type: "token_recorded",
            data: {
                projectId: this.config.projectId,
                phaseId: phaseId || this.config.phaseId,
                agentId: this.config.agentId,
                promptTokens: response.usage.promptTokens,
                completionTokens: response.usage.completionTokens,
                costCredits: credits,
                budgetPercent: budgetCheck?.budgetPercent ?? 0,
                enforcementAction,
                timestamp: new Date().toISOString(),
            },
        });

        return {
            content: response.content,
            usage: response.usage,
            cost: {
                credits,
                usd: credits * 0.01, // 1 credit = $0.01
            },
            model,
            requestId,
            enforcement: {
                action: enforcementAction,
                wasDowngraded,
                originalModel,
            },
        };
    }

    /**
     * Get current usage for this project
     */
    async getUsage(): Promise<{
        totalCredits: number;
        totalUSD: number;
        callCount: number;
    }> {
        const usage = await getProjectTotalUsage(this.config.projectId);
        return {
            totalCredits: usage.totalCredits,
            totalUSD: usage.totalCredits * 0.01,
            callCount: usage.callCount,
        };
    }

    /**
     * Estimate credits for a prompt (rough calculation)
     */
    private estimateCredits(provider: Provider, model: string, promptLength: number): number {
        // Rough estimation: ~4 chars per token, estimate 50% completion ratio
        const estimatedPromptTokens = Math.ceil(promptLength / 4);
        const estimatedCompletionTokens = Math.ceil(estimatedPromptTokens * 0.5);

        return calculateCredits(
            provider,
            model,
            estimatedPromptTokens,
            estimatedCompletionTokens
        );
    }

    /**
     * Internal LLM call - Uses real SDKs when API keys are configured
     */
    private async callLLM(params: {
        provider: Provider;
        model: string;
        prompt: string;
        systemPrompt?: string;
        maxTokens: number;
        temperature: number;
    }): Promise<{
        content: string;
        usage: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
    }> {
        // Check if provider is configured
        if (isProviderConfigured(params.provider)) {
            // Use real LLM client
            const response = await callLLMClient({
                provider: params.provider,
                model: params.model,
                prompt: params.prompt,
                systemPrompt: params.systemPrompt,
                maxTokens: params.maxTokens,
                temperature: params.temperature,
            });
            return {
                content: response.content,
                usage: response.usage,
            };
        }

        // Fallback to mock response when API key is not configured
        console.warn(
            `[TokenAwareAgent] ${params.provider} API key not configured. Using mock response.`
        );
        const mockPromptTokens = Math.ceil(params.prompt.length / 4);
        const mockCompletionTokens = Math.ceil(mockPromptTokens * 0.6);

        return {
            content: `[MOCK RESPONSE - ${params.provider.toUpperCase()} API key not configured] ` +
                `Set ${this.getEnvVarName(params.provider)} environment variable to use real LLM.`,
            usage: {
                promptTokens: mockPromptTokens,
                completionTokens: mockCompletionTokens,
                totalTokens: mockPromptTokens + mockCompletionTokens,
            },
        };
    }

    /**
     * Get the environment variable name for a provider
     */
    private getEnvVarName(provider: Provider): string {
        switch (provider) {
            case "anthropic":
                return "ANTHROPIC_API_KEY";
            case "openai":
                return "OPENAI_API_KEY";
            case "google":
                return "GOOGLE_AI_API_KEY";
            default:
                return "UNKNOWN_API_KEY";
        }
    }
}

// ============================================================================
// CONVENIENCE FACTORY
// ============================================================================

/**
 * Create a token-aware agent for a project
 */
export function createAgent(config: AgentConfig): TokenAwareAgent {
    return new TokenAwareAgent(config);
}

/**
 * Quick one-off completion with budget tracking
 */
export async function trackedCompletion(
    projectId: string,
    userId: string,
    request: Omit<CompletionRequest, "requestId">
): Promise<CompletionResponse> {
    const agent = new TokenAwareAgent({ projectId, userId });
    return agent.complete(request);
}
