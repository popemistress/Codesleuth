/**
 * Cost Normalizer for Token Budget System
 * 
 * Converts raw token counts to normalized Credits for consistent cost comparison
 * across different AI models and providers.
 * 
 * 1 Credit = $0.001 USD (1/10th of a cent)
 * This abstraction allows for consistent budgeting regardless of model pricing changes.
 */

import type { Provider } from "@/types/tokens";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Dollars per Credit (1 Credit = $0.01, i.e., 100 credits = $1.00)
 * 
 * Examples:
 * - 125 credits = $1.25 USD
 * - 1000 credits = $10.00 USD
 * - 3000 credits = $30.00 USD
 */
export const DOLLARS_PER_CREDIT = 0.01;

/**
 * Model pricing per million tokens (in USD)
 */
interface ModelPricing {
    promptPricePerMillion: number;
    completionPricePerMillion: number;
}

/**
 * Pricing data for all supported models
 * Updated: 2026-02-05
 * 
 * Credit Mapping: ~100 credits per $1 USD
 * - Input (USD per 1M) × 100 = Input Credits per 1M
 * - Output (USD per 1M) × 100 = Output Credits per 1M
 * 
 * Note: These prices should be periodically updated as providers change pricing.
 * Consider moving to database-backed pricing for production.
 */
const MODEL_PRICING: Record<string, Record<string, ModelPricing>> = {
    openai: {
        // GPT-5 family (2026)
        "gpt-5": { promptPricePerMillion: 1.25, completionPricePerMillion: 10 },
        "gpt-5-mini": { promptPricePerMillion: 0.25, completionPricePerMillion: 2 },
        "gpt-5-nano": { promptPricePerMillion: 0.05, completionPricePerMillion: 0.4 },
        // GPT-4.1 and GPT-4o (2026)
        "gpt-4.1": { promptPricePerMillion: 3, completionPricePerMillion: 12 },
        "gpt-4o": { promptPricePerMillion: 5, completionPricePerMillion: 20 },
        "gpt-4o-mini": { promptPricePerMillion: 0.15, completionPricePerMillion: 0.6 },
        // Legacy GPT-4 models
        "gpt-4-turbo": { promptPricePerMillion: 10, completionPricePerMillion: 30 },
        "gpt-4-turbo-preview": { promptPricePerMillion: 10, completionPricePerMillion: 30 },
        "gpt-4": { promptPricePerMillion: 30, completionPricePerMillion: 60 },
        "gpt-4-32k": { promptPricePerMillion: 60, completionPricePerMillion: 120 },
        // GPT-3.5 (legacy)
        "gpt-3.5-turbo": { promptPricePerMillion: 0.5, completionPricePerMillion: 1.5 },
        "gpt-3.5-turbo-16k": { promptPricePerMillion: 3, completionPricePerMillion: 4 },
        // o1/o3 models
        "o1-preview": { promptPricePerMillion: 15, completionPricePerMillion: 60 },
        "o1-mini": { promptPricePerMillion: 3, completionPricePerMillion: 12 },
        "o3": { promptPricePerMillion: 2, completionPricePerMillion: 8 },
        "o3-mini": { promptPricePerMillion: 0.5, completionPricePerMillion: 2 },
    },
    anthropic: {
        // Claude 4.5 Opus - Most intelligent
        "claude-4.5-opus": { promptPricePerMillion: 5, completionPricePerMillion: 25 },
        "claude-4-opus": { promptPricePerMillion: 5, completionPricePerMillion: 25 },
        "claude-opus": { promptPricePerMillion: 5, completionPricePerMillion: 25 },
        // Claude 4.5 Sonnet - Optimal balance (≤200K context)
        "claude-4.5-sonnet": { promptPricePerMillion: 3, completionPricePerMillion: 15 },
        "claude-4-sonnet": { promptPricePerMillion: 3, completionPricePerMillion: 15 },
        "claude-sonnet": { promptPricePerMillion: 3, completionPricePerMillion: 15 },
        // Claude 4.5 Sonnet - Long context (>200K)
        "claude-4.5-sonnet-long": { promptPricePerMillion: 6, completionPricePerMillion: 22.5 },
        "claude-4-sonnet-long": { promptPricePerMillion: 6, completionPricePerMillion: 22.5 },
        "claude-sonnet-long": { promptPricePerMillion: 6, completionPricePerMillion: 22.5 },
        // Claude 4.5 Haiku - Fastest & cheapest
        "claude-4.5-haiku": { promptPricePerMillion: 1, completionPricePerMillion: 5 },
        "claude-4-haiku": { promptPricePerMillion: 1, completionPricePerMillion: 5 },
        "claude-haiku": { promptPricePerMillion: 1, completionPricePerMillion: 5 },
        // Legacy Claude 3.5 models
        "claude-3-5-sonnet": { promptPricePerMillion: 3, completionPricePerMillion: 15 },
        "claude-3-5-sonnet-20241022": { promptPricePerMillion: 3, completionPricePerMillion: 15 },
        "claude-3-5-haiku": { promptPricePerMillion: 1, completionPricePerMillion: 5 },
        "claude-3-5-haiku-20241022": { promptPricePerMillion: 0.8, completionPricePerMillion: 4 },
        // Legacy Claude 3 models
        "claude-3-opus": { promptPricePerMillion: 15, completionPricePerMillion: 75 },
        "claude-3-opus-20240229": { promptPricePerMillion: 15, completionPricePerMillion: 75 },
        "claude-3-sonnet": { promptPricePerMillion: 3, completionPricePerMillion: 15 },
        "claude-3-haiku": { promptPricePerMillion: 0.25, completionPricePerMillion: 1.25 },
    },
    google: {
        // Gemini 3 (2026) - Latest generation
        // Flash: Optimized for speed, 30% more token-efficient than 2.5 Pro
        "gemini-3-flash": { promptPricePerMillion: 0.5, completionPricePerMillion: 3 },
        "gemini-3.0-flash": { promptPricePerMillion: 0.5, completionPricePerMillion: 3 },
        // Pro: Advanced reasoning, ≤200K context
        "gemini-3-pro": { promptPricePerMillion: 2, completionPricePerMillion: 12 },
        "gemini-3.0-pro": { promptPricePerMillion: 2, completionPricePerMillion: 12 },
        // Pro: Long context >200K (higher pricing tier)
        "gemini-3-pro-long": { promptPricePerMillion: 4, completionPricePerMillion: 18 },
        "gemini-3.0-pro-long": { promptPricePerMillion: 4, completionPricePerMillion: 18 },
        // Gemini 2.5/2.0 (2026)
        "gemini-2.5-pro": { promptPricePerMillion: 1.25, completionPricePerMillion: 5 },
        "gemini-2.0-pro": { promptPricePerMillion: 1.25, completionPricePerMillion: 5 },
        "gemini-2.0-flash": { promptPricePerMillion: 0.08, completionPricePerMillion: 0.3 },
        // Gemini Flash Lite (cheapest)
        "gemini-flash-lite": { promptPricePerMillion: 0.08, completionPricePerMillion: 0.3 },
        // Gemini 1.5 (legacy)
        "gemini-1.5-pro": { promptPricePerMillion: 3.5, completionPricePerMillion: 10.5 },
        "gemini-1.5-flash": { promptPricePerMillion: 0.08, completionPricePerMillion: 0.3 },
        // Gemini 1.0 (legacy)
        "gemini-1.0-pro": { promptPricePerMillion: 0.5, completionPricePerMillion: 1.5 },
    },
};

/**
 * Fallback pricing for unknown models (conservative/expensive to be safe)
 * Uses Claude Sonnet tier as fallback (~$3 input, ~$15 output)
 */
const FALLBACK_PRICING: ModelPricing = {
    promptPricePerMillion: 3,
    completionPricePerMillion: 15,
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get pricing for a specific model
 */
export function getModelPricing(provider: Provider, model: string): ModelPricing {
    const providerPricing = MODEL_PRICING[provider];
    if (!providerPricing) {
        console.warn(`[CostNormalizer] Unknown provider: ${provider}, using fallback pricing`);
        return FALLBACK_PRICING;
    }

    const modelPricing = providerPricing[model];
    if (!modelPricing) {
        console.warn(`[CostNormalizer] Unknown model: ${provider}/${model}, using fallback pricing`);
        return FALLBACK_PRICING;
    }

    return modelPricing;
}

/**
 * Calculate the cost in Credits for a given token usage
 * 
 * @param provider - AI provider (anthropic, openai, google)
 * @param model - Model identifier
 * @param promptTokens - Number of prompt/input tokens
 * @param completionTokens - Number of completion/output tokens
 * @returns Cost in Credits (1 Credit = $0.001)
 */
export function calculateCredits(
    provider: Provider,
    model: string,
    promptTokens: number,
    completionTokens: number
): number {
    const pricing = getModelPricing(provider, model);

    const promptCostUSD = (promptTokens / 1_000_000) * pricing.promptPricePerMillion;
    const completionCostUSD = (completionTokens / 1_000_000) * pricing.completionPricePerMillion;
    const totalUSD = promptCostUSD + completionCostUSD;

    // Convert to Credits and round to 4 decimal places
    const credits = totalUSD / DOLLARS_PER_CREDIT;
    return Math.round(credits * 10000) / 10000;
}

/**
 * Calculate separate costs for prompt and completion tokens
 */
export function calculateDetailedCost(
    provider: Provider,
    model: string,
    promptTokens: number,
    completionTokens: number
): {
    promptCredits: number;
    completionCredits: number;
    totalCredits: number;
    promptUSD: number;
    completionUSD: number;
    totalUSD: number;
} {
    const pricing = getModelPricing(provider, model);

    const promptCostUSD = (promptTokens / 1_000_000) * pricing.promptPricePerMillion;
    const completionCostUSD = (completionTokens / 1_000_000) * pricing.completionPricePerMillion;
    const totalUSD = promptCostUSD + completionCostUSD;

    const promptCredits = promptCostUSD / DOLLARS_PER_CREDIT;
    const completionCredits = completionCostUSD / DOLLARS_PER_CREDIT;
    const totalCredits = totalUSD / DOLLARS_PER_CREDIT;

    return {
        promptCredits: Math.round(promptCredits * 10000) / 10000,
        completionCredits: Math.round(completionCredits * 10000) / 10000,
        totalCredits: Math.round(totalCredits * 10000) / 10000,
        promptUSD: Math.round(promptCostUSD * 1000000) / 1000000,
        completionUSD: Math.round(completionCostUSD * 1000000) / 1000000,
        totalUSD: Math.round(totalUSD * 1000000) / 1000000,
    };
}

/**
 * Convert Credits to USD
 */
export function creditsToUSD(credits: number): number {
    return Math.round(credits * DOLLARS_PER_CREDIT * 100) / 100;
}

/**
 * Convert USD to Credits
 */
export function usdToCredits(usd: number): number {
    return Math.round((usd / DOLLARS_PER_CREDIT) * 100) / 100;
}

/**
 * Format credits for display
 */
export function formatCredits(credits: number): string {
    if (credits < 1) {
        return credits.toFixed(4);
    }
    if (credits < 100) {
        return credits.toFixed(2);
    }
    return credits.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/**
 * Format credits as USD for display
 */
export function formatCreditsAsUSD(credits: number): string {
    const usd = creditsToUSD(credits);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(usd);
}

/**
 * Get all supported models for a provider
 */
export function getSupportedModels(provider: Provider): string[] {
    const providerPricing = MODEL_PRICING[provider];
    if (!providerPricing) {
        return [];
    }
    return Object.keys(providerPricing);
}

/**
 * Get all supported providers
 */
export function getSupportedProviders(): Provider[] {
    return Object.keys(MODEL_PRICING) as Provider[];
}

/**
 * Estimate tokens needed for a given credit budget
 */
export function estimateTokensFromCredits(
    provider: Provider,
    model: string,
    credits: number,
    promptRatio: number = 0.3 // Assume 30% prompt, 70% completion by default
): { promptTokens: number; completionTokens: number } {
    const pricing = getModelPricing(provider, model);
    const usd = creditsToUSD(credits);

    // Calculate weighted average cost per token
    const promptCostPerToken = pricing.promptPricePerMillion / 1_000_000;
    const completionCostPerToken = pricing.completionPricePerMillion / 1_000_000;

    // Solve for total tokens given the ratio
    // usd = promptTokens * promptCost + completionTokens * completionCost
    // usd = totalTokens * (promptRatio * promptCost + (1 - promptRatio) * completionCost)
    const weightedCostPerToken =
        promptRatio * promptCostPerToken + (1 - promptRatio) * completionCostPerToken;

    const totalTokens = Math.floor(usd / weightedCostPerToken);
    const promptTokens = Math.floor(totalTokens * promptRatio);
    const completionTokens = totalTokens - promptTokens;

    return { promptTokens, completionTokens };
}
