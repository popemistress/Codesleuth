#!/usr/bin/env npx ts-node
/**
 * Token Budget Management System - Complete Feature Demo
 * 
 * This script demonstrates ALL features of the token system.
 * 
 * Usage:
 *   npx ts-node scripts/demo-token-system.ts
 * 
 * Prerequisites:
 *   - PostgreSQL running on localhost:5432
 *   - TimescaleDB running on localhost:5433
 *   - Redis running on localhost:6379
 *   - npm run dev (for API endpoints)
 */

import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = process.env.API_BASE || "http://localhost:3100";
const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET || "dev-secret-change-me";

// Prisma client for direct DB access (seeding)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// TimescaleDB pool for usage queries
const timescalePool = new Pool({ connectionString: process.env.TIMESCALE_URL });

// Demo IDs (fixed for reproducibility)
const DEMO_TIMESTAMP = Date.now();
const DEMO_USER_ID = `demo-user-${DEMO_TIMESTAMP}`;
const DEMO_PROJECT_ID = `demo-project-${DEMO_TIMESTAMP}`;

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    red: "\x1b[31m",
};

function log(message: string, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function header(title: string) {
    console.log("\n");
    log("═".repeat(60), colors.cyan);
    log(`  ${title}`, colors.bright + colors.cyan);
    log("═".repeat(60), colors.cyan);
}

function subheader(title: string) {
    log(`\n▶ ${title}`, colors.yellow);
}

function success(message: string) {
    log(`  ✅ ${message}`, colors.green);
}

function info(message: string) {
    log(`  ℹ️  ${message}`, colors.blue);
}

function warn(message: string) {
    log(`  ⚠️  ${message}`, colors.yellow);
}

function error(message: string) {
    log(`  ❌ ${message}`, colors.red);
}

// ============================================================================
// API HELPERS
// ============================================================================

import { createHmac } from "crypto";

/**
 * Generate HMAC signature for internal API authentication
 */
function signPayload(payload: string, timestamp: number): string {
    const message = `${timestamp}.${payload}`;
    const hmac = createHmac("sha256", ORCHESTRATOR_SECRET);
    hmac.update(message);
    return hmac.digest("hex");
}

/**
 * Create auth headers for internal API calls
 */
function createAuthHeaders(payload: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signPayload(payload, timestamp);
    return {
        "X-Orchestrator-Timestamp": timestamp.toString(),
        "X-Orchestrator-Signature": signature,
    };
}

async function apiCall(
    method: string,
    path: string,
    body?: object,
    headers: Record<string, string> = {}
): Promise<{ ok: boolean; status: number; data: unknown }> {
    const url = `${API_BASE}${path}`;
    const bodyStr = body ? JSON.stringify(body) : "";

    // Generate auth headers for internal API
    const authHeaders = createAuthHeaders(bodyStr);

    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
            ...headers,
        },
        body: body ? bodyStr : undefined,
    });

    const data = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data };
}

// ============================================================================
// DEMO FUNCTIONS
// ============================================================================

async function demo1_CreateProject() {
    header("DEMO 1: Create Project & Budget");

    subheader("Seeding demo user and project directly via Prisma...");

    try {
        // Create or get demo user
        let user = await prisma.user.findFirst({
            where: { email: "demo@codesleuth.dev" },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: DEMO_USER_ID,
                    email: "demo@codesleuth.dev",
                    name: "Demo User",
                },
            });
            success(`User created: ${user.id}`);
        } else {
            info(`Using existing demo user: ${user.id}`);
        }

        // Create project with specific ID
        const project = await prisma.project.create({
            data: {
                id: DEMO_PROJECT_ID,
                name: "Token System Demo Project",
                description: "A demo project to showcase all token system features",
                userId: user.id,
            },
        });
        success(`Project created: ${project.id}`);

        // Create budget
        const budget = await prisma.budget.create({
            data: {
                projectId: project.id,
                totalCredits: 100, // Small budget for demo
                usedCredits: 0,
                softLimitPercent: 0.50,   // Warn at 50%
                hardLimitPercent: 0.75,   // Critical at 75%
                criticalLimit: 1.00,      // Stop at 100%
            },
        });
        success("Budget created with 100 credits");
        info(`  Budget ID: ${budget.id}`);
        info("  Soft limit: 50%");
        info("  Hard limit: 75%");
        info("  Critical: 100%");
    } catch (err) {
        const e = err as { code?: string; message?: string };
        if (e.code === "P2002") {
            warn("Demo data already exists - continuing with existing data");
        } else {
            error(`Failed to seed demo data: ${e.message}`);
            throw err;
        }
    }
}

async function demo2_RecordTokenUsage() {
    header("DEMO 2: Record Token Usage");

    const usageRecords = [
        { phase: "discovery", agent: "discovery-agent", model: "claude-4.5-haiku", prompt: 500, completion: 200 },
        { phase: "discovery", agent: "discovery-agent", model: "claude-4.5-haiku", prompt: 800, completion: 400 },
        { phase: "design", agent: "designer-agent", model: "claude-4.5-sonnet", prompt: 1200, completion: 600 },
        { phase: "implementation", agent: "builder-agent", model: "claude-4.5-sonnet", prompt: 2000, completion: 1500 },
        { phase: "implementation", agent: "builder-agent", model: "claude-4.5-opus", prompt: 3000, completion: 2000 },
    ];

    for (const record of usageRecords) {
        subheader(`Recording ${record.agent} usage (${record.model})...`);

        const result = await apiCall("POST", "/api/v1/tokens/record", {
            projectId: DEMO_PROJECT_ID,
            phaseId: record.phase,
            agentId: record.agent,
            userId: DEMO_USER_ID,
            provider: "anthropic",
            model: record.model,
            promptTokens: record.prompt,
            completionTokens: record.completion,
            requestId: randomUUID(),
        });

        if (result.ok) {
            const resp = result.data as { success?: boolean; data?: { costCredits?: number } };
            success(`Recorded: ${record.prompt} prompt + ${record.completion} completion tokens`);
            info(`Cost: ${resp.data?.costCredits?.toFixed(4)} credits`);
        } else {
            error(`Failed to record usage: ${JSON.stringify(result.data)}`);
        }
    }
}

async function demo3_QueryUsage() {
    header("DEMO 3: Query Usage Data");

    subheader("Querying usage directly via TimescaleDB...");

    try {
        // Query TimescaleDB directly for usage data
        const result = await timescalePool.query(`
            SELECT 
                COUNT(*) as call_count,
                SUM(cost_credits) as total_credits,
                SUM(prompt_tokens) as total_prompt_tokens,
                SUM(completion_tokens) as total_completion_tokens
            FROM token_ledger
            WHERE project_id = $1
        `, [DEMO_PROJECT_ID]);

        const row = result.rows[0];
        const totalCredits = parseFloat(row.total_credits || "0");
        const totalUSD = totalCredits * 0.01; // 1 credit = $0.01

        success("Usage data retrieved:");
        info(`  Total Credits: ${totalCredits.toFixed(4)}`);
        info(`  Total USD: $${totalUSD.toFixed(4)}`);
        info(`  Total Calls: ${row.call_count}`);
        info(`  Prompt Tokens: ${row.total_prompt_tokens}`);
        info(`  Completion Tokens: ${row.total_completion_tokens}`);

        // Query by phase
        const phaseResult = await timescalePool.query(`
            SELECT phase_id, SUM(cost_credits) as credits, COUNT(*) as calls
            FROM token_ledger
            WHERE project_id = $1 AND phase_id IS NOT NULL
            GROUP BY phase_id
            ORDER BY credits DESC
        `, [DEMO_PROJECT_ID]);

        if (phaseResult.rows.length > 0) {
            info("\n  By Phase:");
            for (const row of phaseResult.rows) {
                info(`    ${row.phase_id}: ${parseFloat(row.credits).toFixed(4)} credits (${row.calls} calls)`);
            }
        }

        // Query by agent
        const agentResult = await timescalePool.query(`
            SELECT agent_id, SUM(cost_credits) as credits, COUNT(*) as calls
            FROM token_ledger
            WHERE project_id = $1 AND agent_id IS NOT NULL
            GROUP BY agent_id
            ORDER BY credits DESC
        `, [DEMO_PROJECT_ID]);

        if (agentResult.rows.length > 0) {
            info("\n  By Agent:");
            for (const row of agentResult.rows) {
                info(`    ${row.agent_id}: ${parseFloat(row.credits).toFixed(4)} credits (${row.calls} calls)`);
            }
        }

        // Query by model
        const modelResult = await timescalePool.query(`
            SELECT model, SUM(cost_credits) as credits, COUNT(*) as calls
            FROM token_ledger
            WHERE project_id = $1
            GROUP BY model
            ORDER BY credits DESC
        `, [DEMO_PROJECT_ID]);

        if (modelResult.rows.length > 0) {
            info("\n  By Model:");
            for (const row of modelResult.rows) {
                info(`    ${row.model}: ${parseFloat(row.credits).toFixed(4)} credits (${row.calls} calls)`);
            }
        }
    } catch (err) {
        error(`Failed to query usage: ${(err as Error).message}`);
    }
}

async function demo4_CheckBudget() {
    header("DEMO 4: Budget Status & Enforcement");

    subheader("Checking budget status directly via Prisma...");

    try {
        // Get budget from Prisma
        const budget = await prisma.budget.findFirst({
            where: { projectId: DEMO_PROJECT_ID },
        });

        if (!budget) {
            warn("No budget found for this project");
            return;
        }

        const totalCredits = budget.totalCredits;
        const usedCredits = budget.usedCredits;
        const remainingCredits = totalCredits - usedCredits;
        const percentUsed = (usedCredits / totalCredits) * 100;

        // Determine status
        let status = "HEALTHY";
        if (percentUsed >= budget.criticalLimit * 100) {
            status = "CRITICAL";
        } else if (percentUsed >= budget.hardLimitPercent * 100) {
            status = "HARD_LIMIT";
        } else if (percentUsed >= budget.softLimitPercent * 100) {
            status = "WARNING";
        }

        success("Budget status retrieved:");
        info(`  Total Budget: ${totalCredits} credits`);
        info(`  Used: ${usedCredits.toFixed(4)} credits`);
        info(`  Remaining: ${remainingCredits.toFixed(4)} credits`);
        info(`  Percent Used: ${percentUsed.toFixed(1)}%`);

        const statusColor =
            status === "HEALTHY" ? colors.green :
                status === "WARNING" ? colors.yellow :
                    status === "CRITICAL" || status === "HARD_LIMIT" ? colors.red : colors.reset;
        log(`  Status: ${status}`, statusColor);

        // Show thresholds
        info("\n  Thresholds:");
        info(`    Soft Limit (Warning): ${(budget.softLimitPercent * 100).toFixed(0)}%`);
        info(`    Hard Limit: ${(budget.hardLimitPercent * 100).toFixed(0)}%`);
        info(`    Critical: ${(budget.criticalLimit * 100).toFixed(0)}%`);

        // Show enforcement action that would apply
        let enforcementAction = "none";
        if (percentUsed >= budget.criticalLimit * 100) {
            enforcementAction = "stop (hard stop)";
        } else if (percentUsed >= budget.hardLimitPercent * 100) {
            enforcementAction = "compress (reduce context)";
        } else if (percentUsed >= budget.softLimitPercent * 100) {
            enforcementAction = "warn (show budget warning)";
        }
        info(`\n  Current Enforcement: ${enforcementAction}`);

    } catch (err) {
        error(`Failed to check budget: ${(err as Error).message}`);
    }
}

async function demo5_TokenAwareAgent() {
    header("DEMO 5: Token-Aware Agent (In-Process)");

    info("This demo shows how to use the TokenAwareAgent class directly.");
    info("Since we're running as a script, we'll simulate the behavior.\n");

    subheader("Example: Creating a Token-Aware Agent");
    console.log(`
${colors.cyan}const agent = new TokenAwareAgent({
  projectId: "${DEMO_PROJECT_ID}",
  userId: "${DEMO_USER_ID}",
  agentId: "demo-agent",
  phaseId: "testing",
  enforcebudget: true,
  autoDowngrade: true,
  
  onBudgetWarning: (warning) => {
    console.warn("Budget warning!", warning.percentUsed);
  },
  
  onBudgetExceeded: (error) => {
    console.error("Budget exceeded!", error.message);
  },
});

const response = await agent.complete({
  provider: "anthropic",
  model: "claude-4.5-sonnet",
  prompt: "Write a hello world function",
});

console.log(response.content);
console.log(response.cost);  // { credits: 0.45, usd: 0.0045 }
console.log(response.enforcement);  // { action: "none", wasDowngraded: false }${colors.reset}
`);

    success("TokenAwareAgent handles all tracking automatically!");
    info("  ✓ Pre-flight budget checks");
    info("  ✓ Automatic usage recording");
    info("  ✓ Real-time SSE events");
    info("  ✓ Model auto-downgrade");
}

async function demo6_ExternalAPI() {
    header("DEMO 6: External Agent API");

    subheader("Testing the agents/complete endpoint...");

    // First, let's try with orchestrator secret (internal)
    const result = await apiCall(
        "POST",
        "/api/v1/agents/complete",
        {
            projectId: DEMO_PROJECT_ID,
            provider: "anthropic",
            model: "claude-4.5-sonnet",
            prompt: "Say 'Hello from the Token System Demo!' in exactly 5 words.",
            maxTokens: 50,
            enforcebudget: true,
            autoDowngrade: false,
        },
        {
            "x-orchestrator-secret": ORCHESTRATOR_SECRET,
        }
    );

    if (result.ok) {
        const data = result.data as {
            success?: boolean;
            data?: {
                content?: string;
                usage?: { promptTokens: number; completionTokens: number };
                cost?: { credits: number; usd: number };
                model?: string;
                enforcement?: { action: string; wasDowngraded: boolean };
            };
        };
        success("API call successful!");
        info(`  Response: ${data.data?.content?.slice(0, 100)}...`);
        info(`  Tokens: ${data.data?.usage?.promptTokens} prompt, ${data.data?.usage?.completionTokens} completion`);
        info(`  Cost: ${data.data?.cost?.credits?.toFixed(4)} credits ($${data.data?.cost?.usd?.toFixed(4)})`);
        info(`  Model: ${data.data?.model}`);
        info(`  Enforcement: ${data.data?.enforcement?.action}`);
    } else {
        warn("API call returned non-OK (expected if no API keys configured)");
        info(`Status: ${result.status}`);
        info(`Response: ${JSON.stringify(result.data)}`);
    }

    subheader("Example curl command for external agents:");
    console.log(`
${colors.cyan}curl -X POST ${API_BASE}/api/v1/agents/complete \\
  -H "Authorization: Bearer cs_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectId": "${DEMO_PROJECT_ID}",
    "provider": "anthropic",
    "model": "claude-4.5-sonnet",
    "prompt": "Your prompt here",
    "enforcebudget": true,
    "autoDowngrade": true
  }'${colors.reset}
`);
}

async function demo7_Projections() {
    header("DEMO 7: Cost Projections");

    subheader("Getting project cost projection...");
    const projResult = await apiCall("GET", `/api/v1/projections/${DEMO_PROJECT_ID}`);

    if (projResult.ok) {
        const data = projResult.data as {
            estimatedTotalCredits?: number;
            confidenceInterval?: { low: number; high: number };
            overallConfidence?: number;
            phases?: Array<{ name: string; estimatedCredits: number; confidence: number }>;
            willExceedBudget?: boolean;
        };
        success("Projection retrieved:");
        info(`  Estimated Total: ${data.estimatedTotalCredits?.toFixed(2)} credits`);
        info(`  Confidence Range: ${data.confidenceInterval?.low?.toFixed(2)} - ${data.confidenceInterval?.high?.toFixed(2)}`);
        info(`  Confidence: ${((data.overallConfidence || 0) * 100).toFixed(0)}%`);

        if (data.willExceedBudget) {
            warn("  ⚠️ Project is projected to exceed budget!");
        } else {
            success("  Project within budget projection");
        }
    } else {
        warn("Projection not available (no historical data yet)");
    }

    subheader("Quick estimate for a new project...");
    const estimateResult = await apiCall("GET", "/api/v1/projections/estimate?complexity=medium&phases=5");

    if (estimateResult.ok) {
        const data = estimateResult.data as {
            estimatedCredits?: number;
            confidenceInterval?: { low: number; high: number };
            basedOn?: string;
        };
        success("Quick estimate:");
        info(`  Estimated Credits: ${data.estimatedCredits}`);
        info(`  Range: ${data.confidenceInterval?.low} - ${data.confidenceInterval?.high}`);
        info(`  Based on: ${data.basedOn}`);
    } else {
        info("Quick estimate requires historical data");
    }
}

async function demo8_SSEEvents() {
    header("DEMO 8: Real-Time SSE Events");

    info("SSE events provide real-time updates to the dashboard.\n");

    subheader("Connect to event stream:");
    console.log(`
${colors.cyan}// In browser or Node.js
const eventSource = new EventSource(
  '${API_BASE}/api/v1/events?projectId=${DEMO_PROJECT_ID}'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data);
};

// Event types:
// - connection: Initial connection established
// - token_recorded: New usage recorded
// - budget_warning: Budget threshold crossed
// - threshold_alert: Critical threshold reached
// - system: System notifications${colors.reset}
`);

    subheader("React hook usage:");
    console.log(`
${colors.cyan}import { useTokenEvents } from '@/hooks/useTokenTracking';

function Dashboard() {
  const { events, isConnected } = useTokenEvents('${DEMO_PROJECT_ID}');
  
  return (
    <div>
      <span>{isConnected ? '🟢 Connected' : '🔴 Disconnected'}</span>
      <ActivityFeed events={events} />
    </div>
  );
}${colors.reset}
`);
}

async function demo9_CostCalculation() {
    header("DEMO 9: Cost Normalization & Pricing");

    info("The system normalizes all costs to a unified credit system.\n");
    info("1 Credit = $0.01 USD\n");

    subheader("Current Model Pricing (2026):");
    console.log(`
┌─────────────────────────────────────────────────────────────────┐
│ Provider    │ Model               │ Input      │ Output        │
├─────────────────────────────────────────────────────────────────┤
│ ${colors.magenta}Anthropic${colors.reset}   │ claude-4.5-opus     │ 15.0 cr/M  │ 75.0 cr/M     │
│             │ claude-4.5-sonnet   │ 3.0 cr/M   │ 15.0 cr/M     │
│             │ claude-4.5-haiku    │ 1.0 cr/M   │ 5.0 cr/M      │
├─────────────────────────────────────────────────────────────────┤
│ ${colors.green}OpenAI${colors.reset}      │ gpt-5-turbo         │ 10.0 cr/M  │ 30.0 cr/M     │
│             │ gpt-5-mini          │ 1.5 cr/M   │ 6.0 cr/M      │
│             │ gpt-4o              │ 5.0 cr/M   │ 15.0 cr/M     │
├─────────────────────────────────────────────────────────────────┤
│ ${colors.blue}Google${colors.reset}      │ gemini-3-pro        │ 3.5 cr/M   │ 10.5 cr/M     │
│             │ gemini-3-flash      │ 0.5 cr/M   │ 1.5 cr/M      │
└─────────────────────────────────────────────────────────────────┘
`);

    subheader("Example cost calculation:");
    console.log(`
${colors.cyan}import { calculateCredits } from '@/lib/tokens/cost-normalizer';

const cost = calculateCredits(
  'anthropic',
  'claude-4.5-sonnet',
  1500,  // prompt tokens
  800    // completion tokens
);

// (1500 * 3.0 / 1_000_000) + (800 * 15.0 / 1_000_000)
// = 0.0045 + 0.012
// = 0.0165 credits ($0.000165 USD)${colors.reset}
`);
}

async function demo10_SubscriptionTiers() {
    header("DEMO 10: Subscription Tiers & Feature Access");

    console.log(`
┌─────────────────────────────────────────────────────────────────┐
│ Feature          │ FREE      │ PREMIUM   │ ENTERPRISE          │
├─────────────────────────────────────────────────────────────────┤
│ Monthly Credits  │ 100       │ 2,500     │ 25,000              │
│ Projects         │ 3         │ 25        │ Unlimited           │
│ Dashboard        │ ✅        │ ✅        │ ✅                  │
│ Phase Breakdown  │ ✅        │ ✅        │ ✅                  │
│ Projections      │ ❌        │ ✅        │ ✅                  │
│ Agent Attribution│ ❌        │ ✅        │ ✅                  │
│ API Access       │ ❌        │ ❌        │ ✅                  │
│ Data Export      │ ❌        │ ❌        │ ✅                  │
├─────────────────────────────────────────────────────────────────┤
│ Price            │ $0/mo     │ $29/mo    │ $99/mo              │
│                  │           │ $290/yr   │ $990/yr             │
└─────────────────────────────────────────────────────────────────┘
`);

    subheader("Feature gating example:");
    console.log(`
${colors.cyan}import { hasFeatureAccess } from '@/lib/tokens/subscription';

const user = await getCurrentUser();
const subscription = await getUserSubscription(user.id);

if (!hasFeatureAccess(subscription, 'projections')) {
  return <UpgradePrompt feature="projections" />;
}

// Show projections UI
return <ProjectionChart data={projectionData} />;${colors.reset}
`);
}

async function cleanup() {
    header("Cleanup");

    info("Demo complete! The following resources were created:");
    info(`  • Project ID: ${DEMO_PROJECT_ID}`);
    info(`  • User ID: ${DEMO_USER_ID}`);
    info("\n  These will persist in your database for reference.");
    info(`  Visit ${API_BASE}/dashboard/tokens to see the dashboard.`);

    // Disconnect all connections
    await prisma.$disconnect();
    await pool.end();
    await timescalePool.end();
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
    console.log(`
${colors.bright}${colors.magenta}
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🪙  TOKEN BUDGET MANAGEMENT SYSTEM - COMPLETE FEATURE DEMO  🪙  ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
${colors.reset}
`);

    info(`API Base: ${API_BASE}`);
    info(`Demo User: ${DEMO_USER_ID}`);
    info(`Demo Project: ${DEMO_PROJECT_ID}`);

    const demos = [
        { name: "Create Project & Budget", fn: demo1_CreateProject },
        { name: "Record Token Usage", fn: demo2_RecordTokenUsage },
        { name: "Query Usage Data", fn: demo3_QueryUsage },
        { name: "Budget Status & Enforcement", fn: demo4_CheckBudget },
        { name: "Token-Aware Agent", fn: demo5_TokenAwareAgent },
        { name: "External Agent API", fn: demo6_ExternalAPI },
        { name: "Cost Projections", fn: demo7_Projections },
        { name: "Real-Time SSE Events", fn: demo8_SSEEvents },
        { name: "Cost Calculation", fn: demo9_CostCalculation },
        { name: "Subscription Tiers", fn: demo10_SubscriptionTiers },
    ];

    for (const demo of demos) {
        try {
            await demo.fn();
        } catch (err) {
            error(`Demo failed: ${demo.name}`);
            error((err as Error).message);
        }

        // Small delay between demos for readability
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await cleanup();

    console.log(`
${colors.bright}${colors.green}
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║                    ✅ DEMO COMPLETE!                              ║
║                                                                   ║
║   Next steps:                                                     ║
║   1. Visit http://localhost:3000/dashboard/tokens                 ║
║   2. Set your LLM API keys in .env                                ║
║   3. Create an API key for external agents                        ║
║   4. Integrate TokenAwareAgent in your code                       ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
${colors.reset}
`);
}

// Run the demo
main().catch((err) => {
    error("Demo failed with error:");
    console.error(err);
    process.exit(1);
});
