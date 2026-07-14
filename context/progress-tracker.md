# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

**Phase 6 — Monthly aggregation + LP summary approval (in progress)**

Pastor reassign UI shipped. Monthly summaries API + web pages implemented; BullMQ cron deferred.

## Scope Decisions

| Decision | Value |
| -------- | ----- |
| Foundation | Greenfield Turborepo in `jnic_management` |
| Admin vs HQ Admin | **Same role** (`ADMIN`) |
| Lead Pastor | Separate role above Admin — org approvals + national summary sign-off |
| Hierarchy | Branch → Zone → State → HQ |
| Admin Staff | Removed — only pastors (+ platform ADMIN) use JNLOP |
| Dual-scope pastors | STATE/ZONAL pastors may optionally have one home `branchId` for weekly submit |
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
| 3 | Profiles + pastor directory (Epic 2) | Done |
| 4 | Weekly reports + attendance + finance | Done |
| 5 | Hierarchy views + feedback | Done |
| 6 | Monthly aggregation + LP summary approval | In progress |
| 7 | Hardening, tests, deploy | Not started |

## Current Goal

Phase 6 — Monthly summaries on-demand compute + Lead Pastor national approval UI.

## Milestone Status

| Phase | Status |
| ----- | ------ |
| **0 — Context & Scaffold** | **Complete** |
| **1 — Auth + Onboarding** | **Complete** |
| **2 — Org + LP Approvals** | **Complete** |
| **3 — Profiles** | **Complete** |
| **4 — Weekly Reports** | **Complete** |
| **5 — Hierarchy + Feedback** | **Complete** |
| **6 — Monthly Aggregation** | **In progress** |
| 7 — Hardening | Blocked |

## Completed

### Pastor reassign UI + monthly summaries (2026-07-14)

- **US-1.3 reassign UI** — `ReassignPastorSheet` on `/admin/pastors`; active pastors only; reuses org selectors + `PATCH /users/:id/reassign`
- **US-3.6 monthly summaries** — `SummariesModule` with on-demand compute from weekly reports
  - `GET /summaries/monthly?month=&year=` — scoped branch/zone/state/HQ views
  - `GET /summaries/monthly/pending-approval` + `POST /summaries/monthly/:id/approve` — Lead Pastor national sign-off
  - Web `/summaries` (month picker, totals + weekly breakdown) and `/approvals/summaries`
  - Nav: Monthly Summaries (pastor roles + Admin/LP); Summary Approvals (LP only)
- **Deferred:** BullMQ `compute-monthly-summaries` cron (on-demand on list for now)
- `pnpm build` passes

### Admin dashboard overview redesign (2026-07-13)

- `/dashboard` for `ADMIN` and `LEAD_PASTOR` — live overview with org and weekly reporting KPIs
- **Attendance trend** (12-week multi-line chart) + **Finance by state** (stacked horizontal bars + summary table)
- `GET /reports/national/analytics` — aggregates all branch weekly reports (not forward-gated)
- Week picker drives chart anchor week; `recharts` + JNIC chart tokens
- Trimmed redundant panels (org list, notifications, quick actions) to prioritize charts
- Other roles keep role-scoped shortcut cards on `/dashboard`
- `pnpm build` passes

### Admin organisation page redesign (2026-07-13)

- `POST /org/states` and `POST /org/zones` — admin direct create (no LP approval)
- Redesigned `/admin/org` — premium header, expandable hierarchy panel, slide-over create flows
- Cascading state → zone selectors on branch/zone forms; pastor assignment stays on `/admin/pastors`
- Org Approvals nav item removed (legacy `/approvals/org` route retained)
- `pnpm build` passes

### Cascading bundle report flow (2026-07-13)

- `HierarchyWeeklyRollup` entity — zone/state bundles with `IN_REVIEW` / `FORWARDED` / `STALE`
- `POST /reports/zone/:weekOf/forward` — zonal pastor forwards zone report to state
- `POST /reports/state/:weekOf/forward` — state pastor forwards state report to HQ
- Visibility gated: state sees branches only after zone forward; HQ sees states only after state forward
- Late branch submissions mark parent rollup `STALE`; re-forward pushes updates upward
- Removed auto-advance-on-view; status progresses on explicit forward
- Web: forward CTAs on zone/state pages; rollup status badges; national empty state
- `pnpm build` passes

### Phase 5 feedback threads + notifications (2026-07-13)

- `POST/GET /reports/:id/feedback` — scoped by report visibility; Zonal/State/LP/Admin can leave feedback
- In-app `Notification` records + `GET /notifications`, `PATCH /notifications/:id/read`
- Email notification to report submitter via Resend (dev-safe when unconfigured)
- `FeedbackThread` on report detail sheet (zone/state/national) and submit page (read-only for submitters)
- Header notification bell with unread badge
- `pnpm build` passes

### Dual-scope pastor onboarding + remove ADMIN_STAFF (2026-07-13)

- Removed `ADMIN_STAFF` role from Prisma, shared types, API, web, and docs
- `packages/types/src/org-assignment.ts` — shared org FK rules + `canSubmitWeeklyReports`
- API validates/normalizes org assignments on onboard + reassign
- Onboard UI: optional home branch for State/Zonal pastors
- Weekly submit gated by `branchId` + pastor role (dual-scope supported)
- Seed: `zonal@jnic.org` dual-scope with `branchId` on VI Main Campus
- `pnpm build` passes

### Phase 5 state + national reports (2026-07-12)

- `GET /reports/state/summary` — zones with branch drill-down, state totals, missed flags
- `GET /reports/national/summary` — states → zones → branches for Lead Pastor / Admin
- Status progression chain: Zonal → `ZONE_REVIEWED`, State → `STATE_REVIEWED`, HQ → `HQ_REVIEWED`
- Web `/reports/state` and `/reports/national` with week picker, summary stats, detail sheet
- Seed: `state@jnic.org` (State Pastor, Lagos State)
- `pnpm build` passes

### Phase 5 zone reports (2026-07-12)

- Missed submission logic — computed at query time (Monday 23:59 Africa/Lagos)
- `GET /reports/zone/summary` — branch rows, aggregates, missed/pending flags
- Status progression — zonal pastor viewing report advances `SUBMITTED` → `ZONE_REVIEWED`
- Web `/reports/zone` — summary stats, branch table, detail sheet
- Seed: `zonal@jnic.org` + `branch@jnic.org` with org assignments
- `pnpm build` passes

### Phase 4 weekly report submit (2026-07-12)

- Shared week utilities in `@repo/types` (Africa/Lagos, Sunday week end)
- NestJS `reports` module — create/list/get/update weekly reports
- Atomic create: `WeeklyReport` + `Attendance` + `Finance` in one transaction
- RBAC: pastors with `branchId` (`STATE_PASTOR`, `ZONAL_PASTOR`, `BRANCH_PASTOR`); branch-scoped access
- Edit lock when `status !== SUBMITTED`; only original submitter can edit
- Web `/reports/submit` — unified attendance + finance form (jubilee-nation layout)
- Nav + dashboard link for branch submitters
- `pnpm build` passes

### Phase 3 profile pictures (2026-07-12)

- NestJS `files` module — R2 presigned upload (`POST /files/profile-picture/presign`)
- `PATCH /users/me/profile-picture` — save `profilePicUrl` after upload
- `/profile` page — account details, center-crop upload, default avatar fallback
- Nav: Profile link for all roles; header avatar + profile menu item
- `pnpm build` passes

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

**Deferred from Phase 1 spec:** BullMQ email queue.

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

1. Phase 6 — BullMQ monthly aggregation cron job
2. Phase 7 — Hardening, e2e tests, go-live checklist

## Feature Unit Queue (Phase 5)

| Order | Unit | Status |
| ----- | ---- | ------ |
| 0 | Missed submission flags (query-time) | Done |
| 1 | Zone summary API + status progression | Done |
| 2 | `/reports/zone` page | Done |
| 3 | State summary + `/reports/state` | Done |
| 4 | National summary + `/reports/national` | Done |
| 5 | Feedback API + UI | Done |

## Architecture Decisions

- Context files follow unifycomply pattern (`AGENTS.md` + `context/` folder)
- Lead Pastor approval workflow via `OrgChangeRequest` entity *(legacy — direct org create superseded)*
- `packages/types` is single source for shared enums between web and API
- API `tsconfig.build.json` is standalone (does not inherit broken `baseUrl` from shared nestjs config)
- Web fonts use system stack in Phase 0 (no `next/font` Google fetch at build time)
- New states/zones/branches created directly by Admin (legacy LP approval workflow retained in API only)

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
