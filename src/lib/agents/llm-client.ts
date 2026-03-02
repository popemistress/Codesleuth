/**
 * LLM Client - Unified interface for multiple LLM providers
 * 
 * Supports:
 * - Anthropic (Claude models)
 * - OpenAI (GPT models)
 * - Google (Gemini models)
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import type { Provider } from "@/types/tokens";

// ============================================================================
// TYPES
// ============================================================================

export interface LLMRequest {
    provider: Provider;
    model: string;
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface LLMResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
    finishReason?: string;
}

// ============================================================================
// CLIENT SINGLETONS
// ============================================================================

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;
let googleClient: GoogleGenerativeAI | null = null;

function getAnthropicClient(): Anthropic {
    if (!anthropicClient) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error("ANTHROPIC_API_KEY environment variable is not set");
        }
        anthropicClient = new Anthropic({ apiKey });
    }
    return anthropicClient;
}

function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY environment variable is not set");
        }
        openaiClient = new OpenAI({ apiKey });
    }
    return openaiClient;
}

function getGoogleClient(): GoogleGenerativeAI {
    if (!googleClient) {
        const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_AI_API_KEY or GEMINI_API_KEY environment variable is not set");
        }
        googleClient = new GoogleGenerativeAI(apiKey);
    }
    return googleClient;
}

// ============================================================================
// PROVIDER-SPECIFIC IMPLEMENTATIONS
// ============================================================================

async function callAnthropic(request: LLMRequest): Promise<LLMResponse> {
    const client = getAnthropicClient();

    const response = await client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens || 4096,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.prompt }],
    });

    // Extract text content
    let content = "";
    for (const block of response.content) {
        if (block.type === "text") {
            content += block.text;
        }
    }

    return {
        content,
        usage: {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        finishReason: response.stop_reason || undefined,
    };
}

async function callOpenAI(request: LLMRequest): Promise<LLMResponse> {
    const client = getOpenAIClient();

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (request.systemPrompt) {
        messages.push({ role: "system", content: request.systemPrompt });
    }
    messages.push({ role: "user", content: request.prompt });

    const response = await client.chat.completions.create({
        model: request.model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.7,
        messages,
    });

    const choice = response.choices[0];

    return {
        content: choice.message.content || "",
        usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        finishReason: choice.finish_reason || undefined,
    };
}

async function callGoogle(request: LLMRequest): Promise<LLMResponse> {
    const client = getGoogleClient();

    const model: GenerativeModel = client.getGenerativeModel({
        model: request.model,
        systemInstruction: request.systemPrompt,
    });

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: request.prompt }] }],
        generationConfig: {
            maxOutputTokens: request.maxTokens || 4096,
            temperature: request.temperature || 0.7,
        },
    });

    const response = result.response;
    const content = response.text();

    // Google AI SDK provides token counts via usageMetadata
    const usageMetadata = response.usageMetadata;

    return {
        content,
        usage: {
            promptTokens: usageMetadata?.promptTokenCount || 0,
            completionTokens: usageMetadata?.candidatesTokenCount || 0,
            totalTokens: usageMetadata?.totalTokenCount || 0,
        },
        model: request.model,
        finishReason: response.candidates?.[0]?.finishReason || undefined,
    };
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Call an LLM with the specified provider and model
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
    switch (request.provider) {
        case "anthropic":
            return callAnthropic(request);
        case "openai":
            return callOpenAI(request);
        case "google":
            return callGoogle(request);
        default:
            throw new Error(`Unsupported provider: ${request.provider}`);
    }
}

/**
 * Check if a provider's API key is configured
 */
export function isProviderConfigured(provider: Provider): boolean {
    switch (provider) {
        case "anthropic":
            return !!process.env.ANTHROPIC_API_KEY;
        case "openai":
            return !!process.env.OPENAI_API_KEY;
        case "google":
            return !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);
        default:
            return false;
    }
}

/**
 * Get list of configured providers
 */
export function getConfiguredProviders(): Provider[] {
    const providers: Provider[] = [];
    if (isProviderConfigured("anthropic")) providers.push("anthropic");
    if (isProviderConfigured("openai")) providers.push("openai");
    if (isProviderConfigured("google")) providers.push("google");
    return providers;
}

/**
 * Reset client instances (useful for testing)
 */
export function resetClients(): void {
    anthropicClient = null;
    openaiClient = null;
    googleClient = null;
}
