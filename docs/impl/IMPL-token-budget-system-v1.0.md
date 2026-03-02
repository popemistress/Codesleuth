# Implementation Plan: Token Budget Management System

**Version**: 1.0  
**TDD Reference**: TDD-token-budget-system-v1.0.md  
**Platform Doc**: PLATFORM-token-budget-system-v1.0.md  
**Estimated Effort**: 10 weeks  
**Date**: 2026-02-05  

---

## Implementation Phases Overview

| Phase | Name | Duration | Focus |
|-------|------|----------|-------|
| 0 | Infrastructure Setup | Week 1 | Docker, TimescaleDB, Schema |
| 1 | Foundation | Week 2 | TokenLedger, Core APIs |
| 2 | Enforcement | Weeks 3-4 | Budget middleware, Thresholds |
| 3 | Projections | Week 5-6 | Historical data, Estimation |
| 4 | Dashboard | Weeks 7-8 | UI components, Real-time |
| 5 | Premium Polish | Weeks 9-10 | Tiers, Export, Billing |

---

## Phase 0: Infrastructure Setup

**Estimated Effort**: 3-4 days  
**Dependencies**: Docker installed, PostgreSQL running

### 0.1 TimescaleDB Docker Setup

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 0.1.1 | Create docker-compose.yml (if not exists) or update existing | `docker-compose.yml` | File exists with timescaledb service |
| 0.1.2 | Create TimescaleDB init SQL script | `prisma/timescale/init.sql` | Script includes extension creation |
| 0.1.3 | Add new environment variables | `.env`, `.env.example` | TIMESCALE_URL, passwords set |
| 0.1.4 | Start Docker services | Terminal | `docker-compose up -d` succeeds |
| 0.1.5 | Verify TimescaleDB connection | Terminal | `psql $TIMESCALE_URL -c "SELECT version()"` returns |

### 0.2 Prisma Schema Updates

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 0.2.1 | Add Project model | `prisma/schema.prisma` | `npx prisma validate` passes |
| 0.2.2 | Add Phase model | `prisma/schema.prisma` | `npx prisma validate` passes |
| 0.2.3 | Add Agent model | `prisma/schema.prisma` | `npx prisma validate` passes |
| 0.2.4 | Add Budget model | `prisma/schema.prisma` | `npx prisma validate` passes |
| 0.2.5 | Add ModelPricing model | `prisma/schema.prisma` | `npx prisma validate` passes |
| 0.2.6 | Add Subscription model | `prisma/schema.prisma` | `npx prisma validate` passes |
| 0.2.7 | Add enums (ProjectStatus, PhaseStatus, AgentType, SubscriptionTier) | `prisma/schema.prisma` | `npx prisma validate` passes |
| 0.2.8 | Update User model with relations | `prisma/schema.prisma` | `npx prisma validate` passes |
| 0.2.9 | Run migration | Terminal | `npx prisma migrate dev --name token-budget-system` |
| 0.2.10 | Generate Prisma client | Terminal | `npx prisma generate` succeeds |

### 0.3 TimescaleDB Schema Setup

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 0.3.1 | Create token_ledger table | `prisma/timescale/init.sql` | Table exists |
| 0.3.2 | Convert to hypertable | `prisma/timescale/init.sql` | Hypertable created |
| 0.3.3 | Create indexes | `prisma/timescale/init.sql` | Indexes exist |
| 0.3.4 | Create continuous aggregate | `prisma/timescale/init.sql` | Materialized view exists |
| 0.3.5 | Create project_completions table | `prisma/timescale/init.sql` | Table exists |
| 0.3.6 | Run init script | Terminal | Script completes without errors |
| 0.3.7 | Add npm script for timescale init | `package.json` | `npm run timescale:init` works |

### 0.4 TypeScript Types

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 0.4.1 | Create token types | `src/types/tokens.ts` | TypeScript compiles |
| 0.4.2 | Create budget types | `src/types/tokens.ts` | TypeScript compiles |
| 0.4.3 | Create SSE event types | `src/types/tokens.ts` | TypeScript compiles |
| 0.4.4 | Create API request/response types | `src/types/tokens.ts` | TypeScript compiles |

**🔴 BREAKPOINT 0**: Infrastructure verified — Docker running, databases connected, Prisma migrated, types defined.

---

## Phase 1: Foundation (TokenLedger & Core APIs)

**Estimated Effort**: 5-6 days  
**Dependencies**: Phase 0 complete

### 1.1 TimescaleDB Client

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 1.1.1 | Create TimescaleDB connection pool | `src/lib/timescale.ts` | Connection test passes |
| 1.1.2 | Implement recordToLedger function | `src/lib/timescale.ts` | Insert test succeeds |
| 1.1.3 | Implement getUsageByTimeRange function | `src/lib/timescale.ts` | Query test succeeds |
| 1.1.4 | Implement getUsageByProject function | `src/lib/timescale.ts` | Query test succeeds |
| 1.1.5 | Add connection health check | `src/lib/timescale.ts` | Health check works |

### 1.2 Cost Normalization

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 1.2.1 | Create model pricing constants | `src/lib/tokens/cost-normalizer.ts` | Types compile |
| 1.2.2 | Implement calculateCredits function | `src/lib/tokens/cost-normalizer.ts` | Unit tests pass |
| 1.2.3 | Add fallback pricing for unknown models | `src/lib/tokens/cost-normalizer.ts` | Logs warning, returns estimate |
| 1.2.4 | Add model pricing lookup from DB | `src/lib/tokens/cost-normalizer.ts` | DB query works |

### 1.3 Token Recording API

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 1.3.1 | Create POST /api/v1/tokens/record route | `src/app/api/v1/tokens/record/route.ts` | Route responds |
| 1.3.2 | Add Zod validation schema | `src/app/api/v1/tokens/record/route.ts` | Validation works |
| 1.3.3 | Implement internal auth (HMAC) | `src/lib/tokens/internal-auth.ts` | Auth check works |
| 1.3.4 | Wire up cost calculation | Route | Credits calculated correctly |
| 1.3.5 | Wire up ledger recording | Route | Record inserted |
| 1.3.6 | Return budget status in response | Route | Response includes budget % |
| 1.3.7 | Add unit tests | `__tests__/api/tokens/record.test.ts` | Tests pass |

### 1.4 Token Usage API

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 1.4.1 | Create GET /api/v1/tokens/usage route | `src/app/api/v1/tokens/usage/route.ts` | Route responds |
| 1.4.2 | Add query parameter parsing | Route | Params extracted |
| 1.4.3 | Add user auth middleware | Route | Requires login |
| 1.4.4 | Implement project ownership check | Route | Forbidden for non-owners |
| 1.4.5 | Wire up TimescaleDB queries | Route | Data returned |
| 1.4.6 | Add groupBy support (hour/day/phase/agent) | Route | Grouping works |
| 1.4.7 | Add unit tests | `__tests__/api/tokens/usage.test.ts` | Tests pass |

### 1.5 Budget API

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 1.5.1 | Create GET /api/v1/budgets/:projectId route | `src/app/api/v1/budgets/[projectId]/route.ts` | Route responds |
| 1.5.2 | Create POST /api/v1/budgets route | `src/app/api/v1/budgets/route.ts` | Route responds |
| 1.5.3 | Create PATCH /api/v1/budgets/:projectId route | Route | Update works |
| 1.5.4 | Add Zod validation | Routes | Validation works |
| 1.5.5 | Add auth and ownership checks | Routes | Protected |
| 1.5.6 | Wire up Prisma queries | Routes | CRUD works |
| 1.5.7 | Add unit tests | `__tests__/api/budgets.test.ts` | Tests pass |

### 1.6 Project & Phase APIs

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 1.6.1 | Create GET/POST /api/v1/projects route | `src/app/api/v1/projects/route.ts` | Routes respond |
| 1.6.2 | Create GET/PATCH/DELETE /api/v1/projects/:id route | `src/app/api/v1/projects/[projectId]/route.ts` | Routes respond |
| 1.6.3 | Wire up phase CRUD | Routes | Phase operations work |
| 1.6.4 | Add auth and ownership checks | Routes | Protected |
| 1.6.5 | Add unit tests | `__tests__/api/projects.test.ts` | Tests pass |

**🔴 BREAKPOINT 1**: Core APIs working — can record tokens, query usage, manage budgets and projects.

---

## Phase 2: Enforcement

**Estimated Effort**: 8-10 days  
**Dependencies**: Phase 1 complete

### 2.1 Budget Enforcement Logic

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 2.1.1 | Create getBudget function | `src/lib/tokens/budget.ts` | Returns budget with usage |
| 2.1.2 | Create checkThresholds function | `src/lib/tokens/budget.ts` | Returns enforcement action |
| 2.1.3 | Create recordUsage function | `src/lib/tokens/budget.ts` | Updates usage, checks thresholds |
| 2.1.4 | Implement soft limit detection (80%) | `src/lib/tokens/budget.ts` | Triggers "compress" |
| 2.1.5 | Implement hard limit detection (100%) | `src/lib/tokens/budget.ts` | Triggers "stop" |
| 2.1.6 | Implement critical limit detection (150%) | `src/lib/tokens/budget.ts` | Triggers "critical" |
| 2.1.7 | Add Redis caching for budget reads | `src/lib/tokens/budget.ts` | Cache hit/miss works |
| 2.1.8 | Add unit tests | `__tests__/lib/tokens/budget.test.ts` | Tests pass |

### 2.2 Budget Enforcement Contracts

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 2.2.1 | Create contract templates | `src/lib/orchestrator/contracts.ts` | Templates defined |
| 2.2.2 | Create compression contract | `contracts.ts` | Reduces verbosity instructions |
| 2.2.3 | Create warning contract | `contracts.ts` | Includes budget warning |
| 2.2.4 | Create stop contract | `contracts.ts` | Requires approval message |
| 2.2.5 | Create contract injection function | `contracts.ts` | Injects into prompt |

### 2.3 Token Tracking Middleware

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 2.3.1 | Create withTokenTracking wrapper | `src/lib/orchestrator/middleware.ts` | Wrapper function works |
| 2.3.2 | Implement pre-call budget check | `middleware.ts` | Checks before call |
| 2.3.3 | Implement contract injection | `middleware.ts` | Injects when needed |
| 2.3.4 | Implement post-call usage extraction | `middleware.ts` | Extracts from response |
| 2.3.5 | Implement ledger recording | `middleware.ts` | Records to TimescaleDB |
| 2.3.6 | Add error handling for budget exceeded | `middleware.ts` | Throws appropriate errors |
| 2.3.7 | Add unit tests | `__tests__/lib/orchestrator/middleware.test.ts` | Tests pass |

### 2.4 SSE Infrastructure

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 2.4.1 | Create SSE emitter service | `src/lib/tokens/sse-emitter.ts` | Emits to Redis pub/sub |
| 2.4.2 | Create GET /api/v1/tokens/events/:projectId route | `src/app/api/v1/tokens/events/[projectId]/route.ts` | SSE stream opens |
| 2.4.3 | Implement Redis subscription | Route | Subscribes to project channel |
| 2.4.4 | Implement event formatting | Route | Events formatted correctly |
| 2.4.5 | Add auth check for subscription | Route | Requires project access |
| 2.4.6 | Add connection cleanup on close | Route | No memory leaks |
| 2.4.7 | Integration test | Manual | Events flow end-to-end |

### 2.5 Threshold Crossing Events

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 2.5.1 | Create checkThreshold function | `src/lib/tokens/budget.ts` | Detects crossings |
| 2.5.2 | Emit threshold_crossed events | `budget.ts` | Events emitted |
| 2.5.3 | Handle soft limit crossing | `budget.ts` | Emits warning |
| 2.5.4 | Handle hard limit crossing | `budget.ts` | Emits stop required |
| 2.5.5 | Integration test | Manual | Threshold events received |

### 2.6 Budget Approval Flow

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 2.6.1 | Create POST /api/v1/budgets/:projectId/approve route | `src/app/api/v1/budgets/[projectId]/approve/route.ts` | Route works |
| 2.6.2 | Store approval state (temporary increase) | Route | Approval persists |
| 2.6.3 | Middleware checks for approval | `middleware.ts` | Respects approval |
| 2.6.4 | Add approval expiry (24 hours) | Route | Expires correctly |

**🔴 BREAKPOINT 2**: Enforcement working — budgets enforced, thresholds trigger events, SSE flowing.

---

## Phase 3: Projections

**Estimated Effort**: 8-10 days  
**Dependencies**: Phase 2 complete (with historical data)

### 3.1 Historical Data Collection

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 3.1.1 | Create recordProjectCompletion function | `src/lib/tokens/projections.ts` | Records to project_completions |
| 3.1.2 | Call on project completion | Project API | Completion recorded |
| 3.1.3 | Include phase breakdown in metadata | `projections.ts` | Breakdown stored as JSONB |
| 3.1.4 | Include complexity tier classification | `projections.ts` | Tier stored |

### 3.2 Projection Algorithm

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 3.2.1 | Create getHistoricalBaseline function | `src/lib/tokens/projections.ts` | Returns averages by tier |
| 3.2.2 | Create calculateProjection function | `projections.ts` | Returns estimate with confidence |
| 3.2.3 | Implement complexity multiplier | `projections.ts` | Adjusts for project size |
| 3.2.4 | Implement confidence interval | `projections.ts` | Wider for novel projects |
| 3.2.5 | Add per-phase estimation | `projections.ts` | Phase-level estimates |
| 3.2.6 | Add agent cost models | `projections.ts` | Per-agent adjustments |
| 3.2.7 | Add unit tests | `__tests__/lib/tokens/projections.test.ts` | Tests pass |

### 3.3 Projections API

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 3.3.1 | Create GET /api/v1/projections/:projectId route | `src/app/api/v1/projections/[projectId]/route.ts` | Route responds |
| 3.3.2 | Wire up projection calculation | Route | Projections returned |
| 3.3.3 | Add methodology explanation | Route | Explanation included |
| 3.3.4 | Add auth and ownership checks | Route | Protected |
| 3.3.5 | Add unit tests | `__tests__/api/projections.test.ts` | Tests pass |

### 3.4 Variance Tracking

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 3.4.1 | Track predicted vs actual on completion | `projections.ts` | Variance stored |
| 3.4.2 | Use variance to improve future predictions | `projections.ts` | Algorithm adapts |

**🔴 BREAKPOINT 3**: Projections working — can estimate costs before starting phases.

---

## Phase 4: Dashboard

**Estimated Effort**: 10-12 days  
**Dependencies**: Phase 2 complete (SSE working)

### 4.1 React Hooks

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 4.1.1 | Create useTokenUsage hook | `src/hooks/useTokenUsage.ts` | React Query works |
| 4.1.2 | Create useBudget hook | `src/hooks/useBudget.ts` | Returns budget data |
| 4.1.3 | Create useProjections hook | `src/hooks/useProjections.ts` | Returns projections |
| 4.1.4 | Create useTokenEvents hook (SSE) | `src/hooks/useTokenEvents.ts` | SSE subscription works |

### 4.2 SSE Provider Component

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 4.2.1 | Create SSEProvider context | `src/components/tokens/SSEProvider.tsx` | Context works |
| 4.2.2 | Implement EventSource connection | `SSEProvider.tsx` | Connects |
| 4.2.3 | Implement reconnection logic | `SSEProvider.tsx` | Reconnects on error |
| 4.2.4 | Implement event buffering | `SSEProvider.tsx` | Buffers last 100 |
| 4.2.5 | Create useSSE hook | `SSEProvider.tsx` | Returns context |

### 4.3 Budget Health Indicator

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 4.3.1 | Create BudgetHealthIndicator component | `src/components/tokens/BudgetHealthIndicator.tsx` | Renders |
| 4.3.2 | Implement progress bar | Component | Shows percentage |
| 4.3.3 | Implement color coding (green/yellow/red) | Component | Colors correct |
| 4.3.4 | Implement threshold markers | Component | 80%/100% visible |
| 4.3.5 | Add animation on update | Component | Animates smoothly |

### 4.4 Token Burn Chart

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 4.4.1 | Create TokenBurnChart component | `src/components/tokens/TokenBurnChart.tsx` | Renders |
| 4.4.2 | Install Recharts | `package.json` | `npm install recharts` |
| 4.4.3 | Implement area chart | Component | Time-series displays |
| 4.4.4 | Add phase boundary markers | Component | Vertical lines show |
| 4.4.5 | Add projected vs actual comparison | Component | Both lines visible |
| 4.4.6 | Add tooltip with details | Component | Hover shows data |
| 4.4.7 | Add time range selector | Component | Filter works |

### 4.5 Agent Attribution Chart

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 4.5.1 | Create AgentAttributionPie component | `src/components/tokens/AgentAttributionPie.tsx` | Renders |
| 4.5.2 | Implement pie/donut chart | Component | Chart displays |
| 4.5.3 | Add legend with percentages | Component | Legend shows |
| 4.5.4 | Add click-to-filter | Component | Filters main view |

### 4.6 Phase Progress Timeline

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 4.6.1 | Create PhaseProgressTimeline component | `src/components/tokens/PhaseProgressTimeline.tsx` | Renders |
| 4.6.2 | Implement Gantt-style layout | Component | Rows display |
| 4.6.3 | Add estimated vs actual bars | Component | Both visible |
| 4.6.4 | Add health indicators per phase | Component | Green/yellow/red |
| 4.6.5 | Add click-to-expand details | Component | Details show |

### 4.7 Threshold Alert Component

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 4.7.1 | Create ThresholdAlert component | `src/components/tokens/ThresholdAlert.tsx` | Renders |
| 4.7.2 | Subscribe to SSE events | Component | Receives events |
| 4.7.3 | Show warning banner at 80% | Component | Banner appears |
| 4.7.4 | Show action required modal at 100% | Component | Modal appears |
| 4.7.5 | Add approve/continue button | Component | Approval works |

### 4.8 Dashboard Pages

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 4.8.1 | Create /dashboard/tokens overview | `src/app/dashboard/tokens/page.tsx` | Page loads |
| 4.8.2 | Create /dashboard/tokens/projects/:id | `src/app/dashboard/tokens/projects/[projectId]/page.tsx` | Page loads |
| 4.8.3 | Create /dashboard/tokens/budgets | `src/app/dashboard/tokens/budgets/page.tsx` | Page loads |
| 4.8.4 | Add loading states | `loading.tsx` | Skeleton shows |
| 4.8.5 | Add error states | `error.tsx` | Error handled |
| 4.8.6 | Add navigation sidebar updates | Layout | Links work |

**🔴 BREAKPOINT 4**: Dashboard working — real-time updates, charts, budget management.

---

## Phase 5: Premium Polish

**Estimated Effort**: 8-10 days  
**Dependencies**: Phase 4 complete

### 5.1 Subscription Tiers

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 5.1.1 | Create subscription service | `src/lib/subscription.ts` | Tier checks work |
| 5.1.2 | Add tier-based feature gating | Components | Features hidden for free tier |
| 5.1.3 | Create subscription settings page | `src/app/dashboard/settings/subscription/page.tsx` | Page loads |
| 5.1.4 | Add upgrade prompts in locked features | Components | CTAs show |

### 5.2 Export Functionality (Enterprise)

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 5.2.1 | Create UsageExportButton component | `src/components/tokens/UsageExportButton.tsx` | Renders |
| 5.2.2 | Create GET /api/v1/tokens/export route | `src/app/api/v1/tokens/export/route.ts` | Route responds |
| 5.2.3 | Implement CSV export | Route | CSV downloads |
| 5.2.4 | Implement JSON export | Route | JSON downloads |
| 5.2.5 | Add enterprise tier check | Route | Blocked for lower tiers |

### 5.3 Billing Integration (Future)

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 5.3.1 | Create invoice preview component | `src/components/tokens/InvoicePreview.tsx` | Renders |
| 5.3.2 | Calculate monthly cost from usage | Component | Calculation correct |
| 5.3.3 | Add Stripe integration (placeholder) | Future | Documented |

### 5.4 Performance Optimization

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 5.4.1 | Add Redis caching for dashboard queries | APIs | Cache working |
| 5.4.2 | Optimize TimescaleDB queries | `timescale.ts` | Queries fast |
| 5.4.3 | Add continuous aggregate refresh | TimescaleDB | Aggregates current |
| 5.4.4 | Load test with 100 concurrent users | Manual | SSE scales |

### 5.5 FEATURES.md Documentation

| Step | Action | File(s) | Verification |
|------|--------|---------|--------------|
| 5.5.1 | Create tokens API FEATURES.md | `src/app/api/v1/tokens/FEATURES.md` | Documented |
| 5.5.2 | Create budgets API FEATURES.md | `src/app/api/v1/budgets/FEATURES.md` | Documented |
| 5.5.3 | Create components FEATURES.md | `src/components/tokens/FEATURES.md` | Documented |
| 5.5.4 | Update root FEATURES.md | `FEATURES.md` | Complete |

**🔴 BREAKPOINT 5**: Premium features complete — tiers enforced, export working, performance optimized.

---

## Cross-Phase Verification

### Final Checklist

- [ ] All Prisma migrations applied
- [ ] TimescaleDB schema created
- [ ] All API endpoints respond correctly
- [ ] Budget enforcement working at all thresholds
- [ ] SSE events delivered in <500ms
- [ ] Dashboard components render correctly
- [ ] Real-time updates working
- [ ] Projections returning reasonable estimates
- [ ] Tier-based feature gating working
- [ ] Export functionality working (Enterprise)
- [ ] All FEATURES.md files complete

### Quality Gates

| Gate | Command | Requirement |
|------|---------|-------------|
| Lint | `npm run lint` | No errors |
| TypeCheck | `npm run typecheck` | No errors |
| Tests | `npm test` | All pass, >80% coverage on core logic |
| Build | `npm run build` | Production build succeeds |

---

## Definition of Done

- [ ] All phases complete
- [ ] All FEATURES.md files updated and versioned
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual E2E testing complete
- [ ] Performance verified (<200ms p95 latency)
- [ ] Security review complete
- [ ] Documentation complete
- [ ] Deployed to staging
- [ ] Stakeholder acceptance

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| TimescaleDB performance issues | Use continuous aggregates, optimize queries |
| SSE scalability | Fall back to WebSocket or polling if needed |
| Projection accuracy | Start with simple averages, improve over time |
| Budget enforcement bypass | Multiple check points, audit logging |
| Token count mismatch | Verify against API response, reconciliation |
