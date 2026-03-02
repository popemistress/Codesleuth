# Pre-Flight Checklist: Token Budget Management System

**Version**: 1.0  
**TDD Reference**: TDD-token-budget-system-v1.0.md  
**Date**: 2026-02-05  

---

## 📋 Pre-Implementation Validation

Before beginning implementation, verify all prerequisites are met.

---

## 1. Environment Prerequisites

### 1.1 Development Environment

| Requirement | Check | Notes |
|-------------|-------|-------|
| ☐ | Node.js 20+ installed | `node -v` |
| ☐ | npm 10+ installed | `npm -v` |
| ☐ | Docker installed and running | `docker --version` |
| ☐ | Docker Compose available | `docker-compose --version` |
| ☐ | Git configured | `git config --list` |
| ☐ | VS Code or preferred IDE | IDE available |

### 1.2 Existing Infrastructure

| Requirement | Check | Verification |
|-------------|-------|--------------|
| ☐ | PostgreSQL Docker container exists | `docker ps | grep postgres` |
| ☐ | PostgreSQL accessible on port 5432 | `psql -h localhost -p 5432 -U codesleuth -c "SELECT 1"` |
| ☐ | Redis Docker container exists | `docker ps | grep redis` |
| ☐ | Redis accessible on port 6379 | `redis-cli ping` |
| ☐ | Next.js application builds | `npm run build` |
| ☐ | Prisma migrations up to date | `npx prisma migrate status` |

---

## 2. Code Prerequisites

### 2.1 Existing Files Verified

| File | Check | Purpose |
|------|-------|---------|
| ☐ | `package.json` exists | Dependencies |
| ☐ | `prisma/schema.prisma` exists | Database schema |
| ☐ | `src/lib/auth.ts` exists | Authentication |
| ☐ | `src/lib/auth.config.ts` exists | Auth configuration |
| ☐ | `src/lib/db.ts` exists | Prisma client |
| ☐ | `src/lib/redis.ts` exists | Redis client |
| ☐ | `.env.example` exists | Environment template |
| ☐ | `.env` exists with valid values | Environment config |

### 2.2 Dependencies Present

Run `npm list <package>` to verify:

| Package | Check | Version |
|---------|-------|---------|
| ☐ | next | 16.x |
| ☐ | react | 19.x |
| ☐ | prisma | 7.x |
| ☐ | @prisma/client | 7.x |
| ☐ | next-auth | 5.x |
| ☐ | @auth/prisma-adapter | 2.x |
| ☐ | pg | 8.x |
| ☐ | ioredis | Latest |
| ☐ | zod | 3.x |

### 2.3 New Dependencies to Install

```bash
# Chart library
npm install recharts

# PostgreSQL pool for TimescaleDB
# (pg already exists, verify it's installed)
npm list pg
```

---

## 3. Configuration Prerequisites

### 3.1 Environment Variables (Existing)

Verify these are set in `.env`:

| Variable | Check | Example |
|----------|-------|---------|
| ☐ | `DATABASE_URL` | `postgresql://codesleuth:...@localhost:5432/codesleuth` |
| ☐ | `REDIS_URL` | `redis://localhost:6379` |
| ☐ | `AUTH_SECRET` | 32-byte random string |
| ☐ | `AUTH_URL` | `http://localhost:3100` |
| ☐ | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3100` |

### 3.2 Environment Variables (New - to be added)

| Variable | Check | Example | Notes |
|----------|-------|---------|-------|
| ☐ | `TIMESCALE_URL` | `postgresql://codesleuth:...@localhost:5433/codesleuth_metrics` | New service |
| ☐ | `TIMESCALE_PASSWORD` | Secure password | Docker env |
| ☐ | `ORCHESTRATOR_SECRET` | 32-byte random string | Internal auth |
| ☐ | `ANTHROPIC_API_KEY` | `sk-ant-...` | AI provider |
| ☐ | `OPENAI_API_KEY` | `sk-...` | AI provider (optional) |
| ☐ | `FEATURE_TOKEN_DASHBOARD` | `true` | Feature flag |

### 3.3 OAuth Providers (Existing)

| Provider | Check | Variables |
|----------|-------|-----------|
| ☐ | GitHub OAuth configured | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| ☐ | Google OAuth configured | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

---

## 4. Docker Prerequisites

### 4.1 Available Ports

| Port | Check | Service |
|------|-------|---------|
| ☐ | 5432 available or already used by postgres | PostgreSQL |
| ☐ | 5433 available | TimescaleDB (NEW) |
| ☐ | 6379 available or already used by redis | Redis |
| ☐ | 3100 available | Next.js dev server |

Verify with: `lsof -i :<port>` or `netstat -an | grep <port>`

### 4.2 Docker Resources

| Resource | Check | Notes |
|----------|-------|-------|
| ☐ | Docker daemon running | `docker info` |
| ☐ | At least 4GB RAM available for Docker | Docker Desktop settings |
| ☐ | At least 10GB disk space | For volumes |

---

## 5. Schema Prerequisites

### 5.1 Existing Prisma Models (Verify Present)

| Model | Check | Notes |
|-------|-------|-------|
| ☐ | `User` | Existing auth model |
| ☐ | `Account` | OAuth accounts |
| ☐ | `Session` | User sessions |
| ☐ | `VerificationToken` | Email verification |

### 5.2 Models to be Added

| Model | Purpose |
|-------|---------|
| `Project` | Agent execution projects |
| `Phase` | Project phases |
| `Agent` | Agent types |
| `Budget` | Token budgets |
| `ModelPricing` | Cost configuration |
| `Subscription` | User tiers |

### 5.3 Enums to be Added

| Enum | Values |
|------|--------|
| `ProjectStatus` | ACTIVE, PAUSED, COMPLETED, ARCHIVED |
| `PhaseStatus` | PENDING, IN_PROGRESS, COMPLETED, FAILED, PAUSED |
| `AgentType` | PRODUCT_DISCOVERY, TECHNICAL_DESIGN, BUILDER, SECURITY, VERIFIER, CRITIC |
| `SubscriptionTier` | FREE, PREMIUM, ENTERPRISE |

---

## 6. API Prerequisites

### 6.1 Existing API Routes (Verify Present)

| Route | Check | Purpose |
|-------|-------|---------|
| ☐ | `/api/auth/[...nextauth]` | Auth endpoints |
| ☐ | `/api/contact` | Contact form |
| ☐ | `/api/subscribe` | Newsletter |

### 6.2 API Routes to be Added

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/v1/tokens/record` | POST | Record token usage |
| `/api/v1/tokens/usage` | GET | Get usage data |
| `/api/v1/tokens/events/[projectId]` | GET | SSE stream |
| `/api/v1/tokens/export` | GET | Export (Enterprise) |
| `/api/v1/budgets` | GET, POST | Budget management |
| `/api/v1/budgets/[projectId]` | GET, PATCH | Single budget |
| `/api/v1/budgets/[projectId]/approve` | POST | Budget approval |
| `/api/v1/projections/[projectId]` | GET | Cost projections |
| `/api/v1/projects` | GET, POST | Project management |
| `/api/v1/projects/[projectId]` | GET, PATCH, DELETE | Single project |

---

## 7. UI Prerequisites

### 7.1 Existing Components (Verify Available)

| Component | Check | Notes |
|-----------|-------|-------|
| ☐ | Dashboard layout exists | `/dashboard` routes |
| ☐ | Auth UI exists | Login/Register pages |
| ☐ | Toast/Notification system | Sonner or similar |
| ☐ | Loading states pattern | Skeleton loaders |
| ☐ | Error boundary pattern | Error pages |

### 7.2 Components to be Added

| Component | Purpose |
|-----------|---------|
| `TokenOverview` | All projects summary |
| `ProjectTokenDashboard` | Single project view |
| `BudgetHealthIndicator` | Budget status visual |
| `TokenBurnChart` | Time-series chart |
| `AgentAttributionPie` | Agent cost breakdown |
| `PhaseProgressTimeline` | Gantt-style timeline |
| `BudgetConfigForm` | Budget setup |
| `ThresholdAlert` | Real-time warnings |
| `UsageExportButton` | Export functionality |
| `SSEProvider` | SSE connection context |

---

## 8. Testing Prerequisites

### 8.1 Testing Infrastructure

| Requirement | Check | Notes |
|-------------|-------|-------|
| ☐ | Jest configured | `npm test` works |
| ☐ | TypeScript strict mode | `tsconfig.json` |
| ☐ | ESLint configured | `npm run lint` works |

### 8.2 Test Database

| Requirement | Check | Notes |
|-------------|-------|-------|
| ☐ | Test database strategy defined | Separate DB or transaction rollback |
| ☐ | Test environment variables | `.env.test` if needed |

---

## 9. Security Prerequisites

### 9.1 Security Checklist (Verify Existing)

| Requirement | Check | Notes |
|-------------|-------|-------|
| ☐ | HTTPS enforced in production | Middleware |
| ☐ | CSRF protection enabled | NextAuth built-in |
| ☐ | Rate limiting configured | `src/lib/rate-limit.ts` |
| ☐ | Input validation with Zod | API routes |
| ☐ | SQL injection prevention | Prisma parameterized |

### 9.2 Security Items to Add

| Item | Purpose |
|------|---------|
| HMAC internal auth | Service-to-service calls |
| Project ownership checks | Authorization |
| Tier-based feature gating | Premium enforcement |
| SSE connection limits | DoS prevention |

---

## 10. Knowledge Prerequisites

### 10.1 Review Required Documents

| Document | Check | Location |
|----------|-------|----------|
| ☐ | TDD reviewed | `docs/tdd/TDD-token-budget-system-v1.0.md` |
| ☐ | Platform Architecture reviewed | `docs/platform/PLATFORM-token-budget-system-v1.0.md` |
| ☐ | Implementation Plan reviewed | `docs/impl/IMPL-token-budget-system-v1.0.md` |
| ☐ | Feature Spec reviewed | `docs/FEATURES-token-budget-system.md` |
| ☐ | AI Instructions reviewed | `docs/ai-instructions/AI-INSTRUCTIONS-token-budget-system-web.md` |

### 10.2 External Documentation

| Topic | Check | Resource |
|-------|-------|----------|
| ☐ | TimescaleDB basics understood | [TimescaleDB Docs](https://docs.timescale.com/) |
| ☐ | Prisma migrations understood | [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) |
| ☐ | SSE implementation understood | [MDN EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) |
| ☐ | Recharts usage understood | [Recharts Docs](https://recharts.org/) |

---

## 11. Final Validation

### 11.1 Commands to Run

```bash
# 1. Verify Docker is running
docker info

# 2. Check existing containers
docker ps

# 3. Verify PostgreSQL connection
psql $DATABASE_URL -c "SELECT version()"

# 4. Verify Redis connection
redis-cli -u $REDIS_URL ping

# 5. Run type check
npm run typecheck

# 6. Run linter
npm run lint

# 7. Run build
npm run build
```

### 11.2 Pre-Flight Approval

| Gate | Status |
|------|--------|
| ☐ | All environment prerequisites met |
| ☐ | All code prerequisites met |
| ☐ | All configuration prerequisites met |
| ☐ | All Docker prerequisites met |
| ☐ | All security prerequisites reviewed |
| ☐ | All documentation reviewed |

---

## ✅ Ready to Implement

Once all items are checked, proceed with Phase 0 of the Implementation Plan.

**First Step**: Create/update `docker-compose.yml` with TimescaleDB service.

---

## 🚨 Blockers

If any prerequisite fails, document the blocker here:

| Blocker | Resolution | Status |
|---------|------------|--------|
| _Example: PostgreSQL not accessible_ | _Restart Docker container_ | _Pending/Resolved_ |
| | | |
| | | |
| | | |
