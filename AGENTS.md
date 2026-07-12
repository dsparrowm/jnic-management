# JNLOP Agent Instructions

## Scope

This repository is the **JNLOP MVP** — Jubilee Nation Leadership & Operations Platform
for JNIC (Jubilee Nation International Churches).

**Greenfield Turborepo:** `apps/web` (Next.js 15), `apps/api` (NestJS), shared packages.
Real persistence (PostgreSQL + Prisma), JWT auth, Redis/BullMQ jobs, Cloudflare R2 for
profile pictures.

**Current milestone: Phase 0 only.** Do not implement later phases until prior phase
completion criteria in `context/mvp-roadmap.md` are met and `context/progress-tracker.md`
is updated.

**Reference only:** `/home/davies/jubilee-nation` is a mock TanStack Start demo — borrow
weekly report form patterns only. App shell layout follows `rokswood-hive-web` (see
`context/ui-context.md`).

## Read First

Before implementing or making architectural decisions, read these files in order:

1. `context/project-overview.md` — product definition, roles, routes, and scope
2. `context/mvp-roadmap.md` — phased MVP delivery plan (Phases 0–7)
3. `context/architecture.md` — monorepo structure, modules, data model, invariants
4. `context/ui-context.md` — JNIC brand tokens (navy/gold), typography, layout
5. `context/code-standards.md` — implementation rules and naming conventions
6. `context/progress-tracker.md` — current phase, completed work, open questions
7. `context/go-live-checklist.md` — production readiness
8. `context/feature-specs/` — per-epic implementation specs

Update `context/progress-tracker.md` after each meaningful implementation change.

If implementation changes architecture, scope, or standards, update the relevant
context file before continuing.

## Confirmed Role Model

| Role | Key permissions |
| ---- | --------------- |
| `LEAD_PASTOR` | National visibility, feedback anywhere, approves new states/zones and national monthly summaries |
| `ADMIN` | Onboard/deactivate/reassign users, org CRUD (state/zone creation pending LP approval), pastor directory |
| `STATE_PASTOR` | State-wide reports, zone drill-down, feedback |
| `ZONAL_PASTOR` | Zone reports, branch drill-down, feedback |
| `BRANCH_PASTOR` | Submit/edit weekly reports (until zone review), own branch |
| `ADMIN_STAFF` | Submit weekly reports (same as Branch Pastor) |

RBAC is enforced in **NestJS guards** and mirrored in the web UI — never UI-only.

## Workflow

Build incrementally using the spec-driven workflow in `context/`. Work one feature unit
at a time — one API module, one page, or one shared package slice.

A feature unit is complete when it works end-to-end with real persistence (or the agreed
stub for the current phase).

## Handling Missing Requirements

- Do not invent behaviour not defined in context files or user stories
- If ambiguous, add an open question to `context/progress-tracker.md` and resolve before coding
- If a new route or entity is needed, update `context/project-overview.md` and add/update
  the relevant feature spec first

## Protected Files

Do not modify unless explicitly instructed:

- `apps/web/components/ui/*` — generated shadcn/ui primitives
- `packages/database/prisma/migrations/*` — only via `prisma migrate`
- Any third-party library internals

## Keeping Docs in Sync

| Change | Update |
| ------ | ------ |
| New module boundaries or folder structure | `context/architecture.md` |
| New tokens, layout patterns | `context/ui-context.md` |
| New coding conventions | `context/code-standards.md` |
| Feature progress or decisions | `context/progress-tracker.md` |
| Phase scope changes | `context/mvp-roadmap.md` |
| Release readiness | `context/go-live-checklist.md` |
| New routes or epics | `context/feature-specs/` + `context/project-overview.md` |

## Before Moving to the Next Unit

1. Current unit works end-to-end for its phase
2. No invariant in `context/architecture.md` was violated
3. `context/progress-tracker.md` reflects completed work
4. TypeScript validation passes for touched packages
5. RBAC tested on API (not just hidden nav items)
6. No TODO comments left in production code paths
