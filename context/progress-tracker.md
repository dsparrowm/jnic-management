# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

**Phase 3 — Profiles + Pastor Directory (next)**

Phase 2 complete. Begin Epic 2 per `context/feature-specs/` (profiles spec TBD).

## Scope Decisions

| Decision | Value |
| -------- | ----- |
| Foundation | Greenfield Turborepo in `jnic_management` |
| Admin vs HQ Admin | **Same role** (`ADMIN`) |
| Lead Pastor | Separate role above Admin — org approvals + national summary sign-off |
| Hierarchy | Branch → Zone → State → HQ |
| Admin Staff | Same weekly submission rights as Branch Pastor |
| Currency | NGN default; `currency` field stored on finance records |
| Multi-branch pastors | 1:1 for MVP |
| Report cutoff | Sunday week end; missed flag Monday 23:59 Africa/Lagos |
| UX reference | `rokswood-hive-web` shell (patterns only); `jubilee-nation` for report forms only |

## Phase Completion Checklist

| Phase | Item | Status |
| ----- | ---- | ------ |
| 0 | Context files (`AGENTS.md`, `context/*`) | Done |
| 0 | Turborepo scaffold (`apps/web`, `apps/api`, packages) | Done |
| 0 | Docker Compose (Postgres + Redis) | Done |
| 0 | Prisma base schema + initial migration | Done |
| 0 | `pnpm build` passes | Done |
| 0 | API deployed to Render (`GET /health`) | Done |
| 0 | Web status page (localhost:3000) | Done |
| 1 | Auth + onboarding (Epic 1) | Done |
| 2 | Org structure + LP approvals | Done |
| 3 | Profiles + pastor directory (Epic 2) | In progress |
| 4 | Weekly reports + attendance + finance | Not started |
| 5 | Hierarchy views + feedback | Not started |
| 6 | Monthly aggregation + LP summary approval | Not started |
| 7 | Hardening, tests, deploy | Not started |

## Current Goal

Phase 3 — Pastor directory live; next: R2 profile pictures and `/profile` page.

## Milestone Status

| Phase | Status |
| ----- | ------ |
| **0 — Context & Scaffold** | **Complete** |
| **1 — Auth + Onboarding** | **Complete** |
| **2 — Org + LP Approvals** | **Complete** |
| **3 — Profiles** | **Next (active)** |
| 4 — Weekly Reports | Blocked |
| 5 — Hierarchy + Feedback | Blocked |
| 6 — Monthly Aggregation | Blocked |
| 7 — Hardening | Blocked |

## Completed

### Phase 3 onboard slide-over (2026-07-10)

- Onboard pastor form moved to slide-over on `/admin/pastors` (removed from sidebar)
- Premium sectioned form: personal details + role/org assignment
- `/admin/onboard` redirects to `/admin/pastors?onboard=1`

### Phase 3 pastors directory (2026-07-10)

- `GET /users/pastors` — paginated directory with org joins, filters, summary counts
- Premium `/admin/pastors` — table + card views, filter bar, resend/deactivate actions
- Nav: Users → Pastors; `/admin/users` redirects to `/admin/pastors`

### Phase 3 shell (2026-07-10)

- Rokswood-style app shell — white collapsible sidebar, top header, role-filtered nav
- shadcn/ui primitives: `Button`, `Avatar`, `DropdownMenu`
- Updated `context/ui-context.md` — Rokswood shell reference, JNIC gold primary
- All authenticated pages migrated to new `DashboardShell`

### Phase 2 (2026-07-10)

- NestJS `org` module — tree, branch CRUD, change-request propose/approve/reject
- RBAC: Admin for org CRUD; Lead Pastor for approvals
- Seed: Lagos State → Victoria Island → VI Main Campus; Lead Pastor (`lead@jnic.org`)
- Web: `/admin/org`, `/approvals/org`, org selectors on onboard form
- `pnpm build` passes

### Phase 1 (2026-07-10)

- JWT auth (login, refresh, logout) with `RefreshToken` table
- Admin onboarding API — create pending user, 48h token, Resend email (sync)
- Onboarding validate/complete endpoints with auto-login
- Users API — `GET /users/me`, `GET /users`, deactivate
- Global `JwtAuthGuard` + `@Public()` + `RolesGuard`
- Seed admin user (`admin@jnic.org`)
- Web: `/login`, `/onboard/[token]`, `/dashboard`, `/admin/onboard`, `/admin/users`
- `pnpm build` passes

**Deferred from Phase 1 spec:** BullMQ email queue; reassign UI (API exists).

### Onboarding email service (2026-07-12)

- Upgraded `EmailService` — Resend + React Email template (nexgen pattern)
- JNIC-branded onboarding invite with gold CTA, 48h expiry notice, dev link fallback
- `pnpm --filter @repo/api test:email` script for manual delivery tests

### Phase 0 (2026-07-10)

- Turborepo monorepo: `apps/web`, `apps/api`, `packages/database`, `packages/types`, `packages/typescript-config`
- `docker-compose.yml` — Postgres 16 + Redis 7
- Prisma schema — User, State, Zone, Branch, OrgChangeRequest, WeeklyReport, Attendance, Finance, Feedback, MonthlySummary, Notification
- Initial migration: `packages/database/prisma/migrations/20260710120000_init/`
- Shared enums in `@repo/types` (Role, UserStatus, ReportStatus, etc.)
- NestJS API with `GET /health` on port 4000
- Next.js 15 web with JNIC design tokens and API status page on port 3000
- `.env.example`, root `README.md` with dev instructions
- API deployed to Render via `scripts/render-build.sh`

### Context (2026-07-10)

- Full `context/` file set + `AGENTS.md` + `.cursor/rules/jnlop-core.mdc`

## Next Up

1. R2 presigned upload for profile pictures (Epic 2)
2. Profile page for all pastors (`/profile`)

## Feature Unit Queue (Phase 3)

| Order | Unit | Status |
| ----- | ---- | ------ |
| 0 | Rokswood-style app shell (sidebar, header, shadcn) | Done |
| 1 | R2 files module + presigned upload API | Not started |
| 2 | Profile page + default avatar | Not started |
| 3 | Admin pastor directory with filters | Done |

## Architecture Decisions

- Context files follow unifycomply pattern (`AGENTS.md` + `context/` folder)
- Lead Pastor approval workflow via `OrgChangeRequest` entity
- `packages/types` is single source for shared enums between web and API
- API `tsconfig.build.json` is standalone (does not inherit broken `baseUrl` from shared nestjs config)
- Web fonts use system stack in Phase 0 (no `next/font` Google fetch at build time)
- New states/zones require LP approval; branches created directly by Admin

## Open Questions

| # | Question | Status |
| - | -------- | ------ |
| 1 | Resend vs AWS SES for email | Resolved: Resend |
| 2 | Railway vs Render for API hosting | Open — decide at Phase 7 |

## Session Notes

- 2026-07-10: Plan confirmed — greenfield Turborepo; Admin = HQ Admin; Lead Pastor above Admin
- 2026-07-10: Context files created
- 2026-07-10: API deployed to Render — build via `scripts/render-build.sh`, health check live
- 2026-07-10: Phase 1 auth + onboarding implemented; build passes
- 2026-07-10: Phase 2 org module + web pages started
