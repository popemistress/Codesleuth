/**
 * Token-Aware Agent Tests
 * 
 * Tests the TokenAwareAgent wrapper for budget-tracked LLM calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TokenAwareAgent, createAgent, trackedCompletion, BudgetExceededError } from "@/lib/agents";
import type { Provider } from "@/types/tokens";

// Mock the dependencies
vi.mock("@/lib/timescale", () => ({
    recordToLedger: vi.fn().mockResolvedValue({ id: "ledger-1", createdAt: new Date().toISOString() }),
    getProjectTotalUsage: vi.fn().mockResolvedValue({ totalCredits: 100, callCount: 10 }),
}));

vi.mock("@/lib/tokens/enforcement", () => ({
    checkBudgetBeforeExecution: vi.fn().mockResolvedValue({
        canProceed: true,
        enforcementAction: "none",
        contractText: "",
        systemConstraints: [],
        budgetPercent: 25,
        creditsRemaining: 750,
        message: "Budget healthy",
    }),
}));

vi.mock("@/lib/tokens/sse-emitter", () => ({
    emitTokenEvent: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM client - no API keys configured
vi.mock("@/lib/agents/llm-client", () => ({
    isProviderConfigured: vi.fn().mockReturnValue(false),
    callLLM: vi.fn(),
}));

describe("TokenAwareAgent", () => {
    let mockRecordToLedger: ReturnType<typeof vi.fn>;
    let mockCheckBudget: ReturnType<typeof vi.fn>;
    let mockEmitEvent: ReturnType<typeof vi.fn>;
    let mockGetProjectTotalUsage: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Get mocked functions
        const timescale = await import("@/lib/timescale");
        const enforcement = await import("@/lib/tokens/enforcement");
        const sse = await import("@/lib/tokens/sse-emitter");

        mockRecordToLedger = timescale.recordToLedger as ReturnType<typeof vi.fn>;
        mockGetProjectTotalUsage = timescale.getProjectTotalUsage as ReturnType<typeof vi.fn>;
        mockCheckBudget = enforcement.checkBudgetBeforeExecution as ReturnType<typeof vi.fn>;
        mockEmitEvent = sse.emitTokenEvent as ReturnType<typeof vi.fn>;

        // Re-apply default mock values
        mockGetProjectTotalUsage.mockResolvedValue({ totalCredits: 100, callCount: 10 });
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe("constructor", () => {
        it("should create agent with required config", () => {
            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
            });

            expect(agent).toBeInstanceOf(TokenAwareAgent);
        });

        it("should apply default values", () => {
            const agent = createAgent({
                projectId: "test-project",
                userId: "test-user",
            });

            expect(agent).toBeInstanceOf(TokenAwareAgent);
        });
    });

    describe("complete", () => {
        it("should make a completion and return response", async () => {
            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
                agentId: "test-agent",
            });

            const response = await agent.complete({
                provider: "anthropic",
                model: "claude-4.5-sonnet",
                prompt: "Hello, world!",
            });

            expect(response.content).toContain("MOCK RESPONSE");
            expect(response.usage.promptTokens).toBeGreaterThan(0);
            expect(response.usage.completionTokens).toBeGreaterThan(0);
            expect(response.cost.credits).toBeGreaterThan(0);
            expect(response.cost.usd).toBe(response.cost.credits * 0.01);
            expect(response.model).toBe("claude-4.5-sonnet");
            expect(response.requestId).toContain("test-agent-");
        });

        it("should record usage to ledger", async () => {
            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
                agentId: "test-agent",
                phaseId: "test-phase",
            });

            await agent.complete({
                provider: "openai",
                model: "gpt-4o",
                prompt: "Test prompt",
            });

            expect(mockRecordToLedger).toHaveBeenCalledWith(
                expect.objectContaining({
                    projectId: "test-project",
                    userId: "test-user",
                    agentId: "test-agent",
                    provider: "openai",
                    model: "gpt-4o",
                })
            );
        });

        it("should emit SSE event after completion", async () => {
            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
            });

            await agent.complete({
                provider: "anthropic",
                model: "claude-4.5-haiku",
                prompt: "Quick test",
            });

            expect(mockEmitEvent).toHaveBeenCalledWith(
                "test-project",
                expect.objectContaining({
                    type: "token_recorded",
                    data: expect.objectContaining({
                        projectId: "test-project",
                    }),
                })
            );
        });

        it("should check budget before execution when enforcebudget=true", async () => {
            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
                enforcebudget: true,
            });

            await agent.complete({
                provider: "anthropic",
                model: "claude-4.5-sonnet",
                prompt: "Test",
            });

            expect(mockCheckBudget).toHaveBeenCalled();
        });

        it("should skip budget check when enforcebudget=false", async () => {
            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
                enforcebudget: false,
            });

            await agent.complete({
                provider: "anthropic",
                model: "claude-4.5-sonnet",
                prompt: "Test",
            });

            expect(mockCheckBudget).not.toHaveBeenCalled();
        });

        it("should use custom requestId when provided", async () => {
            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
            });

            const response = await agent.complete({
                provider: "anthropic",
                model: "claude-4.5-sonnet",
                prompt: "Test",
                requestId: "custom-request-123",
            });

            expect(response.requestId).toBe("custom-request-123");
        });

        it("should override phaseId per request", async () => {
            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
                phaseId: "default-phase",
            });

            await agent.complete({
                provider: "anthropic",
                model: "claude-4.5-sonnet",
                prompt: "Test",
                phaseId: "override-phase",
            });

            expect(mockRecordToLedger).toHaveBeenCalledWith(
                expect.objectContaining({
                    phaseId: "override-phase",
                })
            );
        });
    });

    describe("budget enforcement", () => {
        it("should throw BudgetExceededError when budget is exceeded", async () => {
            mockCheckBudget.mockResolvedValueOnce({
                canProceed: false,
                enforcementAction: "stop",
                budgetPercent: 105,
                creditsRemaining: -50,
                message: "Budget exceeded",
            });

            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
                enforcebudget: true,
            });

            await expect(
                agent.complete({
                    provider: "anthropic",
                    model: "claude-4.5-opus",
                    prompt: "Expensive operation",
                })
            ).rejects.toThrow(BudgetExceededError);
        });

        it("should call onBudgetExceeded callback when budget is exceeded", async () => {
            mockCheckBudget.mockResolvedValueOnce({
                canProceed: false,
                enforcementAction: "stop",
                budgetPercent: 110,
                message: "Budget exceeded",
            });

            const onBudgetExceeded = vi.fn();
            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
                enforcebudget: true,
                onBudgetExceeded,
            });

            try {
                await agent.complete({
                    provider: "anthropic",
                    model: "claude-4.5-opus",
                    prompt: "Test",
                });
            } catch {
                // Expected to throw
            }

            expect(onBudgetExceeded).toHaveBeenCalledWith(expect.any(BudgetExceededError));
        });

        it("should call onBudgetWarning callback when budget is low", async () => {
            mockCheckBudget.mockResolvedValueOnce({
                canProceed: true,
                enforcementAction: "warn",
                budgetPercent: 85,
                creditsRemaining: 150,
                message: "Budget warning: 85% used",
            });

            const onBudgetWarning = vi.fn();
            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
                enforcebudget: true,
                onBudgetWarning,
            });

            await agent.complete({
                provider: "anthropic",
                model: "claude-4.5-sonnet",
                prompt: "Test",
            });

            expect(onBudgetWarning).toHaveBeenCalledWith(
                expect.objectContaining({
                    projectId: "test-project",
                    message: expect.stringContaining("warning"),
                })
            );
        });
    });

    describe("auto-downgrade", () => {
        it("should downgrade model when budget is low and autoDowngrade=true", async () => {
            mockCheckBudget.mockResolvedValueOnce({
                canProceed: true,
                enforcementAction: "warn",
                budgetPercent: 90,
                creditsRemaining: 100,
                message: "Budget low",
            });

            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
                enforcebudget: true,
                autoDowngrade: true,
            });

            const response = await agent.complete({
                provider: "anthropic",
                model: "claude-4.5-opus", // Expensive model
                prompt: "Test",
            });

            // Should downgrade to sonnet
            expect(response.model).toBe("claude-4.5-sonnet");
            expect(response.enforcement.wasDowngraded).toBe(true);
            expect(response.enforcement.originalModel).toBe("claude-4.5-opus");
        });

        it("should not downgrade when autoDowngrade=false", async () => {
            mockCheckBudget.mockResolvedValueOnce({
                canProceed: true,
                enforcementAction: "warn",
                budgetPercent: 90,
                creditsRemaining: 100,
                message: "Budget low",
            });

            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
                enforcebudget: true,
                autoDowngrade: false,
            });

            const response = await agent.complete({
                provider: "anthropic",
                model: "claude-4.5-opus",
                prompt: "Test",
            });

            expect(response.model).toBe("claude-4.5-opus");
            expect(response.enforcement.wasDowngraded).toBe(false);
        });
    });

    describe("getUsage", () => {
        it("should return current project usage", async () => {
            const agent = new TokenAwareAgent({
                projectId: "test-project",
                userId: "test-user",
            });

            const usage = await agent.getUsage();

            expect(usage.totalCredits).toBe(100);
            expect(usage.totalUSD).toBe(1); // 100 credits * $0.01
            expect(usage.callCount).toBe(10);
        });
    });

    describe("trackedCompletion", () => {
        it("should make a one-off tracked completion", async () => {
            const response = await trackedCompletion("test-project", "test-user", {
                provider: "google",
                model: "gemini-3-flash",
                prompt: "Quick question",
            });

            expect(response.content).toBeTruthy();
            expect(response.cost.credits).toBeGreaterThan(0);
        });
    });

    describe("provider support", () => {
        const providers: Provider[] = ["anthropic", "openai", "google"];

        providers.forEach((provider) => {
            it(`should support ${provider} provider`, async () => {
                const agent = new TokenAwareAgent({
                    projectId: "test-project",
                    userId: "test-user",
                    enforcebudget: false,
                });

                const response = await agent.complete({
                    provider,
                    model: "test-model",
                    prompt: "Test",
                });

                expect(response.content).toBeTruthy();
            });
        });
    });
});

describe("BudgetExceededError", () => {
    it("should contain correct properties", () => {
        const error = new BudgetExceededError("project-1", 1500, 1000, "Budget exceeded by 500 credits");

        expect(error.name).toBe("BudgetExceededError");
        expect(error.projectId).toBe("project-1");
        expect(error.usedCredits).toBe(1500);
        expect(error.budgetCredits).toBe(1000);
        expect(error.message).toBe("Budget exceeded by 500 credits");
    });
});
