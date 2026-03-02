/**
 * LLM Client Tests
 * 
 * Tests the unified LLM client for multiple providers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isProviderConfigured, getConfiguredProviders, resetClients } from "@/lib/agents/llm-client";

describe("LLM Client", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        resetClients();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
        resetClients();
    });

    describe("isProviderConfigured", () => {
        it("should return false when no API keys are set", () => {
            delete process.env.ANTHROPIC_API_KEY;
            delete process.env.OPENAI_API_KEY;
            delete process.env.GOOGLE_AI_API_KEY;
            delete process.env.GEMINI_API_KEY;

            expect(isProviderConfigured("anthropic")).toBe(false);
            expect(isProviderConfigured("openai")).toBe(false);
            expect(isProviderConfigured("google")).toBe(false);
        });

        it("should return true when Anthropic API key is set", () => {
            process.env.ANTHROPIC_API_KEY = "test-key";
            expect(isProviderConfigured("anthropic")).toBe(true);
        });

        it("should return true when OpenAI API key is set", () => {
            process.env.OPENAI_API_KEY = "test-key";
            expect(isProviderConfigured("openai")).toBe(true);
        });

        it("should return true when Google AI API key is set", () => {
            process.env.GOOGLE_AI_API_KEY = "test-key";
            expect(isProviderConfigured("google")).toBe(true);
        });

        it("should return true when Gemini API key is set (alias)", () => {
            process.env.GEMINI_API_KEY = "test-key";
            expect(isProviderConfigured("google")).toBe(true);
        });
    });

    describe("getConfiguredProviders", () => {
        it("should return empty array when no providers are configured", () => {
            delete process.env.ANTHROPIC_API_KEY;
            delete process.env.OPENAI_API_KEY;
            delete process.env.GOOGLE_AI_API_KEY;
            delete process.env.GEMINI_API_KEY;

            const providers = getConfiguredProviders();
            expect(providers).toEqual([]);
        });

        it("should return configured providers", () => {
            process.env.ANTHROPIC_API_KEY = "test-key";
            process.env.OPENAI_API_KEY = "test-key";

            const providers = getConfiguredProviders();
            expect(providers).toContain("anthropic");
            expect(providers).toContain("openai");
            expect(providers).not.toContain("google");
        });

        it("should return all providers when all are configured", () => {
            process.env.ANTHROPIC_API_KEY = "test-key";
            process.env.OPENAI_API_KEY = "test-key";
            process.env.GOOGLE_AI_API_KEY = "test-key";

            const providers = getConfiguredProviders();
            expect(providers).toHaveLength(3);
            expect(providers).toContain("anthropic");
            expect(providers).toContain("openai");
            expect(providers).toContain("google");
        });
    });

    describe("resetClients", () => {
        it("should reset all client instances without error", () => {
            expect(() => resetClients()).not.toThrow();
        });
    });

    // Note: Actual LLM calls would require mocking the SDKs
    // These tests focus on configuration and utility functions
});
