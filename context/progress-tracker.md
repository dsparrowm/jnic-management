# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

**Phase 7 — Hardening week 1 (in progress)**

Phase 6 monthly summaries remain on-demand (BullMQ cron still deferred). Week 1 production hardening: report visibility, reassign RBAC, fail-closed boot, auth throttle, Helmet/CSP, hashed onboarding tokens, DB health check.

## Mobile (post-MVP track)

Sibling Expo app at `/home/davies/jnic-mobile` — primary weekly-reporting client for all
pastor roles, plus Admin / Lead Pastor HQ workflows. Reuses NestJS Bearer JWT API; not
part of Phases 0–7 completion criteria. Web `/reports/*` remains a desktop fallback.

| Milestone | Status |
| --------- | ------ |
| M0 — Scaffold, SecureStore auth, EAS/dev-client, role gate | Done |
| M1 — Pastors (onboard / reassign / deactivate) | Done |
| M2 — Org tree + create | Done |
| M3 — LP summary approvals + summaries browser | Done |
| M4 — Polish + EAS ship docs | Done (docs); Expo Go is primary device test path; EAS native build optional |
| M5 — Pastor access + weekly submit | Done |
| M6 — Zone/state review + forward | Done |
| M7 — National weekly + feedback | Done |

Testing: physical device via **Expo Go** + `npm run start:tunnel` (WSL); EAS Simulator deferred (waitlist). Fixed Metro circular import (`org-assignment` → `index` → `Role`) by extracting `Role` to `packages/types/src/role.ts`. Native UI pass: immersive navy auth, grouped lists, custom home/profile heroes, shared mobile primitives (not web-card chrome).

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
| 7 | Hardening, tests, deploy | Week 1 in progress |

## Current Goal

Phase 7 week 1 hardening. Next: Week 2 hosting (paid API/DB, Vercel, Resend domain, Cloudinary) and Week 3 smoke e2e / UAT.

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
| **7 — Hardening** | **Week 1 in progress** |

## Open questions

| Question | Status |
| -------- | ------ |
| Pastor Home → branch overview dashboard (trends + month snapshot; report nudge only) | Done — `GET /dashboard/pastor` + mobile overview Home |

## Completed

### Mobile profile screen (2026-09-21)

- Profile tab matches Home light-shell patterns: centered hero, overline sections, `SurfaceCard` rows
- `ProfileHero` with role badge, assignment summary, and camera badge for photo upload
- Account card (`email`, `phone`, member since) loaded via `GET /users/me`
- Assignment card reflects role hierarchy and dual-scope home-branch footnote
- App shortcuts: Notifications, Weekly reports, Library (pastors), Pastors (Admin), Summaries (LP)
- Profile photo upload: presign → Cloudinary POST → `PATCH /users/me/profile-picture` (`expo-image-picker`)

### Pastor branch overview Home (2026-09-21)

- `GET /dashboard/pastor` composes branch insights, month snapshot, zone/state summaries,
  and notifications in one round-trip
- Mobile pastor Home is overview-first: compact report nudge, this-week KPIs, attendance
  trend, month snapshot, and recent activity; submit/edit stays on Reports
- Notifications bell (top-right) + full `/notifications` list with mark-read

### Mobile pastor reporting UX pass (2026-09-21)

- Weekly submit is a ritual: Sunday-default day picker, Naira grouping, live totals,
  no-service guard, confirm sheet, and a success receipt
- Nested Weekly screens hide the tab dock; switching back to Weekly always opens this week
- Review lists lead with missing/late branches; forward confirms coverage
- Status copy is pastoral (Sent / Waiting / Late / With zonal pastor)
- Gold CTAs use navy text for contrast; Home role badge no longer truncates
- `GET /users/me` and login include assigned state/zone/branch names (after API deploy);
  Home, Weekly, and Profile also show the branch from this week’s report so names work
  against the current production API
- Nested submit no longer calls `dismissAll` (that threw `POP_TO_TOP` on web tabs)
- Web `/reports/*` fallback matches confirm, totals, exceptions, and labels
- Pastor dock is **Home · Reports · Library · Profile** (light system tab bar, gold active);
  Library is an upcoming HQ sermons/books shelf; pastor Home uses a light Peloton-inspired
  greeting + this-week featured card

### Mobile pastor reporting M5–M7 (2026-09-20)

- Opened the Expo app to every `ACTIVE` role; HQ-only unavailable is no longer the pastor happy path
- Added a role-aware Weekly tab for submit/edit, zone/state review with confirmed forward, HQ national drill-down, and non-blocking feedback
- Pastor Home composes this-week report/zone/state status plus notifications (deep-link to a report when `metadata.reportId` is present)
- Lifted weekly/zone/state/national/feedback DTOs into `@repo/types`; web remains a desktop fallback
- Mobile TypeScript `--noEmit` passes

### Premium mobile screen rollout + Android navigation (2026-09-20)

- Extended the Home command-center language across Pastors, Organisation, Approvals,
  Summaries, Profile, Login, unavailable, and not-found routes
- Added shared premium hero/surface/state/search/month/status/sheet primitives and semantic
  pressed, focus, accessibility, loading, error, and empty behavior
- Android hardware Back now closes guarded form sheets first, returns non-Home root tabs to Home,
  and retains normal platform exit behavior on Home
- Onboarding, reassignment, and organisation-create sheets block dismissal while submitting and
  confirm before discarding entered data
- Validation: mobile TypeScript, IDE diagnostics, Admin route visual smoke, modal close behavior,
  and 150% browser scaling

### Premium mobile HQ home (2026-09-20)

- Added shared `HqDashboardResponse` contract and RBAC-protected `GET /dashboard/hq`
  aggregate for Admin / Lead Pastor
- Preserved forward-gated reporting coverage and non-forward-gated national attendance trends
- Rebuilt Expo home as a role-aware operations command center with weekly health, compact KPIs,
  priority actions, six-week trend, and persisted notification activity
- Added first-load skeleton, retry, last-good refresh handling, pull-to-refresh, accessible chart
  summary, 44px targets, profile-image avatar fallback, and focused API tests
- Validation: mobile TypeScript, API typecheck/build/tests, and 360×640 Expo web visual smoke

### Mobile M0–M3 scaffold (sibling `jnic-mobile`)

- Expo Router app with SecureStore JWT session, refresh client, JNIC tokens
- Role gate: ADMIN / LEAD_PASTOR full tabs; other roles → web-only screen
- Pastors: list/search/status filters, onboard, resend, reassign, deactivate
- Org: hierarchy tree + create state/zone/branch
- Approvals (LP): pending national monthly approve; Summaries month browser (HQ)
- EAS `development` profile + README; **Expo Go + tunnel** is the primary physical-device path from WSL (no Android Studio)
- Types via Metro watch on `jnic-management/packages/types/src` (no enum duplication)

### Phase 7 week 1 hardening (2026-08-13)

- Zone/state report drill-down: dual-scope and hierarchy viewers can open in-scope reports (submitter-only lock limited to `BRANCH_PASTOR`)
- Reassign DTO/service restricted to `ONBOARDABLE_ROLES`; last active Admin cannot be deactivated
- Production boot fails closed (JWT secret strength, https `WEB_ORIGIN`/`WEB_APP_URL`, `RESEND_API_KEY`)
- `@nestjs/throttler` 5/min on login, refresh, logout, onboarding validate/complete; `RolesGuard` is a global `APP_GUARD`
- Helmet on API; Next.js security headers + CSP; onboarding tokens hashed SHA-256 at rest
- `GET /health` pings Postgres; seed refuses default passwords when `NODE_ENV=production`
- `pnpm` typecheck on touched packages
- Render migrate: baseline existing schema into `_prisma_migrations` before `migrate deploy` (fixes P3018 `NotificationType already exists`)
- Production seed creates only the admin when `SEED_ADMIN_PASSWORD` is set (demo pastors skipped unless `SEED_DEMO_USERS=true`)

### Summaries page redesign (2026-07-14)

- Redesigned `/summaries` — filter bar with month picker, scope drill-down (Admin/LP), and Summary / By state / Weekly tabs
- URL-synced filters (`month`, `year`, `scope`, `stateId`, `view`)
- API: optional `scopeType`/`scopeId` on `GET /summaries/monthly`; `scopeOptions` + `coverage` in response
- State table: search, sort, click-through to state scope
- `pnpm build` passes

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

### Profile pictures → Cloudinary (2026-09-21)

- Replaced Cloudflare R2 with Cloudinary signed direct uploads
- API returns `uploadUrl`, `key` (public_id), `apiKey`, `timestamp`, `signature`
- Web and mobile POST multipart to Cloudinary, then `PATCH /users/me/profile-picture`
- Delivery URLs use face-crop + auto format/quality transforms

### Phase 3 profile pictures (2026-07-12)

- NestJS `files` module — presigned upload (`POST /files/profile-picture/presign`)
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

1. Phase 7 week 2 — paid API/DB host, Vercel web, Resend domain, Cloudinary env, backups
2. Phase 7 week 3 — smoke e2e, httpOnly cookies (or documented XSS risk), docs/UAT
3. Phase 6 — BullMQ monthly aggregation cron (still deferred)

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
