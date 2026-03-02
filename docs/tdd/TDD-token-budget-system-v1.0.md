# Technical Design Document: Token Budget Management System

**Version**: 1.0  
**Author**: Technical Designer AI  
**Date**: 2026-02-05  
**Status**: Draft  
**Project**: CodeSleuth AI Agent Framework  

---

## 1. Overview

### 1.1 Goal

Build a comprehensive Token Budget Management System that tracks, enforces, and visualizes AI token consumption across the CodeSleuth agent orchestration framework. The system treats tokens as a first-class resource with full observability, enabling users to see, predict, and control their AI costs through a premium dashboard experience.

### 1.2 Platform Scope

| Platform | In Scope | Priority | Implementation Phase |
|----------|----------|----------|---------------------|
| 🌐 Web Dashboard | ✅ | P0 | Phase 4-5 |
| 🖥️ Backend Service | ✅ | P0 | Phase 1-3 |
| 📊 TimescaleDB | ✅ | P0 | Phase 1 |
| 🔌 Agent Orchestrator | ✅ | P0 | Phase 2 |
| 🪟 Windows | ❌ | N/A | Out of Scope |
| 🍎 macOS | ❌ | N/A | Out of Scope |
| 🐧 Linux Desktop | ❌ | N/A | Out of Scope |
| 📱 iOS | ❌ | N/A | Out of Scope |
| 🤖 Android | ❌ | N/A | Out of Scope |

### 1.3 Non-Goals (Explicit Exclusions)

- Native desktop or mobile applications
- Direct integration with external AI provider billing systems
- Cryptocurrency or blockchain-based token systems
- Multi-tenant isolation at the database level (single-tenant for MVP)
- AI model training or fine-tuning cost tracking
- GPU compute cost tracking (tokens only)

### 1.4 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Token tracking accuracy | 100% | Ledger vs. API response match |
| Dashboard latency (p95) | <200ms | Time to first meaningful paint |
| SSE event latency | <500ms | API response to dashboard update |
| Projection accuracy | ±20% | Predicted vs. actual (after 20 projects) |
| User budget awareness | 80%+ | Users check budget before phase start |

---

## 2. Requirements Analysis

### 2.1 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Track prompt and completion tokens separately | P0 | Per-call granularity |
| FR-002 | Track cost per model (normalized to Credits) | P0 | Abstract away pricing |
| FR-003 | Enforce budgets at project, phase, and agent levels | P0 | Hierarchical limits |
| FR-004 | Soft limit (80%) triggers compression mode | P0 | Behavioral change |
| FR-005 | Hard limit (100%) stops execution with approval flow | P0 | User gate |
| FR-006 | Critical limit (150%) hard-stops unconditionally | P0 | Safety valve |
| FR-007 | Real-time dashboard with SSE updates | P0 | Live visualization |
| FR-008 | Project token projections before phase start | P1 | Estimation engine |
| FR-009 | Historical baseline tracking per workflow | P1 | Data collection |
| FR-010 | Agent-specific cost models | P1 | Per-agent curves |
| FR-011 | Export token usage reports (CSV, JSON) | P2 | Enterprise feature |
| FR-012 | Billing integration and invoice preview | P2 | Premium tier |

### 2.2 Non-Functional Requirements

| ID | Requirement | Metric | Target |
|----|-------------|--------|--------|
| NFR-001 | Response time | p95 latency | <200ms |
| NFR-002 | Concurrent projects | Scalability | 100+ active |
| NFR-003 | Data retention | Storage | 1 year minimum |
| NFR-004 | Audit trail | Compliance | Append-only ledger |
| NFR-005 | Real-time updates | Latency | <500ms via SSE |

### 2.3 Constraints

#### Technical Constraints
- Must integrate with existing Next.js 16 + Prisma 7 stack
- PostgreSQL 17 as primary database (existing Docker container)
- TimescaleDB extension required for time-series queries (new Docker container)
- Redis already available for caching (existing)
- Auth system already partially implemented (NextAuth.js v5 with GitHub/Google OAuth)

#### Business Constraints
- Tiered pricing model: Free, Premium, Enterprise
- Free tier limited visibility (project-level only)
- Premium tier full dashboard access
- Enterprise tier includes export and billing features

---

## 3. Assumptions

> ⚠️ **These assumptions must be validated before implementation begins.**

| ID | Assumption | Impact if Wrong | Validation Method |
|----|------------|-----------------|-------------------|
| A-001 | All AI model calls go through a single orchestrator service | Need multiple middleware hooks | Architecture review |
| A-002 | Model providers return token counts in response metadata | Need manual tokenization | API documentation review |
| A-003 | Users accept ~20% projection variance for new project types | Expectations management needed | User research |
| A-004 | TimescaleDB Docker image compatible with existing Postgres version | Migration complexity | Docker compose testing |
| A-005 | SSE connections scale to 100+ concurrent users | Need WebSocket fallback | Load testing |

---

## 4. System Design

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Token Budget System Architecture                       │
│                                                                                   │
│  ┌─────────────────┐     ┌──────────────────────────────────────────────────┐   │
│  │   Next.js App   │────▶│              Agent Orchestrator                   │   │
│  │  (Dashboard UI) │     │  ┌────────────────────────────────────────────┐  │   │
│  └────────┬────────┘     │  │         Token Budget Middleware            │  │   │
│           │              │  │  • Pre-call budget check                   │  │   │
│           │ SSE          │  │  • Contract injection                      │  │   │
│           │              │  │  • Post-call usage extraction              │  │   │
│           │              │  │  • Threshold enforcement                   │  │   │
│           │              │  └──────────────────┬─────────────────────────┘  │   │
│           │              └───────────────────────────────────────────────────┘   │
│           │                                     │                                │
│           │                                     │ Record Usage                   │
│           │                                     ▼                                │
│  ┌────────▼────────┐     ┌──────────────────────────────────────────────────┐   │
│  │   SSE Service   │◀────│                Token Ledger API                   │   │
│  │  (Real-time     │     │  • POST /api/v1/tokens/record                    │   │
│  │   Events)       │     │  • GET  /api/v1/tokens/usage                     │   │
│  └─────────────────┘     │  • GET  /api/v1/tokens/projections               │   │
│                          │  • GET  /api/v1/budgets                          │   │
│                          │  • POST /api/v1/budgets                          │   │
│                          └────────────────────┬─────────────────────────────┘   │
│                                               │                                  │
│                                               ▼                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                              Data Layer                                    │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐   │  │
│  │  │   PostgreSQL    │  │   TimescaleDB   │  │        Redis            │   │  │
│  │  │   (Prisma)      │  │  (Hypertables)  │  │   (Cache + Pub/Sub)     │   │  │
│  │  │                 │  │                 │  │                         │   │  │
│  │  │  • Users        │  │  • TokenLedger  │  │  • Current project      │   │  │
│  │  │  • Projects     │  │  • UsageMetrics │  │    state                │   │  │
│  │  │  • Budgets      │  │  • Projections  │  │  • SSE channels         │   │  │
│  │  │  • Agents       │  │                 │  │  • Rate limiting        │   │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Breakdown

#### 4.2.1 Agent Orchestrator (New)

The orchestrator is the central dispatch system for all AI agent executions. It:
- Receives execution requests from the application
- Loads budget configuration and current usage
- Injects Budget Enforcement Contracts into agent prompts
- Dispatches to appropriate AI model APIs
- Extracts usage metadata from responses
- Records to TokenLedger
- Emits SSE events for dashboard updates

#### 4.2.2 Token Budget Middleware

A middleware layer that wraps all model API calls:
- **Pre-call**: Check budget availability, inject compression instructions if needed
- **Post-call**: Extract usage from response headers/body, calculate cost
- **Enforcement**: Trigger warnings, stops, or hard limits based on thresholds

#### 4.2.3 Token Ledger

Append-only time-series data store using TimescaleDB:
- Records every token transaction with full context
- Enables efficient time-range queries (burn rate, trends)
- Provides audit trail for billing and debugging

#### 4.2.4 SSE Service

Real-time event broadcasting using Server-Sent Events:
- Project-specific channels for targeted updates
- Efficient one-way streaming (lower overhead than WebSocket)
- Graceful reconnection handling

### 4.3 Data Flow

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              Complete Data Flow                                 │
│                                                                                 │
│  1. User triggers agent execution from application                              │
│                           │                                                     │
│                           ▼                                                     │
│  2. Orchestrator reads budget config + current usage from DB                    │
│                           │                                                     │
│                           ▼                                                     │
│  3. Check against thresholds:                                                   │
│     • <80%: Proceed normally                                                    │
│     • 80-100%: Inject compression contract                                      │
│     • 100-150%: Require user approval                                           │
│     • >150%: Hard stop                                                          │
│                           │                                                     │
│                           ▼                                                     │
│  4. Orchestrator injects Budget Enforcement Contract into prompt                │
│                           │                                                     │
│                           ▼                                                     │
│  5. Agent executes against AI model API (Claude, GPT, etc.)                     │
│                           │                                                     │
│                           ▼                                                     │
│  6. Model returns response with usage metadata                                  │
│     (prompt_tokens, completion_tokens, model_id)                                │
│                           │                                                     │
│                           ▼                                                     │
│  7. Middleware extracts usage, calculates cost, writes to TokenLedger           │
│                           │                                                     │
│                           ▼                                                     │
│  8. Middleware emits SSE event with usage data                                  │
│                           │                                                     │
│                           ▼                                                     │
│  9. Dashboard receives event, updates visualizations in real-time               │
│                           │                                                     │
│                           ▼                                                     │
│  10. User sees immediate feedback in dashboard and agent response               │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Model

### 5.1 Entity Relationship Diagram

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              Entity Relationships                              │
│                                                                                │
│  ┌──────────┐ 1:N ┌───────────┐ 1:N ┌───────────┐ 1:N ┌────────────────┐     │
│  │   User   │────▶│  Project  │────▶│   Phase   │────▶│  TokenLedger   │     │
│  └──────────┘     └───────────┘     └───────────┘     │  (TimescaleDB) │     │
│       │                 │                 │            └────────────────┘     │
│       │                 │                 │                    │              │
│       │                 ▼                 ▼                    │              │
│       │           ┌───────────┐     ┌───────────┐              │              │
│       │           │  Budget   │     │   Agent   │◀─────────────┘              │
│       │           │ (Project) │     │           │                             │
│       │           └───────────┘     └───────────┘                             │
│       │                                                                        │
│       ▼                                                                        │
│  ┌──────────────┐                                                             │
│  │ Subscription │                                                             │
│  │   (Tier)     │                                                             │
│  └──────────────┘                                                             │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Prisma Schema Extensions (PostgreSQL)

```prisma
// Add to existing prisma/schema.prisma

// ============================================================================
// TOKEN BUDGET MANAGEMENT MODELS
// ============================================================================

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  status      ProjectStatus @default(ACTIVE)
  
  // Relations
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phases      Phase[]
  budget      Budget?
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])
  @@index([status])
}

model Phase {
  id          String   @id @default(cuid())
  name        String
  description String?
  order       Int
  status      PhaseStatus @default(PENDING)
  
  // Budget tracking
  estimatedTokens   Int?
  estimatedCredits  Float?
  
  // Relations
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agentId     String?
  agent       Agent?   @relation(fields: [agentId], references: [id])
  
  // Metadata
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([projectId])
  @@index([status])
}

model Agent {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  type        AgentType
  
  // Cost model (historical averages)
  avgPromptTokens     Int?
  avgCompletionTokens Int?
  avgCostPerExecution Float?
  
  // Relations
  phases      Phase[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Budget {
  id          String   @id @default(cuid())
  
  // Limits (in Credits, 1 Credit = $0.001)
  totalCredits      Float
  softLimitPercent  Float    @default(0.80)  // 80%
  hardLimitPercent  Float    @default(1.00)  // 100%
  criticalLimit     Float    @default(1.50)  // 150%
  
  // Current usage (denormalized for fast reads)
  usedCredits       Float    @default(0)
  usedPromptTokens  Int      @default(0)
  usedCompletionTokens Int   @default(0)
  
  // Relations
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ModelPricing {
  id          String   @id @default(cuid())
  provider    String   // "anthropic", "openai", "google"
  model       String   // "claude-3-opus", "gpt-4-turbo", etc.
  
  // Pricing per 1M tokens (in USD)
  promptPrice      Float
  completionPrice  Float
  
  // Active status
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([provider, model])
}

model Subscription {
  id          String   @id @default(cuid())
  tier        SubscriptionTier @default(FREE)
  
  // Limits per tier
  monthlyCredits    Float
  projectLimit      Int
  
  // Billing
  stripeCustomerId  String?
  stripeSubscriptionId String?
  
  // Relations
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Dates
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================================================
// ENUMS
// ============================================================================

enum ProjectStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

enum PhaseStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  PAUSED
}

enum AgentType {
  PRODUCT_DISCOVERY
  TECHNICAL_DESIGN
  BUILDER
  SECURITY
  VERIFIER
  CRITIC
}

enum SubscriptionTier {
  FREE
  PREMIUM
  ENTERPRISE
}
```

### 5.3 TimescaleDB Schema (Raw SQL for Hypertables)

```sql
-- TokenLedger hypertable for time-series token data
-- Run after Prisma migrations via a separate migration script

-- Create extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- TokenLedger table (append-only)
CREATE TABLE IF NOT EXISTS token_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  project_id      TEXT NOT NULL,
  phase_id        TEXT,
  agent_id        TEXT,
  user_id         TEXT NOT NULL,
  
  -- Model info
  provider        TEXT NOT NULL,          -- "anthropic", "openai"
  model           TEXT NOT NULL,          -- "claude-3-opus"
  
  -- Token counts
  prompt_tokens   INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens    INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  
  -- Cost (normalized to Credits)
  cost_credits    DOUBLE PRECISION NOT NULL,
  
  -- Enforcement state at time of call
  budget_percent_before DOUBLE PRECISION,
  enforcement_action    TEXT,             -- "none", "compress", "warn", "stop"
  
  -- Metadata
  request_id      UUID,                   -- For deduplication
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable (partition by time)
SELECT create_hypertable('token_ledger', 'created_at',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ledger_project ON token_ledger (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON token_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_agent ON token_ledger (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_phase ON token_ledger (phase_id, created_at DESC);

-- UsageMetrics continuous aggregate (for fast dashboard queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS usage_metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', created_at) AS bucket,
  project_id,
  agent_id,
  SUM(prompt_tokens) AS total_prompt_tokens,
  SUM(completion_tokens) AS total_completion_tokens,
  SUM(total_tokens) AS total_tokens,
  SUM(cost_credits) AS total_credits,
  COUNT(*) AS call_count
FROM token_ledger
GROUP BY bucket, project_id, agent_id
WITH NO DATA;

-- Refresh policy (every hour)
SELECT add_continuous_aggregate_policy('usage_metrics_hourly',
  start_offset => INTERVAL '2 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);

-- Projections table (stores historical completion data for ML)
CREATE TABLE IF NOT EXISTS project_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      TEXT NOT NULL,
  
  -- Classification
  complexity_tier TEXT NOT NULL,          -- "simple", "medium", "complex"
  feature_count   INTEGER,
  
  -- Actual usage
  total_tokens    INTEGER NOT NULL,
  total_credits   DOUBLE PRECISION NOT NULL,
  duration_hours  DOUBLE PRECISION,
  
  -- Phase breakdown (JSONB for flexibility)
  phase_breakdown JSONB,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completions_tier ON project_completions (complexity_tier);
```

### 5.4 Redis Key Patterns

```
# Current project state (fast reads for dashboard)
token:project:{projectId}:current
  → { usedCredits, usedPromptTokens, usedCompletionTokens, lastUpdated }

# Active SSE subscriptions
sse:project:{projectId}:subscribers
  → Set of connection IDs

# Pub/Sub channel for SSE
token:events:{projectId}
  → Published events for real-time updates

# Rate limiting
ratelimit:tokens:{userId}
  → Token record rate limit counter

# Budget cache
budget:{projectId}
  → { totalCredits, softLimit, hardLimit, criticalLimit }
```

---

## 6. API Design

### 6.1 Token Recording API

#### `POST /api/v1/tokens/record`

**Purpose**: Record token usage from agent execution (called by orchestrator middleware)

**Authentication**: Internal service token (not user-facing)

**Request**:
```typescript
interface RecordTokenRequest {
  projectId: string;
  phaseId?: string;
  agentId?: string;
  provider: "anthropic" | "openai" | "google";
  model: string;
  promptTokens: number;
  completionTokens: number;
  requestId?: string;  // For idempotency
}
```

**Response**:
```typescript
interface RecordTokenResponse {
  success: boolean;
  data: {
    id: string;
    costCredits: number;
    budgetPercent: number;
    enforcementAction: "none" | "compress" | "warn" | "stop" | "critical";
    budgetRemaining: number;
  };
}
```

### 6.2 Token Usage API

#### `GET /api/v1/tokens/usage`

**Purpose**: Get token usage summary for a project or user

**Authentication**: Bearer token (JWT)  
**Authorization**: Project owner or admin

**Query Parameters**:
```typescript
interface UsageQueryParams {
  projectId?: string;      // Filter by project
  startDate?: string;      // ISO 8601
  endDate?: string;        // ISO 8601
  groupBy?: "hour" | "day" | "phase" | "agent";
}
```

**Response**:
```typescript
interface UsageResponse {
  data: {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalCredits: number;
    breakdown: Array<{
      key: string;         // Time bucket or phase/agent ID
      promptTokens: number;
      completionTokens: number;
      credits: number;
      callCount: number;
    }>;
  };
  meta: {
    startDate: string;
    endDate: string;
    projectId?: string;
  };
}
```

### 6.3 Budget API

#### `GET /api/v1/budgets/:projectId`

**Purpose**: Get budget configuration and current usage

**Response**:
```typescript
interface BudgetResponse {
  data: {
    projectId: string;
    totalCredits: number;
    usedCredits: number;
    usedPercent: number;
    softLimit: number;      // Credits at 80%
    hardLimit: number;      // Credits at 100%
    criticalLimit: number;  // Credits at 150%
    status: "healthy" | "warning" | "critical" | "exceeded";
    projectedCompletion?: number;  // Estimated final credits
  };
}
```

#### `POST /api/v1/budgets`

**Purpose**: Create or update budget for a project

**Request**:
```typescript
interface CreateBudgetRequest {
  projectId: string;
  totalCredits: number;
  softLimitPercent?: number;   // Default 0.80
  hardLimitPercent?: number;   // Default 1.00
}
```

### 6.4 Projections API

#### `GET /api/v1/projections/:projectId`

**Purpose**: Get token usage projections for a project

**Response**:
```typescript
interface ProjectionResponse {
  data: {
    estimatedTotalCredits: number;
    confidenceInterval: {
      low: number;
      high: number;
    };
    phases: Array<{
      phaseId: string;
      phaseName: string;
      status: "completed" | "in_progress" | "pending";
      actualCredits?: number;
      estimatedCredits: number;
      confidence: number;  // 0-1
    }>;
    methodology: string;   // Explanation for transparency
  };
}
```

### 6.5 SSE Events API

#### `GET /api/v1/tokens/events/:projectId`

**Purpose**: Subscribe to real-time token usage events

**Response**: Server-Sent Events stream

**Event Types**:
```typescript
// Token recorded event
interface TokenRecordedEvent {
  type: "token_recorded";
  data: {
    projectId: string;
    phaseId?: string;
    agentId?: string;
    promptTokens: number;
    completionTokens: number;
    costCredits: number;
    budgetPercent: number;
    enforcementAction: string;
    timestamp: string;
  };
}

// Threshold crossed event
interface ThresholdCrossedEvent {
  type: "threshold_crossed";
  data: {
    projectId: string;
    threshold: "soft" | "hard" | "critical";
    budgetPercent: number;
    message: string;
  };
}

// Phase completed event
interface PhaseCompletedEvent {
  type: "phase_completed";
  data: {
    projectId: string;
    phaseId: string;
    actualCredits: number;
    wasUnderBudget: boolean;
  };
}
```

### 6.6 Error Codes

| Code | HTTP Status | Message | Action |
|------|-------------|---------|--------|
| VALIDATION_ERROR | 400 | {field}: {error} | Fix input |
| UNAUTHORIZED | 401 | Authentication required | Re-authenticate |
| FORBIDDEN | 403 | Access denied | Check permissions |
| PROJECT_NOT_FOUND | 404 | Project not found | Verify ID |
| BUDGET_NOT_FOUND | 404 | Budget not configured | Create budget first |
| BUDGET_EXCEEDED | 429 | Budget exceeded | Approve or increase |
| RATE_LIMITED | 429 | Too many requests | Wait and retry |

---

## 7. UI Design

### 7.1 Dashboard Information Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Dashboard Structure                                 │
│                                                                              │
│  /dashboard                                                                  │
│  ├── /tokens                    Token Management Hub                         │
│  │   ├── /overview              Executive summary (all projects)             │
│  │   ├── /projects/:id          Project-specific dashboard                   │
│  │   │   ├── /phases            Phase breakdown view                         │
│  │   │   ├── /agents            Agent attribution view                       │
│  │   │   └── /history           Historical usage timeline                    │
│  │   ├── /budgets               Budget configuration                         │
│  │   └── /reports               Export and reporting (Premium+)              │
│  │                                                                           │
│  └── /settings                                                               │
│      └── /subscription          Tier management                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Component Inventory

| Component | Path | Purpose |
|-----------|------|---------|
| `TokenOverview` | `src/components/tokens/TokenOverview.tsx` | Executive summary with all projects |
| `ProjectTokenDashboard` | `src/components/tokens/ProjectTokenDashboard.tsx` | Single project token view |
| `BudgetHealthIndicator` | `src/components/tokens/BudgetHealthIndicator.tsx` | Visual budget status |
| `TokenBurnChart` | `src/components/tokens/TokenBurnChart.tsx` | Time-series usage chart |
| `AgentAttributionPie` | `src/components/tokens/AgentAttributionPie.tsx` | Agent cost breakdown |
| `PhaseProgressTimeline` | `src/components/tokens/PhaseProgressTimeline.tsx` | Gantt-style phase view |
| `BudgetConfigForm` | `src/components/tokens/BudgetConfigForm.tsx` | Budget setup form |
| `ThresholdAlert` | `src/components/tokens/ThresholdAlert.tsx` | Real-time threshold warnings |
| `UsageExportButton` | `src/components/tokens/UsageExportButton.tsx` | Export functionality |

### 7.3 UI States

| State | Trigger | Behavior |
|-------|---------|----------|
| Loading | Initial fetch | Skeleton loaders for charts |
| Empty | No token data | "Start your first project" CTA |
| Healthy | Budget < 80% | Green indicators, normal view |
| Warning | Budget 80-100% | Yellow indicators, warning banner |
| Critical | Budget > 100% | Red indicators, action required modal |
| Error | API failure | Toast + retry button |
| Streaming | SSE connected | Live update indicator |

### 7.4 Progressive Disclosure by Tier

| View | Free | Premium | Enterprise |
|------|------|---------|------------|
| Project budget bar | ✅ | ✅ | ✅ |
| Phase breakdown | ❌ | ✅ | ✅ |
| Burn rate chart | ❌ | ✅ | ✅ |
| Agent attribution | ❌ | ✅ | ✅ |
| Projections | ❌ | ✅ | ✅ |
| History (30 days) | ❌ | ✅ | ✅ |
| History (1 year) | ❌ | ❌ | ✅ |
| CSV/JSON export | ❌ | ❌ | ✅ |
| Invoice preview | ❌ | ❌ | ✅ |
| Anomaly detection | ❌ | ❌ | ✅ |

---

## 8. Security Considerations

### 8.1 Authentication & Authorization

| Aspect | Implementation |
|--------|----------------|
| User Auth | NextAuth.js v5 with JWT strategy (existing) |
| OAuth Providers | GitHub, Google (existing) |
| Internal Service Auth | HMAC-signed requests with shared secret |
| API Authorization | Middleware checks project ownership |
| Rate Limiting | Redis-based per-user limits |

### 8.2 Data Protection

| Data Type | Protection |
|-----------|------------|
| Token counts | Not PII, standard encryption at rest |
| User IDs | CUID, not revealing |
| API keys | Never stored, used transiently |
| Cost data | Encrypted at rest, access logged |

### 8.3 Security Checklist

- [ ] HTTPS only (enforced via Next.js middleware)
- [ ] CSRF protection (Next.js built-in)
- [ ] Input validation (Zod schemas)
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] Rate limiting (Redis-based)
- [ ] Audit logging (append-only ledger)
- [ ] Service authentication (HMAC for internal calls)
- [ ] Project ownership verification (middleware)

---

## 9. Testing Strategy

### 9.1 Test Categories

| Category | Framework | Focus |
|----------|-----------|-------|
| Unit | Jest | Cost calculations, threshold logic |
| Integration | Jest + Supertest | API endpoints, database operations |
| E2E | Playwright | Dashboard flows, SSE updates |
| Load | k6 | SSE scalability, concurrent projects |

### 9.2 Critical Test Cases

| Test Case | Type | Priority |
|-----------|------|----------|
| Token recording accuracy | Unit | P0 |
| Cost normalization (multi-model) | Unit | P0 |
| Threshold detection (80%, 100%, 150%) | Unit | P0 |
| Budget enforcement stops execution | Integration | P0 |
| SSE events delivered in <500ms | Integration | P0 |
| Dashboard handles 100+ concurrent users | Load | P1 |
| Projection accuracy ±20% | Integration | P1 |

---

## 10. Deployment & Operations

### 10.1 Infrastructure Requirements

| Component | Requirement |
|-----------|-------------|
| PostgreSQL | Existing Docker container |
| TimescaleDB | New Docker container (extension) |
| Redis | Existing (for cache + pub/sub) |
| Next.js | Existing (port 3100) |
| Orchestrator | New service (TBD port) |

### 10.2 Docker Compose Addition

```yaml
# Add to existing docker-compose.yml
services:
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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U codesleuth -d codesleuth_metrics"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  timescale_data:
```

### 10.3 Environment Variables (Additions)

```env
# TimescaleDB
TIMESCALE_URL="postgresql://codesleuth:password@localhost:5433/codesleuth_metrics"
TIMESCALE_PASSWORD="your-secure-password"

# Orchestrator
ORCHESTRATOR_SECRET="hmac-secret-for-internal-auth"

# AI Model API Keys (for orchestrator)
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Feature Flags
FEATURE_TOKEN_DASHBOARD=true
FEATURE_PROJECTIONS=false  # Enable after baseline data
```

---

## 11. Rollback Plan

### 11.1 Database Rollback

```bash
# Prisma migrations are reversible
npx prisma migrate reset --skip-seed

# TimescaleDB (manual)
psql -h localhost -p 5433 -U codesleuth -d codesleuth_metrics
DROP MATERIALIZED VIEW IF EXISTS usage_metrics_hourly;
DROP TABLE IF EXISTS token_ledger;
DROP TABLE IF EXISTS project_completions;
```

### 11.2 Feature Rollback

```typescript
// Feature flag in environment
if (process.env.FEATURE_TOKEN_DASHBOARD !== 'true') {
  // Return 404 or redirect for all /dashboard/tokens routes
}
```

### 11.3 Code Rollback

```bash
git revert HEAD~{n}  # Revert commits
vercel rollback       # Redeploy previous version
```

---

## 12. Appendix

### A. Cost Normalization Table

| Provider | Model | Prompt (per 1M) | Completion (per 1M) | Credits/1K tokens |
|----------|-------|-----------------|---------------------|-------------------|
| Anthropic | claude-3-opus | $15.00 | $75.00 | 15 / 75 |
| Anthropic | claude-3-sonnet | $3.00 | $15.00 | 3 / 15 |
| Anthropic | claude-3-haiku | $0.25 | $1.25 | 0.25 / 1.25 |
| OpenAI | gpt-4-turbo | $10.00 | $30.00 | 10 / 30 |
| OpenAI | gpt-4o | $5.00 | $15.00 | 5 / 15 |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 | 0.15 / 0.6 |

> Note: 1 Credit = $0.001 USD

### B. Agent Cost Profiles (Estimated)

| Agent | Avg Prompt Tokens | Avg Completion Tokens | Typical Model |
|-------|-------------------|----------------------|---------------|
| Product Discovery | 2,000 | 8,000 | claude-3-opus |
| Technical Design | 5,000 | 15,000 | claude-3-opus |
| Builder | 10,000 | 25,000 | claude-3-opus |
| Security | 8,000 | 5,000 | claude-3-opus |
| Verifier | 15,000 | 10,000 | claude-3-sonnet |
| Critic | 10,000 | 3,000 | claude-3-sonnet |

### C. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-05 | Technical Designer AI | Initial draft |
