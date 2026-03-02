# Feature: Token Budget Management System

**Version**: 1.0  
**Last Updated**: 2026-02-05  
**Platforms**: 🌐 Web  
**Status**: Active  

---

## 1. Overview

### 1.1 Description

The Token Budget Management System tracks, enforces, and visualizes AI token consumption across the CodeSleuth agent orchestration framework. It treats tokens as a first-class resource with full observability, enabling users to see, predict, and control their AI costs through a premium dashboard experience.

### 1.2 Platform Availability

| Platform | Available | Since Version | Notes |
|----------|-----------|---------------|-------|
| 🌐 Web | ✅ | 1.0.0 | Full support |
| 🖥️ Backend API | ✅ | 1.0.0 | Full support |
| 🪟 Windows | ❌ | N/A | Not applicable |
| 🍎 macOS | ❌ | N/A | Not applicable |
| 🐧 Linux | ❌ | N/A | Not applicable |
| 📱 iOS | ❌ | N/A | Not applicable |
| 🤖 Android | ❌ | N/A | Not applicable |

---

## 2. Feature Rules

### 2.1 Business Rules (All Platforms)

| Rule ID | Rule | Enforcement | Notes |
|---------|------|-------------|-------|
| BR-001 | Every AI model call MUST be recorded to the TokenLedger | Orchestrator middleware | No exceptions |
| BR-002 | Token records are append-only and immutable | Database constraint | Audit trail requirement |
| BR-003 | Budget is calculated in Credits (1 Credit = $0.001 USD) | Cost normalizer | Abstracts model pricing |
| BR-004 | Soft limit at 80% triggers compression mode | Middleware | Reduces verbosity |
| BR-005 | Hard limit at 100% stops execution pending approval | Middleware | User gate |
| BR-006 | Critical limit at 150% hard-stops unconditionally | Middleware | Safety valve |
| BR-007 | Budget approval expires after 24 hours | API logic | Prevents indefinite overruns |
| BR-008 | Projects without budgets run without enforcement | API check | Budget is optional |
| BR-009 | Free tier users see only project-level summaries | UI tier check | Feature gating |
| BR-010 | Only project owners can view/modify budgets | Authorization | Ownership check |

### 2.2 Validation Rules

| Field | Rule | Error Code | Notes |
|-------|------|------------|-------|
| projectId | Required, valid CUID | VALIDATION_ERROR | Must exist |
| totalCredits | Required, positive number | VALIDATION_ERROR | Minimum 1.0 |
| softLimitPercent | Optional, 0.0-1.0 | VALIDATION_ERROR | Default 0.80 |
| hardLimitPercent | Optional, 0.0-2.0 | VALIDATION_ERROR | Default 1.00 |
| promptTokens | Required, non-negative integer | VALIDATION_ERROR | From model response |
| completionTokens | Required, non-negative integer | VALIDATION_ERROR | From model response |
| provider | Required, enum | VALIDATION_ERROR | "anthropic", "openai", "google" |
| model | Required, string | VALIDATION_ERROR | Model identifier |

### 2.3 Authorization Rules

| Action | Required Roles | Additional Checks | Notes |
|--------|---------------|-------------------|-------|
| Record tokens | Internal service | HMAC signature | Not user-facing |
| View usage | Authenticated user | Project ownership | Or admin |
| Create budget | Authenticated user | Project ownership | Owner only |
| Modify budget | Authenticated user | Project ownership | Owner only |
| Approve budget | Authenticated user | Project ownership | Owner only |
| View projections | Premium+ user | Project ownership | Tier-gated |
| Export usage | Enterprise user | Project ownership | Tier-gated |
| Subscribe to SSE | Authenticated user | Project ownership | Real-time access |

### 2.4 Tier-Specific Rules

#### 🆓 Free Tier
- View project-level budget bar only
- Cannot view phase/agent breakdown
- Cannot view burn rate charts
- Cannot view projections
- Cannot export data
- Limited to 3 active projects

#### 💎 Premium Tier
- Full phase breakdown
- Agent attribution charts
- Burn rate visualization
- Token projections
- 30-day history
- Unlimited active projects

#### 🏢 Enterprise Tier
- All Premium features
- 1-year history retention
- CSV/JSON export
- Invoice preview
- Anomaly detection
- API access for external integrations

---

## 3. Data Specifications

### 3.1 Canonical Data Models

```typescript
// Project
interface Project {
  id: string;           // CUID
  name: string;
  description?: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  userId: string;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

// Phase
interface Phase {
  id: string;
  name: string;
  description?: string;
  order: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PAUSED";
  estimatedTokens?: number;
  estimatedCredits?: number;
  projectId: string;
  agentId?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Budget
interface Budget {
  id: string;
  projectId: string;
  totalCredits: number;
  softLimitPercent: number;   // Default 0.80
  hardLimitPercent: number;   // Default 1.00
  criticalLimit: number;      // Default 1.50
  usedCredits: number;
  usedPromptTokens: number;
  usedCompletionTokens: number;
  createdAt: string;
  updatedAt: string;
}

// TokenLedgerEntry (TimescaleDB)
interface TokenLedgerEntry {
  id: string;           // UUID
  projectId: string;
  phaseId?: string;
  agentId?: string;
  userId: string;
  provider: "anthropic" | "openai" | "google";
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;  // Computed
  costCredits: number;
  budgetPercentBefore?: number;
  enforcementAction?: "none" | "compress" | "warn" | "stop" | "critical";
  requestId?: string;
  createdAt: string;
}

// Agent
interface Agent {
  id: string;
  name: string;
  description?: string;
  type: "PRODUCT_DISCOVERY" | "TECHNICAL_DESIGN" | "BUILDER" | "SECURITY" | "VERIFIER" | "CRITIC";
  avgPromptTokens?: number;
  avgCompletionTokens?: number;
  avgCostPerExecution?: number;
  createdAt: string;
  updatedAt: string;
}

// Subscription
interface Subscription {
  id: string;
  userId: string;
  tier: "FREE" | "PREMIUM" | "ENTERPRISE";
  monthlyCredits: number;
  projectLimit: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Platform Schema Implementations

| Platform | Technology | Schema File |
|----------|------------|-------------|
| 🌐 Backend (Relational) | Prisma | `prisma/schema.prisma` |
| 📊 Backend (Time-Series) | TimescaleDB (raw SQL) | `prisma/timescale/init.sql` |

### 3.3 Field Specifications

#### Budget Fields

| Field | Type | Required | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | CUID | Yes | Auto | Unique | Primary key |
| projectId | CUID | Yes | - | FK to Project, Unique | 1:1 relationship |
| totalCredits | Float | Yes | - | > 0 | Total budget in Credits |
| softLimitPercent | Float | No | 0.80 | 0.0-1.0 | Soft warning threshold |
| hardLimitPercent | Float | No | 1.00 | 0.0-2.0 | Hard stop threshold |
| criticalLimit | Float | No | 1.50 | 0.0-3.0 | Emergency stop |
| usedCredits | Float | No | 0 | >= 0 | Denormalized for speed |
| usedPromptTokens | Int | No | 0 | >= 0 | Denormalized for speed |
| usedCompletionTokens | Int | No | 0 | >= 0 | Denormalized for speed |

#### TokenLedger Fields (TimescaleDB)

| Field | Type | Required | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | UUID | Yes | Auto | Unique | Primary key |
| project_id | Text | Yes | - | - | Foreign key (app-level) |
| phase_id | Text | No | NULL | - | Optional context |
| agent_id | Text | No | NULL | - | Optional context |
| user_id | Text | Yes | - | - | Audit trail |
| provider | Text | Yes | - | Enum | "anthropic", "openai", etc. |
| model | Text | Yes | - | - | Model identifier |
| prompt_tokens | Int | Yes | - | >= 0 | From model response |
| completion_tokens | Int | Yes | - | >= 0 | From model response |
| total_tokens | Int | Computed | - | - | prompt + completion |
| cost_credits | Float | Yes | - | >= 0 | Normalized cost |
| budget_percent_before | Float | No | NULL | 0.0-∞ | State before call |
| enforcement_action | Text | No | NULL | Enum | Action taken |
| request_id | UUID | No | NULL | - | Idempotency |
| created_at | Timestamp | Yes | now() | - | Partition key |

---

## 4. API Contract

### 4.1 Token Endpoints

| Method | Endpoint | Purpose | Auth | Tier |
|--------|----------|---------|------|------|
| POST | `/api/v1/tokens/record` | Record token usage | Internal | All |
| GET | `/api/v1/tokens/usage` | Get usage summary | User | All |
| GET | `/api/v1/tokens/events/:projectId` | SSE subscription | User | All |
| GET | `/api/v1/tokens/export` | Export usage data | User | Enterprise |

### 4.2 Budget Endpoints

| Method | Endpoint | Purpose | Auth | Tier |
|--------|----------|---------|------|------|
| GET | `/api/v1/budgets` | List all budgets | User | All |
| POST | `/api/v1/budgets` | Create budget | User | All |
| GET | `/api/v1/budgets/:projectId` | Get budget | User | All |
| PATCH | `/api/v1/budgets/:projectId` | Update budget | User | All |
| POST | `/api/v1/budgets/:projectId/approve` | Approve overage | User | All |

### 4.3 Projection Endpoints

| Method | Endpoint | Purpose | Auth | Tier |
|--------|----------|---------|------|------|
| GET | `/api/v1/projections/:projectId` | Get projections | User | Premium+ |

### 4.4 Project Endpoints

| Method | Endpoint | Purpose | Auth | Tier |
|--------|----------|---------|------|------|
| GET | `/api/v1/projects` | List projects | User | All |
| POST | `/api/v1/projects` | Create project | User | All |
| GET | `/api/v1/projects/:projectId` | Get project | User | All |
| PATCH | `/api/v1/projects/:projectId` | Update project | User | All |
| DELETE | `/api/v1/projects/:projectId` | Delete project | User | All |

### 4.5 Error Codes

| Code | HTTP Status | Message | Action |
|------|-------------|---------|--------|
| VALIDATION_ERROR | 400 | {field}: {error} | Fix input |
| UNAUTHORIZED | 401 | Authentication required | Re-authenticate |
| FORBIDDEN | 403 | Access denied | Check permissions |
| PROJECT_NOT_FOUND | 404 | Project not found | Verify ID |
| BUDGET_NOT_FOUND | 404 | Budget not configured | Create budget |
| BUDGET_SOFT_LIMIT | 200 | Soft limit reached (80%) | Informational |
| BUDGET_EXCEEDED | 429 | Budget exceeded (100%) | Approve or increase |
| BUDGET_CRITICAL | 429 | Critical limit exceeded (150%) | Hard stop |
| TIER_REQUIRED | 403 | Feature requires Premium/Enterprise | Upgrade |
| RATE_LIMITED | 429 | Too many requests | Wait and retry |

---

## 5. UI Specifications

### 5.1 Component Inventory

| Component | Path | Purpose | Tier |
|-----------|------|---------|------|
| TokenOverview | `src/components/tokens/TokenOverview.tsx` | All projects summary | All |
| ProjectTokenDashboard | `src/components/tokens/ProjectTokenDashboard.tsx` | Single project view | All |
| BudgetHealthIndicator | `src/components/tokens/BudgetHealthIndicator.tsx` | Visual budget status | All |
| TokenBurnChart | `src/components/tokens/TokenBurnChart.tsx` | Time-series chart | Premium+ |
| AgentAttributionPie | `src/components/tokens/AgentAttributionPie.tsx` | Agent cost breakdown | Premium+ |
| PhaseProgressTimeline | `src/components/tokens/PhaseProgressTimeline.tsx` | Gantt-style view | Premium+ |
| BudgetConfigForm | `src/components/tokens/BudgetConfigForm.tsx` | Budget setup | All |
| ThresholdAlert | `src/components/tokens/ThresholdAlert.tsx` | Real-time warnings | All |
| UsageExportButton | `src/components/tokens/UsageExportButton.tsx` | Export button | Enterprise |
| SSEProvider | `src/components/tokens/SSEProvider.tsx` | SSE connection manager | All |

### 5.2 UI States

| State | Trigger | Behavior |
|-------|---------|----------|
| Loading | Initial fetch | Skeleton loaders for charts |
| Empty | No projects/data | "Start your first project" CTA |
| Healthy | Budget < 80% | Green indicators |
| Warning | Budget 80-100% | Yellow indicators, warning banner |
| Critical | Budget > 100% | Red indicators, action required modal |
| Error | API failure | Toast + retry button |
| Streaming | SSE connected | Live update indicator (green dot) |
| Disconnected | SSE error | Reconnecting indicator |
| Upgrade Required | Premium feature | Blur overlay + upgrade CTA |

### 5.3 Dashboard Routes

| Route | Purpose | Tier |
|-------|---------|------|
| `/dashboard/tokens` | Token management hub | All |
| `/dashboard/tokens/overview` | All projects summary | All |
| `/dashboard/tokens/projects/:id` | Project dashboard | All |
| `/dashboard/tokens/projects/:id/phases` | Phase breakdown | Premium+ |
| `/dashboard/tokens/projects/:id/agents` | Agent attribution | Premium+ |
| `/dashboard/tokens/projects/:id/history` | Historical timeline | Premium+ |
| `/dashboard/tokens/budgets` | Budget configuration | All |
| `/dashboard/tokens/reports` | Export and reporting | Enterprise |

---

## 6. Caching Strategy

### 6.1 Redis Cache Patterns

| Key Pattern | TTL | Invalidation |
|-------------|-----|--------------|
| `token:project:{projectId}:current` | 1 minute | On token record |
| `budget:{projectId}` | 5 minutes | On budget update |
| `projections:{projectId}` | 1 hour | On phase completion |
| `usage:daily:{projectId}:{date}` | 24 hours | None (immutable) |

### 6.2 Client-Side Caching

| Data Type | Strategy | Stale Time |
|-----------|----------|------------|
| Budget status | React Query | 30 seconds |
| Usage data | React Query | 1 minute |
| Projections | React Query | 5 minutes |
| Real-time events | SSE (no cache) | N/A |

---

## 7. Enforcement Behavior

### 7.1 Threshold Actions

| Budget % | Status | Action | User Experience |
|----------|--------|--------|-----------------|
| 0-79% | Healthy | None | Normal execution |
| 80-99% | Warning | Compress | Banner warning, reduced verbosity |
| 100-149% | Exceeded | Stop | Modal requires approval to continue |
| 150%+ | Critical | Hard Stop | Blocked, no override possible |

### 7.2 Compression Contract

When soft limit (80%) is reached, inject into agent prompt:
```
[BUDGET NOTICE: Token budget at {percent}%. 
Optimize for conciseness:
- Reduce explanatory text
- Minimize code comments
- Use abbreviated variable names in examples
- Omit optional sections]
```

### 7.3 Approval Flow

1. Execution reaches 100% budget
2. System throws `BUDGET_EXCEEDED` error
3. UI shows approval modal with:
   - Current usage vs. budget
   - Estimated remaining cost
   - "Continue with 25% more budget" button
4. User approves → temporary 25% increase (24hr expiry)
5. Execution resumes

---

## 8. Testing Requirements

### 8.1 Test Cases

| Test Case | Type | Priority |
|-----------|------|----------|
| Record token with valid data | Unit | P0 |
| Record token with invalid data | Unit | P0 |
| Calculate credits correctly (multi-model) | Unit | P0 |
| Soft limit triggers compression | Integration | P0 |
| Hard limit blocks execution | Integration | P0 |
| Critical limit hard-stops | Integration | P0 |
| SSE events delivered in <500ms | Integration | P0 |
| Budget approval extends limit | Integration | P1 |
| Projection accuracy ±20% | Integration | P1 |
| Tier-gated features blocked | Integration | P1 |
| Export generates valid CSV | Integration | P2 |

### 8.2 Coverage Requirements

| Area | Minimum Coverage |
|------|------------------|
| Cost normalization | 95% |
| Budget enforcement | 90% |
| API routes | 80% |
| React components | 70% |

---

## 9. Security Checklist

- [x] Internal service auth (HMAC for token recording)
- [x] User auth required for all user-facing APIs
- [x] Project ownership verified before data access
- [x] Rate limiting on SSE subscriptions
- [x] Input validation with Zod schemas
- [x] SQL injection prevention (Prisma + parameterized queries)
- [x] Audit trail via append-only ledger
- [x] No secrets in client-side code
- [x] HTTPS enforced

---

## 10. Known Limitations

| Limitation | Workaround | Planned Fix |
|------------|------------|-------------|
| Projections require 20+ completed projects | Show "insufficient data" message | N/A (data-dependent) |
| SSE limited to ~1000 concurrent connections | Load balancer with sticky sessions | WebSocket fallback in v2 |
| No retroactive budget application | Budget applies to new usage only | N/A (by design) |
| Model pricing updates are manual | Update ModelPricing table | Admin UI in v2 |

---

## 11. Related Features

| Feature | Relationship | Location |
|---------|--------------|----------|
| Authentication | Depends on | `src/lib/auth.ts` |
| User Management | Depends on | `prisma/schema.prisma` (User model) |
| Agent Orchestrator | Depended by | `src/lib/orchestrator/` |
| Subscription/Billing | Related | Future implementation |

---

## 12. Change Log

| Version | Date | Author | Type | Description |
|---------|------|--------|------|-------------|
| 1.0.0 | 2026-02-05 | Technical Designer AI | ADD | Initial specification |
