# Platform Architecture: Token Budget Management System

**Version**: 1.0  
**TDD Reference**: TDD-token-budget-system-v1.0.md  
**Date**: 2026-02-05  

---

## Platform Decisions

### Selected Platforms

| Platform | In Scope | Rationale |
|----------|----------|-----------|
| 🌐 Web Dashboard | ✅ Yes | Primary user interface for token management |
| 🖥️ Backend Service (API) | ✅ Yes | Core business logic and data layer |
| 📊 TimescaleDB | ✅ Yes | Time-series storage for token ledger |
| 🔌 Agent Orchestrator | ✅ Yes | New service for AI agent dispatch |
| 🪟 Windows | ❌ No | Not applicable (web-based system) |
| 🍎 macOS | ❌ No | Not applicable (web-based system) |
| 🐧 Linux Desktop | ❌ No | Not applicable (web-based system) |
| 📱 iOS | ❌ No | Not applicable (web-based system) |
| 🤖 Android | ❌ No | Not applicable (web-based system) |

### Tech Stack Decisions

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 16 (App Router) | Existing stack, SSR support |
| Backend | Next.js API Routes + Node.js | Existing stack, serverless compatible |
| Primary DB | PostgreSQL 17 (Docker) | Existing infrastructure |
| Time-Series DB | TimescaleDB (Docker) | Efficient time-range queries, continuous aggregates |
| Cache | Redis (existing) | Session, rate limiting, pub/sub for SSE |
| Auth | NextAuth.js v5 | Existing implementation with GitHub/Google OAuth |
| ORM | Prisma 7 | Existing, type-safe database access |
| Charts | Recharts | React-native, good SSR support |
| Real-time | Server-Sent Events (SSE) | Simpler than WebSocket, one-way streaming |

---

## Web Implementation

### File Structure

```
src/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── tokens/
│   │       │   ├── record/
│   │       │   │   └── route.ts           # POST - Record token usage
│   │       │   ├── usage/
│   │       │   │   └── route.ts           # GET - Usage summary
│   │       │   ├── events/
│   │       │   │   └── [projectId]/
│   │       │   │       └── route.ts       # SSE endpoint
│   │       │   └── FEATURES.md
│   │       ├── budgets/
│   │       │   ├── route.ts               # GET/POST - List/create budgets
│   │       │   ├── [projectId]/
│   │       │   │   └── route.ts           # GET/PATCH - Single budget
│   │       │   └── FEATURES.md
│   │       ├── projections/
│   │       │   ├── [projectId]/
│   │       │   │   └── route.ts           # GET - Projections
│   │       │   └── FEATURES.md
│   │       ├── projects/
│   │       │   ├── route.ts               # GET/POST - List/create projects
│   │       │   ├── [projectId]/
│   │       │   │   └── route.ts           # GET/PATCH/DELETE
│   │       │   └── FEATURES.md
│   │       └── orchestrator/
│   │           ├── execute/
│   │           │   └── route.ts           # POST - Execute agent
│   │           └── FEATURES.md
│   │
│   └── dashboard/
│       └── tokens/
│           ├── page.tsx                   # Token overview
│           ├── loading.tsx
│           ├── error.tsx
│           ├── overview/
│           │   └── page.tsx               # All projects summary
│           ├── projects/
│           │   └── [projectId]/
│           │       ├── page.tsx           # Project token dashboard
│           │       ├── phases/
│           │       │   └── page.tsx       # Phase breakdown
│           │       ├── agents/
│           │       │   └── page.tsx       # Agent attribution
│           │       └── history/
│           │           └── page.tsx       # Historical timeline
│           ├── budgets/
│           │   ├── page.tsx               # Budget configuration
│           │   └── [projectId]/
│           │       └── page.tsx           # Edit budget
│           └── reports/
│               └── page.tsx               # Export (Premium+)
│
├── components/
│   └── tokens/
│       ├── TokenOverview.tsx
│       ├── ProjectTokenDashboard.tsx
│       ├── BudgetHealthIndicator.tsx
│       ├── TokenBurnChart.tsx
│       ├── AgentAttributionPie.tsx
│       ├── PhaseProgressTimeline.tsx
│       ├── BudgetConfigForm.tsx
│       ├── ThresholdAlert.tsx
│       ├── UsageExportButton.tsx
│       ├── SSEProvider.tsx                # SSE connection manager
│       └── FEATURES.md
│
├── lib/
│   ├── tokens/
│   │   ├── ledger.ts                      # TokenLedger operations
│   │   ├── budget.ts                      # Budget enforcement logic
│   │   ├── projections.ts                 # Projection calculations
│   │   ├── cost-normalizer.ts             # Model pricing normalization
│   │   └── sse-emitter.ts                 # SSE event emission
│   ├── orchestrator/
│   │   ├── client.ts                      # Orchestrator API client
│   │   ├── middleware.ts                  # Token tracking middleware
│   │   └── contracts.ts                   # Budget enforcement contracts
│   └── timescale.ts                       # TimescaleDB client
│
├── hooks/
│   ├── useTokenUsage.ts                   # React Query hook for usage
│   ├── useBudget.ts                       # Budget data hook
│   ├── useProjections.ts                  # Projections hook
│   └── useTokenEvents.ts                  # SSE subscription hook
│
└── types/
    └── tokens.ts                          # TypeScript interfaces
```

### Key Implementation Patterns

#### SSE Connection Management

```typescript
// src/components/tokens/SSEProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface TokenEvent {
  type: "token_recorded" | "threshold_crossed" | "phase_completed";
  data: Record<string, unknown>;
}

interface SSEContextValue {
  events: TokenEvent[];
  isConnected: boolean;
  lastEvent: TokenEvent | null;
}

const SSEContext = createContext<SSEContextValue | null>(null);

export function SSEProvider({ 
  projectId, 
  children 
}: { 
  projectId: string; 
  children: ReactNode;
}) {
  const [events, setEvents] = useState<TokenEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<TokenEvent | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`/api/v1/tokens/events/${projectId}`);
    
    eventSource.onopen = () => setIsConnected(true);
    
    eventSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as TokenEvent;
      setLastEvent(parsed);
      setEvents(prev => [...prev.slice(-99), parsed]); // Keep last 100
    };
    
    eventSource.onerror = () => {
      setIsConnected(false);
      // Reconnection is automatic with EventSource
    };
    
    return () => eventSource.close();
  }, [projectId]);

  return (
    <SSEContext.Provider value={{ events, isConnected, lastEvent }}>
      {children}
    </SSEContext.Provider>
  );
}

export function useSSE() {
  const context = useContext(SSEContext);
  if (!context) throw new Error("useSSE must be used within SSEProvider");
  return context;
}
```

#### Cost Normalization

```typescript
// src/lib/tokens/cost-normalizer.ts

interface ModelPricing {
  promptPricePerMillion: number;
  completionPricePerMillion: number;
}

const MODEL_PRICING: Record<string, Record<string, ModelPricing>> = {
  anthropic: {
    "claude-3-opus-20240229": { promptPricePerMillion: 15, completionPricePerMillion: 75 },
    "claude-3-sonnet-20240229": { promptPricePerMillion: 3, completionPricePerMillion: 15 },
    "claude-3-haiku-20240307": { promptPricePerMillion: 0.25, completionPricePerMillion: 1.25 },
  },
  openai: {
    "gpt-4-turbo": { promptPricePerMillion: 10, completionPricePerMillion: 30 },
    "gpt-4o": { promptPricePerMillion: 5, completionPricePerMillion: 15 },
    "gpt-4o-mini": { promptPricePerMillion: 0.15, completionPricePerMillion: 0.6 },
  },
};

// 1 Credit = $0.001
const DOLLARS_PER_CREDIT = 0.001;

export function calculateCredits(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[provider]?.[model];
  
  if (!pricing) {
    // Fallback to expensive estimate if unknown model
    console.warn(`Unknown model: ${provider}/${model}, using fallback pricing`);
    return (promptTokens + completionTokens) * 0.01; // 10 credits per 1K tokens
  }
  
  const promptCost = (promptTokens / 1_000_000) * pricing.promptPricePerMillion;
  const completionCost = (completionTokens / 1_000_000) * pricing.completionPricePerMillion;
  const totalDollars = promptCost + completionCost;
  
  return totalDollars / DOLLARS_PER_CREDIT;
}
```

#### Budget Enforcement Middleware

```typescript
// src/lib/orchestrator/middleware.ts

import { calculateCredits } from "@/lib/tokens/cost-normalizer";
import { getBudget, recordUsage, checkThreshold } from "@/lib/tokens/budget";
import { emitTokenEvent } from "@/lib/tokens/sse-emitter";

interface ModelResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  model: string;
}

interface ExecutionContext {
  projectId: string;
  phaseId?: string;
  agentId?: string;
  userId: string;
}

export async function withTokenTracking<T extends ModelResponse>(
  provider: string,
  modelCall: () => Promise<T>,
  context: ExecutionContext
): Promise<T> {
  // 1. Pre-call: Check budget
  const budget = await getBudget(context.projectId);
  const currentPercent = budget.usedCredits / budget.totalCredits;
  
  // Check if we should stop
  if (currentPercent >= budget.criticalLimit) {
    throw new Error("BUDGET_CRITICAL: Execution blocked - critical limit exceeded");
  }
  
  if (currentPercent >= budget.hardLimitPercent) {
    throw new Error("BUDGET_EXCEEDED: Execution blocked - requires user approval");
  }
  
  // 2. Execute model call
  const response = await modelCall();
  
  // 3. Post-call: Record usage
  const credits = calculateCredits(
    provider,
    response.model,
    response.usage.prompt_tokens,
    response.usage.completion_tokens
  );
  
  const newPercent = await recordUsage({
    projectId: context.projectId,
    phaseId: context.phaseId,
    agentId: context.agentId,
    userId: context.userId,
    provider,
    model: response.model,
    promptTokens: response.usage.prompt_tokens,
    completionTokens: response.usage.completion_tokens,
    costCredits: credits,
    budgetPercentBefore: currentPercent,
    enforcementAction: currentPercent >= 0.8 ? "compress" : "none",
  });
  
  // 4. Emit SSE event
  await emitTokenEvent(context.projectId, {
    type: "token_recorded",
    data: {
      projectId: context.projectId,
      phaseId: context.phaseId,
      agentId: context.agentId,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      costCredits: credits,
      budgetPercent: newPercent,
      enforcementAction: currentPercent >= 0.8 ? "compress" : "none",
      timestamp: new Date().toISOString(),
    },
  });
  
  // 5. Check if threshold crossed
  await checkThreshold(context.projectId, currentPercent, newPercent);
  
  return response;
}
```

---

## Database Layer

### PostgreSQL (Prisma) - Relational Data

Location: `prisma/schema.prisma`

Manages:
- Users, Accounts, Sessions (Auth.js)
- Projects, Phases, Budgets (Token system)
- Agents, Subscriptions (Business logic)
- Model Pricing (Configuration)

### TimescaleDB - Time-Series Data

Location: `prisma/timescale/` (separate migration scripts)

Manages:
- TokenLedger (hypertable with daily partitions)
- UsageMetrics (continuous aggregate for hourly rollups)
- ProjectCompletions (historical data for projections)

### Connection Management

```typescript
// src/lib/timescale.ts
import { Pool } from "pg";

const timescalePool = new Pool({
  connectionString: process.env.TIMESCALE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function recordToLedger(entry: TokenLedgerEntry): Promise<void> {
  const client = await timescalePool.connect();
  try {
    await client.query(
      `INSERT INTO token_ledger 
       (project_id, phase_id, agent_id, user_id, provider, model, 
        prompt_tokens, completion_tokens, cost_credits, 
        budget_percent_before, enforcement_action, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        entry.projectId,
        entry.phaseId,
        entry.agentId,
        entry.userId,
        entry.provider,
        entry.model,
        entry.promptTokens,
        entry.completionTokens,
        entry.costCredits,
        entry.budgetPercentBefore,
        entry.enforcementAction,
        entry.requestId,
      ]
    );
  } finally {
    client.release();
  }
}

export async function getUsageByTimeRange(
  projectId: string,
  startDate: Date,
  endDate: Date,
  groupBy: "hour" | "day"
): Promise<UsageBucket[]> {
  const client = await timescalePool.connect();
  try {
    const interval = groupBy === "hour" ? "1 hour" : "1 day";
    const result = await client.query(
      `SELECT 
         time_bucket($1::interval, created_at) AS bucket,
         SUM(prompt_tokens) AS prompt_tokens,
         SUM(completion_tokens) AS completion_tokens,
         SUM(cost_credits) AS credits,
         COUNT(*) AS call_count
       FROM token_ledger
       WHERE project_id = $2 
         AND created_at >= $3 
         AND created_at <= $4
       GROUP BY bucket
       ORDER BY bucket`,
      [interval, projectId, startDate, endDate]
    );
    return result.rows;
  } finally {
    client.release();
  }
}
```

---

## Docker Compose Configuration

### Full docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    container_name: codesleuth-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: codesleuth
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: codesleuth
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U codesleuth -d codesleuth"]
      interval: 10s
      timeout: 5s
      retries: 5

  timescaledb:
    image: timescale/timescaledb:latest-pg17
    container_name: codesleuth-timescale
    restart: unless-stopped
    environment:
      POSTGRES_USER: codesleuth
      POSTGRES_PASSWORD: ${TIMESCALE_PASSWORD}
      POSTGRES_DB: codesleuth_metrics
    ports:
      - "5433:5432"
    volumes:
      - timescale_data:/var/lib/postgresql/data
      - ./prisma/timescale/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U codesleuth -d codesleuth_metrics"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: codesleuth-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  timescale_data:
  redis_data:
```

---

## Environment Variables

### Complete .env.example

```env
# =============================================================================
# DATABASE
# =============================================================================
DATABASE_URL="postgresql://codesleuth:password@localhost:5432/codesleuth?schema=public"
POSTGRES_PASSWORD="your-secure-postgres-password"

# TimescaleDB (for token ledger)
TIMESCALE_URL="postgresql://codesleuth:password@localhost:5433/codesleuth_metrics"
TIMESCALE_PASSWORD="your-secure-timescale-password"

# =============================================================================
# REDIS
# =============================================================================
REDIS_URL="redis://localhost:6379"

# =============================================================================
# AUTH (NextAuth.js)
# =============================================================================
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3100"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# =============================================================================
# AI PROVIDERS (for orchestrator)
# =============================================================================
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# =============================================================================
# ORCHESTRATOR
# =============================================================================
ORCHESTRATOR_SECRET="hmac-secret-for-internal-service-auth"

# =============================================================================
# SITE
# =============================================================================
NEXT_PUBLIC_SITE_URL="http://localhost:3100"
NEXT_PUBLIC_SITE_NAME="CodeSleuth"

# =============================================================================
# FEATURE FLAGS
# =============================================================================
FEATURE_TOKEN_DASHBOARD=true
FEATURE_PROJECTIONS=false
FEATURE_EXPORT=false
```

---

## Build & Release Process

| Stage | Command | Output |
|-------|---------|--------|
| Development | `npm run dev` | Hot-reloading on port 3100 |
| Type Check | `npm run typecheck` | TypeScript validation |
| Lint | `npm run lint` | ESLint validation |
| Build | `npm run build` | Production bundle |
| Database Push | `npm run db:push` | Prisma schema sync |
| Database Migrate | `npm run db:migrate` | Production migrations |
| TimescaleDB Init | `npm run timescale:init` | Run init.sql script |

### New Scripts (package.json additions)

```json
{
  "scripts": {
    "timescale:init": "psql $TIMESCALE_URL -f prisma/timescale/init.sql",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  }
}
```
