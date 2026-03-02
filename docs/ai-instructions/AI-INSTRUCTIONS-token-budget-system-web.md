# AI Builder Instructions: Token Budget Management System (Web)

**Version**: 1.0  
**TDD Reference**: TDD-token-budget-system-v1.0.md  
**Platform**: 🌐 Web (Next.js)  
**Date**: 2026-02-05  

---

## Overview

This document provides detailed instructions for implementing the Token Budget Management System in the CodeSleuth web application. Follow these instructions sequentially, completing each phase before moving to the next.

---

## Tech Stack Summary

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 16 (App Router) | Existing |
| Language | TypeScript (strict mode) | Existing |
| ORM | Prisma 7 | Existing |
| Primary DB | PostgreSQL 17 (Docker) | Existing |
| Time-Series DB | TimescaleDB (Docker) | NEW |
| Cache | Redis | Existing |
| Auth | NextAuth.js v5 | Existing |
| Charts | Recharts | NEW dependency |
| Real-time | Server-Sent Events | NEW |

---

## Pre-Implementation Checklist

Before writing any code:

- [ ] Docker is running with PostgreSQL and Redis
- [ ] You have access to add a new Docker service (TimescaleDB)
- [ ] Environment variables are accessible for modification
- [ ] Current Prisma schema is understood (`prisma/schema.prisma`)
- [ ] Existing auth flow is understood (`src/lib/auth.ts`)

---

## Phase 0: Infrastructure Setup

### 0.1 Create Docker Compose (or update existing)

**File**: `docker-compose.yml` (root directory)

If not exists, create. If exists, add the `timescaledb` service:

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

### 0.2 Create TimescaleDB Init Script

**File**: `prisma/timescale/init.sql`

```sql
-- TimescaleDB initialization for Token Budget System

-- Enable extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- TokenLedger table (append-only time-series)
CREATE TABLE IF NOT EXISTS token_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  project_id      TEXT NOT NULL,
  phase_id        TEXT,
  agent_id        TEXT,
  user_id         TEXT NOT NULL,
  
  -- Model info
  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,
  
  -- Token counts
  prompt_tokens   INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens    INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  
  -- Cost (normalized to Credits, 1 Credit = $0.001)
  cost_credits    DOUBLE PRECISION NOT NULL,
  
  -- Enforcement state
  budget_percent_before DOUBLE PRECISION,
  enforcement_action    TEXT,
  
  -- Metadata
  request_id      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('token_ledger', 'created_at',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_project ON token_ledger (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON token_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_agent ON token_ledger (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_phase ON token_ledger (phase_id, created_at DESC);

-- Continuous aggregate for hourly metrics
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

-- Refresh policy
SELECT add_continuous_aggregate_policy('usage_metrics_hourly',
  start_offset => INTERVAL '2 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);

-- Project completions (for projection training)
CREATE TABLE IF NOT EXISTS project_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      TEXT NOT NULL,
  complexity_tier TEXT NOT NULL,
  feature_count   INTEGER,
  total_tokens    INTEGER NOT NULL,
  total_credits   DOUBLE PRECISION NOT NULL,
  duration_hours  DOUBLE PRECISION,
  phase_breakdown JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completions_tier ON project_completions (complexity_tier);
```

### 0.3 Update Environment Variables

**File**: `.env.example` (update)

Add these new variables:

```env
# TimescaleDB
TIMESCALE_URL="postgresql://codesleuth:password@localhost:5433/codesleuth_metrics"
TIMESCALE_PASSWORD="your-secure-timescale-password"

# Orchestrator
ORCHESTRATOR_SECRET="generate-with-openssl-rand-base64-32"

# AI Providers
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Feature Flags
FEATURE_TOKEN_DASHBOARD=true
FEATURE_PROJECTIONS=false
```

### 0.4 Update Prisma Schema

**File**: `prisma/schema.prisma`

Add these models after the existing models:

```prisma
// ============================================================================
// TOKEN BUDGET MANAGEMENT MODELS
// ============================================================================

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  status      ProjectStatus @default(ACTIVE)
  
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phases      Phase[]
  budget      Budget?
  
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
  
  estimatedTokens   Int?
  estimatedCredits  Float?
  
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agentId     String?
  agent       Agent?   @relation(fields: [agentId], references: [id])
  
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
  
  avgPromptTokens     Int?
  avgCompletionTokens Int?
  avgCostPerExecution Float?
  
  phases      Phase[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Budget {
  id          String   @id @default(cuid())
  
  totalCredits      Float
  softLimitPercent  Float    @default(0.80)
  hardLimitPercent  Float    @default(1.00)
  criticalLimit     Float    @default(1.50)
  
  usedCredits       Float    @default(0)
  usedPromptTokens  Int      @default(0)
  usedCompletionTokens Int   @default(0)
  
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ModelPricing {
  id          String   @id @default(cuid())
  provider    String
  model       String
  
  promptPrice      Float
  completionPrice  Float
  
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([provider, model])
}

model Subscription {
  id          String   @id @default(cuid())
  tier        SubscriptionTier @default(FREE)
  
  monthlyCredits    Float
  projectLimit      Int
  
  stripeCustomerId  String?
  stripeSubscriptionId String?
  
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
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

Also update the User model to add relations:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          UserRole  @default(USER)
  accounts      Account[]
  sessions      Session[]
  projects      Project[]      // ADD THIS
  subscription  Subscription?  // ADD THIS
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### 0.5 Run Migrations

```bash
# Start Docker services
docker-compose up -d

# Wait for services to be healthy
docker-compose ps

# Run Prisma migration
npx prisma migrate dev --name token-budget-system

# Generate Prisma client
npx prisma generate

# Verify TimescaleDB initialized (check init.sql ran)
docker logs codesleuth-timescale
```

---

## Phase 1: Foundation

### 1.1 Create TypeScript Types

**File**: `src/types/tokens.ts`

```typescript
// Token system types

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

export interface BudgetResponse {
  projectId: string;
  totalCredits: number;
  usedCredits: number;
  usedPercent: number;
  softLimit: number;
  hardLimit: number;
  criticalLimit: number;
  status: BudgetStatus;
}

export interface UsageBucket {
  bucket: string;
  promptTokens: number;
  completionTokens: number;
  credits: number;
  callCount: number;
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

// SSE Events
export type TokenEventType = 
  | "token_recorded" 
  | "threshold_crossed" 
  | "phase_completed";

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

export type TokenEvent = 
  | TokenRecordedEvent 
  | ThresholdCrossedEvent 
  | PhaseCompletedEvent;
```

### 1.2 Create TimescaleDB Client

**File**: `src/lib/timescale.ts`

```typescript
import { Pool, PoolClient } from "pg";
import type { TokenLedgerEntry, UsageBucket } from "@/types/tokens";

const pool = new Pool({
  connectionString: process.env.TIMESCALE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export async function recordToLedger(
  entry: Omit<TokenLedgerEntry, "id" | "totalTokens" | "createdAt">
): Promise<string> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO token_ledger 
       (project_id, phase_id, agent_id, user_id, provider, model, 
        prompt_tokens, completion_tokens, cost_credits, 
        budget_percent_before, enforcement_action, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        entry.projectId,
        entry.phaseId || null,
        entry.agentId || null,
        entry.userId,
        entry.provider,
        entry.model,
        entry.promptTokens,
        entry.completionTokens,
        entry.costCredits,
        entry.budgetPercentBefore || null,
        entry.enforcementAction || null,
        entry.requestId || null,
      ]
    );
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

export async function getUsageByProject(
  projectId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCredits: number;
}> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
         COALESCE(SUM(prompt_tokens), 0)::integer AS total_prompt_tokens,
         COALESCE(SUM(completion_tokens), 0)::integer AS total_completion_tokens,
         COALESCE(SUM(cost_credits), 0)::float AS total_credits
       FROM token_ledger
       WHERE project_id = $1 
         AND created_at >= $2 
         AND created_at <= $3`,
      [projectId, startDate, endDate]
    );
    return {
      totalPromptTokens: result.rows[0].total_prompt_tokens,
      totalCompletionTokens: result.rows[0].total_completion_tokens,
      totalCredits: result.rows[0].total_credits,
    };
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
  const client = await pool.connect();
  try {
    const interval = groupBy === "hour" ? "1 hour" : "1 day";
    const result = await client.query(
      `SELECT 
         time_bucket($1::interval, created_at) AS bucket,
         SUM(prompt_tokens)::integer AS prompt_tokens,
         SUM(completion_tokens)::integer AS completion_tokens,
         SUM(cost_credits)::float AS credits,
         COUNT(*)::integer AS call_count
       FROM token_ledger
       WHERE project_id = $2 
         AND created_at >= $3 
         AND created_at <= $4
       GROUP BY bucket
       ORDER BY bucket`,
      [interval, projectId, startDate, endDate]
    );
    return result.rows.map((row) => ({
      bucket: row.bucket.toISOString(),
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      credits: row.credits,
      callCount: row.call_count,
    }));
  } finally {
    client.release();
  }
}

export async function healthCheck(): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    client.release();
  }
}
```

### 1.3 Create Cost Normalizer

**File**: `src/lib/tokens/cost-normalizer.ts`

```typescript
interface ModelPricing {
  promptPricePerMillion: number;
  completionPricePerMillion: number;
}

// 1 Credit = $0.001 USD
const DOLLARS_PER_CREDIT = 0.001;

const MODEL_PRICING: Record<string, Record<string, ModelPricing>> = {
  anthropic: {
    "claude-3-opus-20240229": { promptPricePerMillion: 15, completionPricePerMillion: 75 },
    "claude-3-5-sonnet-20241022": { promptPricePerMillion: 3, completionPricePerMillion: 15 },
    "claude-3-5-haiku-20241022": { promptPricePerMillion: 0.8, completionPricePerMillion: 4 },
    "claude-3-sonnet-20240229": { promptPricePerMillion: 3, completionPricePerMillion: 15 },
    "claude-3-haiku-20240307": { promptPricePerMillion: 0.25, completionPricePerMillion: 1.25 },
  },
  openai: {
    "gpt-4-turbo": { promptPricePerMillion: 10, completionPricePerMillion: 30 },
    "gpt-4o": { promptPricePerMillion: 5, completionPricePerMillion: 15 },
    "gpt-4o-mini": { promptPricePerMillion: 0.15, completionPricePerMillion: 0.6 },
    "gpt-4": { promptPricePerMillion: 30, completionPricePerMillion: 60 },
    "gpt-3.5-turbo": { promptPricePerMillion: 0.5, completionPricePerMillion: 1.5 },
  },
  google: {
    "gemini-1.5-pro": { promptPricePerMillion: 3.5, completionPricePerMillion: 10.5 },
    "gemini-1.5-flash": { promptPricePerMillion: 0.075, completionPricePerMillion: 0.3 },
  },
};

// Fallback for unknown models (expensive to be safe)
const FALLBACK_PRICING: ModelPricing = {
  promptPricePerMillion: 15,
  completionPricePerMillion: 75,
};

export function calculateCredits(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[provider]?.[model] ?? FALLBACK_PRICING;
  
  if (!MODEL_PRICING[provider]?.[model]) {
    console.warn(`[CostNormalizer] Unknown model: ${provider}/${model}, using fallback pricing`);
  }
  
  const promptCost = (promptTokens / 1_000_000) * pricing.promptPricePerMillion;
  const completionCost = (completionTokens / 1_000_000) * pricing.completionPricePerMillion;
  const totalDollars = promptCost + completionCost;
  
  return totalDollars / DOLLARS_PER_CREDIT;
}

export function creditsToUSD(credits: number): number {
  return credits * DOLLARS_PER_CREDIT;
}

export function usdToCredits(usd: number): number {
  return usd / DOLLARS_PER_CREDIT;
}
```

---

## Continuation Notes

This document covers the foundational setup and Phase 0-1. The builder should continue with:

1. **Phase 2**: Budget enforcement middleware, SSE infrastructure
2. **Phase 3**: Projections engine
3. **Phase 4**: Dashboard components with Recharts
4. **Phase 5**: Premium features and tier gating

Refer to `IMPL-token-budget-system-v1.0.md` for the complete step-by-step implementation plan.

---

## Verification Commands

After each phase, run:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Tests (when implemented)
npm test

# Build
npm run build
```

All gates must be green before proceeding to the next phase.
