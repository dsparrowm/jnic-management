# Phase 2 — Org Structure + Lead Pastor Approvals

Read `AGENTS.md` before starting.

**Phase:** 2  
**Depends on:** Phase 1 (auth + onboarding)

## Scope

Manage the State → Zone → Branch hierarchy. **Admin creates states, zones, and branches
directly** via the organisation page. Pastor assignment is handled separately on the pastor
directory (`/admin/pastors`).

**In scope:** Org CRUD API, seed hierarchy, org assignment on onboard form, premium Admin
org UI with slide-over create flows.

**Legacy:** `OrgChangeRequest` workflow (LP approval for state/zone) remains in the API for
historical data but is no longer used for new org creates. `/approvals/org` route kept but
unlinked from navigation.

**Out of scope:** Org deletion, pastor assignment on org page, syncing org-node pastor FKs.

## API Endpoints

| Method | Path | Role | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/org/tree` | Admin, Lead Pastor | Full hierarchy |
| POST | `/org/states` | Admin | Create state |
| POST | `/org/zones` | Admin | Create zone under state |
| POST | `/org/branches` | Admin | Create branch under zone |
| PATCH | `/org/states/:id` | Admin | Update state name |
| PATCH | `/org/zones/:id` | Admin | Update zone name |
| PATCH | `/org/branches/:id` | Admin | Update branch name/address |
| POST | `/org/change-requests` | Admin | *(Legacy)* Propose new state or zone |
| GET | `/org/change-requests` | Admin, Lead Pastor | *(Legacy)* List requests |
| POST | `/org/change-requests/:id/approve` | Lead Pastor | *(Legacy)* Approve and create entity |
| POST | `/org/change-requests/:id/reject` | Lead Pastor | *(Legacy)* Reject proposal |

## Web Routes

| Route | Audience |
| ----- | -------- |
| `/admin/org` | Admin — hierarchy tree, slide-over create state/zone/branch |
| `/approvals/org` | *(Legacy, unlinked)* Lead Pastor — approve/reject pending requests |

## RBAC

- All `/org/*` routes require authentication
- State/zone/branch create and update: `@Roles(ADMIN)`
- Change-request approve/reject: `@Roles(LEAD_PASTOR)` (legacy)
- Tree and list: Admin + Lead Pastor

## Acceptance

- [x] Admin creates state → appears in hierarchy immediately
- [x] Admin creates zone under state → appears in tree
- [x] Admin creates branch under zone (optional state filter) → appears in tree
- [x] Onboard form shows org selectors based on role
- [x] `progress-tracker.md` updated
