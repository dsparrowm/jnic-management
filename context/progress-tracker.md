# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

**Phase 1 — Auth + Onboarding (next)**

Phase 0 scaffold is complete. Begin Epic 1 per `context/feature-specs/01-auth-onboarding.md`.

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
| UX reference | `jubilee-nation` mock demo (patterns only, not code) |

## Phase Completion Checklist

| Phase | Item | Status |
| ----- | ---- | ------ |
| 0 | Context files (`AGENTS.md`, `context/*`) | Done |
| 0 | Turborepo scaffold (`apps/web`, `apps/api`, packages) | Done |
| 0 | Docker Compose (Postgres + Redis) | Done |
| 0 | Prisma base schema + initial migration | Done |
| 0 | `pnpm build` passes | Done |
| 0 | API health endpoint (`GET /health`) | Done |
| 0 | Web status page (localhost:3000) | Done |
| 1 | Auth + onboarding (Epic 1) | Not started |
| 2 | Org structure + LP approvals | Not started |
| 3 | Profiles + pastor directory (Epic 2) | Not started |
| 4 | Weekly reports + attendance + finance | Not started |
| 5 | Hierarchy views + feedback | Not started |
| 6 | Monthly aggregation + LP summary approval | Not started |
| 7 | Hardening, tests, deploy | Not started |

## Current Goal

Implement Phase 1 — JWT auth, Admin onboarding flow, password setup via token.

## Milestone Status

| Phase | Status |
| ----- | ------ |
| **0 — Context & Scaffold** | **Complete** |
| **1 — Auth + Onboarding** | **Next (active)** |
| 2 — Org + LP Approvals | Blocked until Phase 1 complete |
| 3 — Profiles | Blocked |
| 4 — Weekly Reports | Blocked |
| 5 — Hierarchy + Feedback | Blocked |
| 6 — Monthly Aggregation | Blocked |
| 7 — Hardening | Blocked |

## Completed

### Phase 0 (2026-07-10)

- Turborepo monorepo: `apps/web`, `apps/api`, `packages/database`, `packages/types`, `packages/typescript-config`
- `docker-compose.yml` — Postgres 16 + Redis 7
- Prisma schema — User, State, Zone, Branch, OrgChangeRequest, WeeklyReport, Attendance, Finance, Feedback, MonthlySummary, Notification
- Initial migration: `packages/database/prisma/migrations/20260710120000_init/`
- Shared enums in `@repo/types` (Role, UserStatus, ReportStatus, etc.)
- NestJS API with `GET /health` on port 4000
- Next.js 15 web with JNIC design tokens and API status page on port 3000
- `.env.example`, root `README.md` with dev instructions

### Context (2026-07-10)

- Full `context/` file set + `AGENTS.md` + `.cursor/rules/jnlop-core.mdc`

## Next Up

1. NestJS `auth` module — JWT access + refresh tokens
2. `onboarding` module — Admin creates pending user, email job stub
3. Web: `/login`, `/onboard/[token]`, `/admin/onboard`
4. Admin-only guards (API + UI)

**Prerequisite:** Run `docker compose up -d` then `pnpm db:migrate` before Phase 1 DB work.

## Feature Unit Queue (Phase 1)

| Order | Unit | User story | Status |
| ----- | ---- | ---------- | ------ |
| 1 | NestJS auth module (JWT) | — | Not started |
| 2 | Admin onboarding API + email job | US-1.1 | Not started |
| 3 | Onboard token page + password set | US-1.1 | Not started |
| 4 | Admin onboarding form UI | US-1.1 | Not started |
| 5 | Admin-only guard (API + UI) | US-1.2 | Not started |
| 6 | Deactivate / reassign users | US-1.3 | Not started |

## Architecture Decisions

- Context files follow unifycomply pattern (`AGENTS.md` + `context/` folder)
- Lead Pastor approval workflow via `OrgChangeRequest` entity
- `packages/types` is single source for shared enums between web and API
- API `tsconfig.build.json` is standalone (does not inherit broken `baseUrl` from shared nestjs config)
- Web fonts use system stack in Phase 0 (no `next/font` Google fetch at build time)

## Open Questions

| # | Question | Status |
| - | -------- | ------ |
| 1 | Resend vs AWS SES for email | Resolved: Resend |
| 2 | Railway vs Render for API hosting | Open — decide at Phase 7 |

## Session Notes

- 2026-07-10: Plan confirmed — greenfield Turborepo; Admin = HQ Admin; Lead Pastor above Admin
- 2026-07-10: Context files created
- 2026-07-10: Phase 0 scaffold complete — monorepo builds, API health + web status page working
