# JNLOP — Jubilee Nation Leadership & Operations Platform

## Overview

JNLOP is the internal operations platform for **Jubilee Nation International Churches
(JNIC)**. The MVP covers pastor onboarding, profiles, weekly reporting with hierarchy
visibility and feedback, and attendance/finance tracking.

**Repository:** `/home/davies/jnic_management` — greenfield Turborepo monorepo.

**Product docs:** `context/mvp-roadmap.md`, `context/go-live-checklist.md`

**Source requirements:**

- `context/feature-specs/` — derived from confirmed user stories (Epics 1–4)
- Original specs archived in planning session (Architecture Design + User Stories)

## Goals

1. Centralize pastor account creation and onboarding (Admin-only)
2. Enable branch-level weekly attendance + finance submission
3. Roll reports up Branch → Zone → State → HQ with drill-down at each level
4. Support non-blocking feedback and notifications between hierarchy levels
5. Auto-aggregate monthly summaries; Lead Pastor approves national summaries
6. Lead Pastor approves major org changes (new states/zones) proposed by Admin

## User Roles

| Role | Description |
| ---- | ----------- |
| `LEAD_PASTOR` | Top leadership — national visibility, org approvals, national summary sign-off |
| `ADMIN` | Platform administration — onboarding, user management, org CRUD |
| `STATE_PASTOR` | Oversees zones within a state; may optionally pastor one home branch |
| `ZONAL_PASTOR` | Oversees branches within a zone; may optionally pastor one home branch |
| `BRANCH_PASTOR` | Submits weekly reports for assigned branch |

**Confirmed:** `ADMIN` and HQ Admin are the **same role**. `LEAD_PASTOR` is a separate
role above Admin.

## Org Hierarchy

```
HQ (national)
 └── State
      └── Zone
           └── Branch
```

Visibility is derived from FK chains (`Branch.zoneId → Zone.stateId`), not a separate
permissions table.

## Core User Flows

### 1. Onboarding (Epic 1)

Admin enters pastor details → system emails secure link → pastor sets password →
auto-login → role-scoped dashboard.

### 2. Weekly Reporting (Epics 3 & 4)

Branch Pastor/Admin Staff submits attendance + finance for a service week → Zonal Pastor
reviews and may leave feedback → aggregates roll to State → HQ. Feedback does **not**
block progression.

### 3. Monthly Summaries (Epic 3.6)

Background job aggregates weekly reports per calendar month at branch/zone/state/HQ scope.
National (HQ) summary requires Lead Pastor approval.

### 4. Org Changes

Admin proposes new State or Zone → `OrgChangeRequest` created → Lead Pastor approves or
rejects → entity created on approval.

## Application Routes

| Route | Audience | User story |
| ----- | -------- | ---------- |
| `/login` | All | Auth |
| `/onboard/[token]` | Pending users | US-1.1 |
| `/dashboard` | All roles | Role-scoped home |
| `/admin/pastors` | Admin | US-1.1 (onboard sheet), US-1.3, US-2.2 |
| `/admin/org` | Admin | Org CRUD |
| `/approvals/org` | Lead Pastor | Org change approval |
| `/approvals/summaries` | Lead Pastor | National summary approval |
| `/reports/submit` | Branch Pastor, Admin Staff | US-3.1, US-4.1, US-4.2 |
| `/reports/zone` | Zonal Pastor | US-3.2 |
| `/reports/state` | State Pastor | US-3.3 |
| `/reports/national` | Lead Pastor, Admin | US-3.4 |
| `/profile` | All pastors | US-2.1 |
| `/summaries` | Scoped roles | US-3.6 |

## Features by Phase

See `context/mvp-roadmap.md`. Summary:

| Phase | Focus |
| ----- | ----- |
| **0** | Monorepo scaffold, context docs, Docker, Prisma base schema |
| **1** | Auth + onboarding (Epic 1) |
| **2** | Org structure + Lead Pastor approvals |
| **3** | Profiles + pastor directory (Epic 2) |
| **4** | Weekly reports + attendance + finance (Epics 3.1, 4) |
| **5** | Hierarchy views + feedback (Epics 3.2–3.5) |
| **6** | Monthly aggregation + LP summary approval (Epic 3.6) |
| **7** | Hardening, tests, deploy |

## Success Criteria

MVP is complete when US-1.1 through US-4.3 are demonstrable end-to-end with real
persistence:

1. Admin onboards pastor via email link
2. Pastor uploads profile photo; Admin browses filterable directory
3. Branch submits weekly attendance + finance
4. Zonal → State → HQ views with aggregates and drill-down
5. Feedback with notifications (non-blocking)
6. Monthly summaries auto-compute; Lead Pastor approves national summary
7. Lead Pastor approves new state/zone proposals from Admin

## Out of Scope (MVP)

- Mobile app (JWT design keeps door open)
- Paystack/wallet/payroll
- LMS / courses / training modules
- Multi-branch pastor assignments (1:1 for MVP)
- Public marketing landing page (may add later; not in MVP user stories)
- Features from `jubilee-nation` demo not in user stories (transfers, leave, calendar,
  documents, compliance, wallet, etc.)

## Assumptions

| Topic | Decision |
| ----- | -------- |
| Service week | Ends Sunday; missed flag if no submission by Monday 23:59 Africa/Lagos |
| Currency | NGN default; `currency` field on finance records |
| Onboarding token expiry | 48 hours; Admin can resend |
| Deactivated users | Lose login; historical reports preserved |
| Admin Staff | Same weekly submission rights as Branch Pastor |

## UX Reference

Borrow layout and interaction patterns from `jubilee-nation` where helpful:

- Navy sidebar + gold accent for **brand tokens only** (`context/ui-context.md`)
- Weekly report form structure (from `jubilee-nation`, Phase 4+)
- Dashboard stat cards and data tables (Rokswood-style shell)

Do not port mock data, TanStack Start routing, or demo role switcher.
