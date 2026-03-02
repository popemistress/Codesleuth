# Token Budget Management System - Features

## Overview

The Token Budget Management System (TBMS) provides comprehensive cost tracking, budget enforcement, and projection capabilities for AI-powered projects using LLM APIs. It enables enterprise-grade visibility into token consumption with real-time monitoring, predictive cost analysis, and tier-based feature access.

---

## Core Features

### 1. Real-Time Token Tracking

**Status:** ✅ Complete

Track every LLM API call with high-fidelity ledger entries in TimescaleDB.

| Capability | Description |
|------------|-------------|
| **Ledger Recording** | Immutable time-series entries for every API call |
| **Provider Normalization** | Unified credit system across OpenAI, Anthropic, Google, Cohere |
| **Phase Attribution** | Track costs per project phase (Discovery, Design, Implementation, etc.) |
| **Agent Attribution** | Track costs per agent type (Builder, Verifier, Critic, etc.) |
| **Request Idempotency** | Prevent duplicate recordings via request ID tracking |

**API Endpoints:**
- `POST /api/v1/tokens/record` - Record token usage
- `GET /api/v1/tokens/usage` - Query usage data

---

### 2. Budget Management

**Status:** ✅ Complete

Create and manage credit budgets with flexible threshold configurations.

| Capability | Description |
|------------|-------------|
| **Project Budgets** | Assign credit limits to individual projects |
| **Threshold Alerts** | Configure warning/critical/hard stop thresholds |
| **Dynamic Adjustment** | Increase/decrease budgets via API |
| **Period Tracking** | Monthly billing period support |

**API Endpoints:**
- `POST /api/v1/budgets` - Create budget
- `GET /api/v1/budgets?projectId=` - Get budget details
- `PATCH /api/v1/budgets` - Update budget
- `DELETE /api/v1/budgets` - Delete budget

---

### 3. Enforcement Layer

**Status:** ✅ Complete

Pre-request authorization with configurable enforcement actions.

| Capability | Description |
|------------|-------------|
| **Enforcement Contracts** | Pre-check authorization before LLM calls |
| **Threshold Actions** | ALLOW, WARN, REQUIRE_APPROVAL, BLOCK |
| **Model Downgrade** | Automatic fallback to cheaper models at thresholds |
| **Request Blocking** | Hard stop when budget exhausted |

**Contract Workflow:**
```typescript
// Pre-request check
const contract = await getEnforcementContract(projectId);
if (contract.action === "BLOCK") {
  throw new BudgetExceededError();
}

// Make LLM call
const response = await llm.complete(prompt);

// Record usage
await recordTokenUsage({ ...usage, enforcementAction: contract.action });
```

---

### 4. Real-Time Dashboard

**Status:** ✅ Complete

Visual dashboard with live updates via Server-Sent Events (SSE).

| Component | Description |
|-----------|-------------|
| **BudgetMeter** | Visual gauge showing current budget consumption |
| **BudgetCard** | Summary card with budget status and alerts |
| **UsageChart** | SVG time-series visualization |
| **TokenStats** | Summary statistics (tokens, credits, cost) |
| **ActivityFeed** | Real-time event stream |

**SSE Events:**
- `token_usage` - New usage recorded
- `budget_warning` - Threshold crossed
- `phase_completed` - Phase finished
- `system` - System notifications

**URL:** `/dashboard/tokens`

---

### 5. Cost Projections

**Status:** ✅ Complete

Predict remaining project costs based on historical data and current progress.

| Capability | Description |
|------------|-------------|
| **Historical Analysis** | Learn from completed project patterns |
| **Complexity Tiers** | Simple/Medium/Complex/Enterprise multipliers |
| **Phase Projections** | Estimate per-phase costs with confidence scores |
| **Variance Tracking** | Compare projections to actuals |
| **Quick Estimates** | Pre-project cost estimation |

**API Endpoints:**
- `GET /api/v1/projections/:projectId` - Get project projection
- `POST /api/v1/projections/:projectId` - Generate custom projection
- `GET /api/v1/projections/estimate` - Quick estimate (no project required)

**Projection Response:**
```json
{
  "estimatedTotalCredits": 155.50,
  "confidenceInterval": { "low": 124.40, "high": 186.60 },
  "phases": [
    { "phaseName": "Discovery", "estimatedCredits": 15.00, "confidence": 0.85 },
    { "phaseName": "Implementation", "estimatedCredits": 60.00, "confidence": 0.70 }
  ],
  "overallConfidence": 0.75,
  "methodology": "Historical Pattern Analysis",
  "usedCredits": 25.50,
  "remainingCredits": 130.00
}
```

---

### 6. Subscription Tiers

**Status:** ✅ Complete

Three-tier subscription model with feature gating.

| Tier | Monthly Credits | Projects | Features |
|------|-----------------|----------|----------|
| **FREE** | 100 | 3 | Basic dashboard, phase breakdown |
| **PREMIUM** | 2,500 | 25 | + Projections, agent attribution |
| **ENTERPRISE** | 25,000 | Unlimited | + Export, API access, all features |

**Pricing:**
| Tier | Monthly | Yearly (17% off) |
|------|---------|------------------|
| FREE | $0 | $0 |
| PREMIUM | $29 | $290 |
| ENTERPRISE | $99 | $990 |

**API:**
```typescript
const subscription = await getUserSubscription(userId);
const access = await checkFeatureAccess(userId, "export");
```

---

### 7. Export Functionality

**Status:** ✅ Complete (Enterprise)

Generate exportable usage reports in multiple formats.

| Format | Description |
|--------|-------------|
| **CSV** | Spreadsheet-compatible with all metrics |
| **JSON** | Structured data for integration |
| **Markdown** | Human-readable report format |

**Export Options:**
- Daily breakdown
- Phase breakdown
- Agent breakdown
- Custom date ranges

**API Endpoint:**
- `POST /api/v1/export` - Generate export (Enterprise only)

---

### 8. Invoice Preview

**Status:** ✅ Complete

Visual invoice preview component for billing transparency.

| Feature | Description |
|---------|-------------|
| **Current Billing** | Shows current period charges |
| **Overage Calculation** | Automatic overage fee calculation |
| **Projected Total** | Estimated final invoice with projections |
| **Usage Bar** | Visual credit consumption indicator |

**Component:**
```tsx
<InvoicePreview
  projectName="My Project"
  tier="PREMIUM"
  basePrice={29}
  creditsUsed={2100}
  creditLimit={2500}
  period={{ start: periodStart, end: periodEnd }}
  showProjections={true}
  projectedCredits={2800}
/>
```

---

## Data Architecture

### Storage Strategy

| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| Token Ledger | TimescaleDB | High-frequency writes, time-series queries |
| Projects/Budgets | PostgreSQL (Prisma) | Relational data, ACID transactions |
| Events | Redis Pub/Sub | Real-time distribution |
| Session Cache | Redis | Performance optimization |

### Credit Normalization

All providers normalized to a unified credit system where **1 Credit = $0.01** (100 credits = $1.00).

| Provider | Model | Input (USD/1M) | Input Credits/1M | Output (USD/1M) | Output Credits/1M |
|----------|-------|----------------|------------------|-----------------|-------------------|
| **OpenAI** | GPT-5 | ~$1.25 | ~125 | ~$10.00 | ~1000 |
| OpenAI | GPT-5 mini | ~$0.25 | ~25 | ~$2.00 | ~200 |
| OpenAI | GPT-5 nano | ~$0.05 | ~5 | ~$0.40 | ~40 |
| OpenAI | GPT-4.1 | ~$3.00 | ~300 | ~$12.00 | ~1200 |
| OpenAI | GPT-4o | ~$5.00 | ~500 | ~$20.00 | ~2000 |
| **Google** | Gemini 3 Flash | ~$0.50 | ~50 | ~$3.00 | ~300 |
| Google | Gemini 3 Pro (≤200K) | ~$2.00 | ~200 | ~$12.00 | ~1200 |
| Google | Gemini 3 Pro (>200K) | ~$4.00 | ~400 | ~$18.00 | ~1800 |
| Google | Gemini 2.0/2.5 Pro | ~$1.25 | ~125 | ~$5.00 | ~500 |
| Google | Gemini Flash Lite | ~$0.08 | ~8 | ~$0.30 | ~30 |
| **Anthropic** | Claude 4.5 Haiku | ~$1.00 | ~100 | ~$5.00 | ~500 |
| Anthropic | Claude 4.5 Sonnet (≤200K) | ~$3.00 | ~300 | ~$15.00 | ~1500 |
| Anthropic | Claude 4.5 Sonnet (>200K) | ~$6.00 | ~600 | ~$22.50 | ~2250 |
| Anthropic | Claude 4.5 Opus | ~$5.00 | ~500 | ~$25.00 | ~2500 |

**Example Costs:**
- **GPT-5:** 1M input + 1M output ≈ $11.25 ≈ ~1,125 credits
- **Gemini 3 Flash:** 1M input + 1M output ≈ $3.50 ≈ ~350 credits
- **Gemini 3 Pro:** 1M input + 1M output ≈ $14.00 ≈ ~1,400 credits
- **Gemini Flash Lite:** 1M input + 1M output ≈ $0.38 ≈ ~38 credits
- **Claude 4.5 Haiku:** 1M input + 1M output ≈ $6.00 ≈ ~600 credits
- **Claude 4.5 Sonnet:** 1M input + 1M output ≈ $18.00 ≈ ~1,800 credits
- **Claude 4.5 Opus:** 1M input + 1M output ≈ $30.00 ≈ ~3,000 credits

**Gemini 3 Notes:**
- **Flash** is optimized for speed and uses ~30% fewer tokens than 2.5 Pro for equivalent tasks
- **Pro** pricing tiers based on context length (≤200K vs >200K tokens)
- Audio input supported at ~$1.00/1M tokens

**Claude 4.5 Notes:**
- **Haiku** is the fastest and cheapest, ideal for high-volume tasks
- **Sonnet** has context-based pricing (≤200K vs >200K prompts)
- **Opus** is the most intelligent, best for complex reasoning

**General Notes:**
- Enterprise deals and volume tiers often reduce per-million charges
- Optimize prompt length since input tokens are cheaper than output tokens
- Some providers bundle credits differently (premium plans, reserved capacity)

---

## API Reference

### Authentication

All endpoints require authentication via NextAuth session or API key.

```bash
# Session-based (browser)
Cookie: next-auth.session-token=...

# API key (server-to-server)
Authorization: Bearer <api-key>
```

### Error Responses

```json
{
  "success": false,
  "error": {
    "code": "BUDGET_EXCEEDED",
    "message": "Project budget has been exceeded"
  }
}
```

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `BUDGET_EXCEEDED` | 402 | Budget exhausted |
| `FEATURE_LOCKED` | 403 | Subscription upgrade required |

---

## Performance Considerations

### Optimizations Implemented

1. **Connection Pooling** - PostgreSQL and TimescaleDB pools with configurable limits
2. **Time-Series Compression** - TimescaleDB hypertables with automatic compression
3. **SSE Connection Limits** - Max 1000 concurrent event streams
4. **Query Caching** - Redis cache for frequently accessed budget data
5. **Batch Recording** - Support for batch token recording to reduce writes

### Recommended Indexes

```sql
-- TimescaleDB hypertable
CREATE INDEX idx_ledger_project_time ON token_ledger (project_id, created_at DESC);
CREATE INDEX idx_ledger_user_time ON token_ledger (user_id, created_at DESC);
CREATE INDEX idx_ledger_phase ON token_ledger (phase_id) WHERE phase_id IS NOT NULL;
CREATE INDEX idx_ledger_agent ON token_ledger (agent_id) WHERE agent_id IS NOT NULL;
```

---

## Security

### Data Protection

- All API endpoints authenticated via NextAuth
- Project ownership validated on every request
- Request IDs prevent replay attacks
- Sensitive data never logged

### Rate Limiting

| Tier | Requests/min | Burst |
|------|--------------|-------|
| FREE | 60 | 10 |
| PREMIUM | 300 | 50 |
| ENTERPRISE | 1000 | 100 |

---

## Future Roadmap

### Phase 6: Advanced Analytics (Planned)
- Cost anomaly detection
- Usage pattern visualization
- Comparative project analysis
- Team-level dashboards

### Phase 7: Integrations (Planned)
- Slack/Discord notifications
- Webhook support
- Billing provider integration (Stripe)
- SSO/SAML support

---

## Quick Start

### 1. Environment Setup

```bash
# Required environment variables
DATABASE_URL=postgresql://...
TIMESCALE_URL=postgresql://...
REDIS_URL=redis://...
NEXTAUTH_SECRET=...
```

### 2. Database Migration

```bash
npx prisma migrate deploy
```

### 3. Create First Project

```typescript
// Create project with budget
const project = await createProject({ name: "My AI Project", userId });
await createBudget({ projectId: project.id, totalCredits: 1000, thresholds: defaultThresholds });
```

### 4. Record Usage

```typescript
// After each LLM call
await recordTokenUsage({
  projectId,
  phaseId,
  agentId,
  userId,
  provider: "openai",
  model: "gpt-4-turbo",
  promptTokens: 1500,
  completionTokens: 500,
  costCredits: calculateCredits("openai", "gpt-4-turbo", 1500, 500),
});
```

---

## Token-Aware Agent Integration

### Overview

The Token-Aware Agent provides a unified wrapper for making budget-tracked LLM calls. It automatically handles:
- Pre-flight budget checks
- Token usage recording
- Real-time SSE event emission
- Model auto-downgrade when budget is low

### Quick Start

```typescript
import { TokenAwareAgent, createAgent, trackedCompletion } from "@/lib/agents";

// Create an agent
const agent = new TokenAwareAgent({
  projectId: "my-project",
  agentId: "builder-agent",
  userId: "user-123",
  enforcebudget: true,
  autoDowngrade: true,
});

// Make a tracked completion
const response = await agent.complete({
  provider: "anthropic",
  model: "claude-4.5-sonnet",
  prompt: "Write a hello world function in TypeScript",
});

console.log(response.content);
console.log(response.cost); // { credits: 0.45, usd: 0.0045 }
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectId` | string | required | Project to track usage under |
| `userId` | string | required | User making the request |
| `agentId` | string | "default" | Agent identifier for attribution |
| `phaseId` | string | undefined | Phase for phase-level tracking |
| `enforcebudget` | boolean | true | Check budget before calls |
| `autoDowngrade` | boolean | false | Auto-switch to cheaper models |
| `onBudgetWarning` | callback | undefined | Called when budget is low |
| `onBudgetExceeded` | callback | undefined | Called when budget is exceeded |

### Model Auto-Downgrade

When `autoDowngrade: true` and budget reaches warning threshold:

| Original Model | Downgraded To |
|---------------|---------------|
| claude-4.5-opus | claude-4.5-sonnet |
| claude-4.5-sonnet | claude-4.5-haiku |
| gpt-5-turbo | gpt-5-mini |
| gpt-5-mini | gpt-4o-mini |
| gemini-3-pro | gemini-3-flash |

### API Endpoint

External agents can make budget-tracked completions via HTTP:

```bash
POST /api/v1/agents/complete
Authorization: Bearer cs_your_api_key
Content-Type: application/json

{
  "projectId": "project-123",
  "provider": "anthropic",
  "model": "claude-4.5-sonnet",
  "prompt": "Write a sorting function",
  "maxTokens": 2048,
  "temperature": 0.7,
  "enforcebudget": true,
  "autoDowngrade": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "Here's a sorting function...",
    "usage": {
      "promptTokens": 15,
      "completionTokens": 150,
      "totalTokens": 165
    },
    "cost": {
      "credits": 0.75,
      "usd": 0.0075
    },
    "model": "claude-4.5-sonnet",
    "requestId": "api-agent-1234567890",
    "enforcement": {
      "action": "none",
      "wasDowngraded": false
    }
  }
}
```

### Supported Providers

| Provider | Environment Variable | Example Models |
|----------|---------------------|----------------|
| Anthropic | `ANTHROPIC_API_KEY` | claude-4.5-opus, claude-4.5-sonnet, claude-4.5-haiku |
| OpenAI | `OPENAI_API_KEY` | gpt-5-turbo, gpt-5-mini, gpt-4o, gpt-4o-mini |
| Google | `GOOGLE_AI_API_KEY` | gemini-3-pro, gemini-3-flash |

### API Key Management

Create API keys for external agent access:

```typescript
import { createApiKey, revokeApiKey } from "@/lib/agents/api-keys";

// Create key scoped to specific projects
const key = await createApiKey({
  userId: "user-123",
  name: "Production Agent Key",
  projectIds: ["project-a", "project-b"],
  expiresInDays: 90,
});

console.log(key.key); // cs_abc123... (only shown once!)

// Revoke when no longer needed
await revokeApiKey(key.id);
```

---

*Last Updated: 2026-02-05*
*Version: 1.1.0*

