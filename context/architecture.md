# Architecture Context

## Stack

| Layer | Technology | Role |
| ----- | ---------- | ---- |
| Monorepo | Turborepo | Shared types, coordinated builds |
| Frontend | Next.js 15 App Router + TypeScript | Dashboard UI, SSR where helpful |
| Backend | NestJS (modular monolith) | REST API, RBAC guards, business logic |
| Database | PostgreSQL 16 | Relational org hierarchy and reports |
| ORM | Prisma (`packages/database`) | Schema, migrations, type-safe queries |
| Cache / Queue | Redis 7 + BullMQ | Sessions cache, background jobs |
| File storage | Cloudflare R2 | Profile pictures (S3-compatible) |
| Auth | JWT (access + refresh) | Stateless API auth |
| Email | Resend | Onboarding links, feedback notifications |
| UI | Tailwind CSS 4 + shadcn/ui | Components and design tokens |
| Forms | React Hook Form + Zod | Web validation; class-validator on API |
| Data fetching | TanStack Query | Server state on web |

**Hosting (target):** Vercel (web) + Railway or Render (API, DB, Redis).

## Repository Layout

```
jnic_management/
├── apps/
│   ├── web/                    # Next.js 15 dashboard
│   │   ├── app/                # App Router routes
│   │   ├── components/         # UI, layout, feature sections
│   │   └── lib/                # API client, hooks, auth helpers
│   └── api/                    # NestJS application
│       └── src/
│           ├── auth/
│           ├── users/
│           ├── onboarding/
│           ├── org/
│           ├── reports/
│           ├── feedback/
│           ├── summaries/
│           ├── notifications/
│           └── files/
├── packages/
│   ├── database/               # Prisma schema + client export
│   ├── types/                  # Shared enums, DTOs, API contracts
│   └── eslint-config/          # Shared lint/tsconfig bases
├── context/                    # Agent context (this folder)
├── docker-compose.yml          # Postgres + Redis for local dev
├── turbo.json
└── package.json
```

## System Boundaries

```
┌─────────────────┐
│   apps/web       │  ← Role-aware dashboard, forms, drill-down views
└────────┬─────────┘
         │ REST / HTTPS (JWT)
┌────────▼─────────┐
│   apps/api       │  ← RBAC guards, business rules, job producers
└───┬───────┬──────┘
    │       │
┌───▼───┐ ┌─▼─────┐   ┌──────────────┐
│Postgres│ │ Redis │   │ Cloudflare R2 │
└────────┘ └───┬───┘   └──────────────┘
               │
        ┌──────▼──────┐
        │ BullMQ jobs  │
        └──────────────┘
```

- **`apps/web`** owns routing, page composition, client state, and API client calls
- **`apps/api`** owns authorization, validation, persistence, and job enqueueing
- **`packages/database`** owns Prisma schema and generated client — sole DB access path
- **`packages/types`** owns shared enums (`Role`, `ReportStatus`, etc.) used by both apps

## NestJS Modules

| Module | Responsibility |
| ------ | -------------- |
| `auth` | Login, JWT refresh, password set via onboarding token, guards |
| `users` | Profile, deactivate, reassign, pastor directory |
| `onboarding` | Admin creates pending user, token, resend, email job |
| `org` | States, zones, branches; `OrgChangeRequest` workflow |
| `reports` | Weekly report CRUD, status progression, edit lock |
| `feedback` | Create/list feedback on reports |
| `summaries` | Monthly aggregation reads + HQ approval workflow |
| `notifications` | In-app list + email dispatch via queue |
| `files` | R2 presigned URLs for profile pictures |

## Core Data Model

### User

- `role`: `LEAD_PASTOR | ADMIN | STATE_PASTOR | ZONAL_PASTOR | BRANCH_PASTOR | ADMIN_STAFF`
- `status`: `PENDING | ACTIVE | DEACTIVATED`
- `onboardingToken`, `onboardingTokenExpiry`
- Org FKs: `stateId`, `zoneId`, `branchId` (nullable per role)
- `createdById` → User (Admin who onboarded)
- `profilePicUrl`

### Org

- **State** — `name`, `statePastorId`
- **Zone** — `name`, `stateId`, `zonalPastorId`
- **Branch** — `name`, `zoneId`, `address`, `branchPastorId`
- **OrgChangeRequest** — `type` (CREATE_STATE, CREATE_ZONE), `payload`, `status`
  (PENDING_LP_APPROVAL, APPROVED, REJECTED), `requestedById`, `reviewedById`

### Reporting

- **WeeklyReport** — `branchId`, `serviceDate`, `weekOf`, `status`
  (SUBMITTED → ZONE_REVIEWED → STATE_REVIEWED → HQ_REVIEWED), `submittedById`
- **Attendance** — `adultCount`, `teenageCount`, `childrenCount` (1:1 with report)
- **Finance** — `tithe`, `offering`, `other`, `currency` (default NGN)
- **Feedback** — `reportId`, `fromUserId`, `toUserId`, `message` (informational only)
- **MonthlySummary** — `scopeType` (BRANCH/ZONE/STATE/HQ), `scopeId`, `month`, `year`,
  attendance/finance totals; HQ scope includes `PENDING_LP_APPROVAL` status
- **Notification** — in-app + email queue payload

### Visibility Rule

No separate permissions table. Scope derived from user's role + org FKs.

Example: Zonal Pastor queries reports where `branch.zoneId = user.zoneId`.

## Background Jobs (BullMQ)

| Job | Trigger |
| --- | ------- |
| Send onboarding email | On user create / resend |
| Send feedback notification | On feedback create |
| Compute monthly summaries | Cron 1st of month + on-demand |
| Flag missed weekly submissions | Cron Monday EOD (Africa/Lagos) |

## RBAC Matrix (API-enforced)

| Action | Lead Pastor | Admin | State | Zonal | Branch | Admin Staff |
| ------ | :---------: | :---: | :---: | :---: | :----: | :---------: |
| Onboard / deactivate / reassign | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Approve org changes | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Approve national monthly summary | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Submit weekly report | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| View national dashboard | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| View state reports | ✓ | ✓ | ✓ (own) | ✗ | ✗ | ✗ |
| View zone reports | ✓ | ✓ | ✓ | ✓ (own) | ✗ | ✗ |
| Leave feedback | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |

## Component Boundaries (Web)

- **App shell** — Sidebar (role-filtered nav), header, user menu
- **Container pages** — Fetch via TanStack Query; pass props to presentational sections
- **Presentational sections** — Stat cards, report tables, feedback thread; no direct fetch
- **API client** — `apps/web/lib/api/*` wraps fetch with JWT; no raw fetch in components

## State Model

- **Auth** — Access token in memory or httpOnly cookie; refresh flow via API
- **Server state** — TanStack Query hooks in `apps/web/lib/hooks/`
- **Form state** — React Hook Form + Zod schemas colocated with forms
- **RBAC (web)** — Mirror API permissions for nav gating; API is source of truth

## Invariants

1. RBAC enforced in NestJS guards — UI hiding is not sufficient
2. Feedback never blocks report status progression
3. Weekly reports locked for edit once `status >= ZONE_REVIEWED`
4. Deactivated users cannot authenticate; historical data preserved
5. Org hierarchy changes for new states/zones require Lead Pastor approval
6. National `MonthlySummary` requires Lead Pastor approval before `APPROVED`
7. Components do not access Prisma directly — only `apps/api` via REST
8. Shared enums and DTOs live in `packages/types` — no duplication across apps
9. One feature unit per implementation step per `context/mvp-roadmap.md`
10. Do not import from `jubilee-nation` — UX reference only

## Local Development

```bash
docker compose up -d          # Postgres + Redis
pnpm install
pnpm db:migrate               # Prisma migrate (once scaffolded)
pnpm dev                      # turbo dev — web :3000, api :4000
```

Environment variables documented in `.env.example` (created during Phase 0 scaffold).
