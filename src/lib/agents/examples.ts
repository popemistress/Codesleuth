/**
 * EXAMPLES: How to use the Token-Aware Agent System
 * 
 * This file demonstrates different patterns for integrating
 * the token budget system with your AI agents.
 */

import { TokenAwareAgent, createAgent, trackedCompletion, BudgetExceededError } from "./index";
import { getConfiguredProviders } from "./llm-client";

// ============================================================================
// EXAMPLE 1: Basic Agent Usage
// ============================================================================

export async function example1_BasicUsage() {
    console.log("\n=== Example 1: Basic Agent Usage ===\n");

    // Create an agent tied to a project
    const agent = new TokenAwareAgent({
        projectId: "project-123",
        agentId: "builder-agent",
        userId: "user-456",
    });

    try {
        // Make a tracked completion
        const response = await agent.complete({
            provider: "anthropic",
            model: "claude-4.5-sonnet",
            prompt: "Write a hello world function in TypeScript",
        });

        console.log("Response:", response.content.slice(0, 100) + "...");
        console.log("Usage:", response.usage);
        console.log("Cost:", response.cost);
        console.log("Model used:", response.model);
        console.log("Was downgraded:", response.enforcement.wasDowngraded);
    } catch (error) {
        if (error instanceof BudgetExceededError) {
            console.error("Budget exceeded:", error.message);
            console.error("Used:", error.usedCredits, "/ Budget:", error.budgetCredits);
        } else {
            throw error;
        }
    }
}

// ============================================================================
// EXAMPLE 2: Agent with Budget Callbacks
// ============================================================================

export async function example2_WithCallbacks() {
    console.log("\n=== Example 2: Agent with Budget Callbacks ===\n");

    const agent = createAgent({
        projectId: "project-123",
        agentId: "analyzer-agent",
        phaseId: "phase-discovery",
        userId: "user-456",
        enforcebudget: true,
        autoDowngrade: true, // Automatically use cheaper models when budget is low

        onBudgetWarning: (warning) => {
            console.warn("⚠️ BUDGET WARNING:");
            console.warn(`  Project: ${warning.projectId}`);
            console.warn(`  Used: ${warning.usedCredits} / ${warning.budgetCredits} credits`);
            console.warn(`  Percent: ${warning.percentUsed.toFixed(1)}%`);
            // You could send a Slack notification, email, etc.
        },

        onBudgetExceeded: (error) => {
            console.error("🚫 BUDGET EXCEEDED:");
            console.error(`  Project: ${error.projectId}`);
            console.error(`  ${error.message}`);
            // You could log to monitoring, alert on-call, etc.
        },
    });

    // Make multiple calls
    for (let i = 0; i < 3; i++) {
        try {
            const response = await agent.complete({
                provider: "anthropic",
                model: "claude-4.5-opus", // Start with expensive model
                prompt: `Task ${i + 1}: Analyze this code for bugs`,
                phaseId: `phase-${i}`, // Override phase per call
            });
            console.log(`Call ${i + 1}: Used ${response.model}, cost ${response.cost.credits} credits`);
        } catch (error) {
            if (error instanceof BudgetExceededError) {
                console.log(`Call ${i + 1}: Stopped - budget exceeded`);
                break;
            }
            throw error;
        }
    }

    // Check final usage
    const usage = await agent.getUsage();
    console.log("\nFinal usage:", usage);
}

// ============================================================================
// EXAMPLE 3: Quick One-Off Completion
// ============================================================================

export async function example3_QuickCompletion() {
    console.log("\n=== Example 3: Quick One-Off Completion ===\n");

    // Use trackedCompletion for simple one-off calls
    const response = await trackedCompletion(
        "project-123",
        "user-456",
        {
            provider: "openai",
            model: "gpt-5-mini",
            prompt: "What is 2 + 2?",
        }
    );

    console.log("Answer:", response.content);
    console.log("Cost:", `${response.cost.credits} credits ($${response.cost.usd.toFixed(4)})`);
}

// ============================================================================
// EXAMPLE 4: Multi-Phase Project
// ============================================================================

export async function example4_MultiPhaseProject() {
    console.log("\n=== Example 4: Multi-Phase Project ===\n");

    const projectId = "my-ai-project";
    const userId = "developer-001";

    // Phase 1: Discovery (use cheaper model)
    const discoveryAgent = createAgent({
        projectId,
        userId,
        agentId: "discovery-agent",
        phaseId: "phase-discovery",
    });

    console.log("Phase 1: Discovery");
    await discoveryAgent.complete({
        provider: "anthropic",
        model: "claude-4.5-haiku", // Cheap model for discovery
        prompt: "Analyze the requirements for a todo app",
    });

    // Phase 2: Design (use balanced model)
    const designAgent = createAgent({
        projectId,
        userId,
        agentId: "designer-agent",
        phaseId: "phase-design",
    });

    console.log("Phase 2: Design");
    await designAgent.complete({
        provider: "anthropic",
        model: "claude-4.5-sonnet", // Balanced model for design
        prompt: "Design the architecture for a todo app",
    });

    // Phase 3: Implementation (use powerful model)
    const builderAgent = createAgent({
        projectId,
        userId,
        agentId: "builder-agent",
        phaseId: "phase-implementation",
        autoDowngrade: true, // Downgrade if budget gets tight
    });

    console.log("Phase 3: Implementation");
    const implResponse = await builderAgent.complete({
        provider: "anthropic",
        model: "claude-4.5-opus", // Most powerful for implementation
        prompt: "Implement the todo app based on the design",
    });

    console.log("Implementation completed with model:", implResponse.model);
    if (implResponse.enforcement.wasDowngraded) {
        console.log(`  (downgraded from ${implResponse.enforcement.originalModel})`);
    }

    // Check total project usage
    const projectUsage = await builderAgent.getUsage();
    console.log("\nTotal project usage:", projectUsage);
}

// ============================================================================
// EXAMPLE 5: HTTP API Usage (for external agents)
// ============================================================================

export async function example5_HttpApiUsage() {
    console.log("\n=== Example 5: HTTP API Usage ===\n");

    // This example shows how external agents would call the API
    const exampleCode = `
// External agent making HTTP call:
const response = await fetch('https://your-domain.com/api/v1/agents/complete', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer cs_your_api_key_here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    projectId: 'project-123',
    provider: 'anthropic',
    model: 'claude-4.5-sonnet',
    prompt: 'Write a sorting function',
    maxTokens: 2048,
    temperature: 0.7,
    enforcebudget: true,
    autoDowngrade: true,
  }),
});

const data = await response.json();
console.log(data);
// {
//   success: true,
//   data: {
//     content: "Here's a sorting function...",
//     usage: { promptTokens: 15, completionTokens: 150, totalTokens: 165 },
//     cost: { credits: 0.75, usd: 0.0075 },
//     model: "claude-4.5-sonnet",
//     requestId: "api-agent-1234567890",
//     enforcement: { action: "none", wasDowngraded: false }
//   }
// }
`;

    console.log("Example HTTP API usage:");
    console.log(exampleCode);
}

// ============================================================================
// EXAMPLE 6: Check Configured Providers
// ============================================================================

export async function example6_CheckProviders() {
    console.log("\n=== Example 6: Check Configured Providers ===\n");

    const providers = getConfiguredProviders();

    if (providers.length === 0) {
        console.log("⚠️ No LLM providers configured!");
        console.log("Set one of these environment variables:");
        console.log("  - ANTHROPIC_API_KEY");
        console.log("  - OPENAI_API_KEY");
        console.log("  - GOOGLE_AI_API_KEY or GEMINI_API_KEY");
    } else {
        console.log("✅ Configured providers:", providers);
    }
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

async function runExamples() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║      Token-Aware Agent Examples                          ║");
    console.log("╚══════════════════════════════════════════════════════════╝");

    // Check which providers are available
    await example6_CheckProviders();

    // Run examples (using mock responses if API keys not configured)
    await example1_BasicUsage();
    await example2_WithCallbacks();
    await example3_QuickCompletion();
    await example4_MultiPhaseProject();
    await example5_HttpApiUsage();

    console.log("\n✅ All examples completed!");
    console.log("\nTo use real LLMs, set environment variables:");
    console.log("  export ANTHROPIC_API_KEY=sk-...");
    console.log("  export OPENAI_API_KEY=sk-...");
    console.log("  export GOOGLE_AI_API_KEY=...");
}

// Run if executed directly
if (require.main === module) {
    runExamples().catch(console.error);
}
