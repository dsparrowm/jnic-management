# Phase 2 — Org Structure + Lead Pastor Approvals

Read `AGENTS.md` before starting.

**Phase:** 2  
**Depends on:** Phase 1 (auth + onboarding)

## Scope

Manage the State → Zone → Branch hierarchy. New states and zones require Lead Pastor
approval via `OrgChangeRequest`. Branches are created directly by Admin under an
existing zone.

**In scope:** Org CRUD API, change-request workflow, seed hierarchy, org assignment on
onboard form, Admin org UI, LP approval UI.

**Out of scope:** Branch creation via approval workflow, org deletion, pastor assignment
to org nodes (Phase 3 directory).

## API Endpoints

| Method | Path | Role | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/org/tree` | Admin, Lead Pastor | Full hierarchy |
| POST | `/org/branches` | Admin | Create branch under zone |
| PATCH | `/org/states/:id` | Admin | Update state name |
| PATCH | `/org/zones/:id` | Admin | Update zone name |
| PATCH | `/org/branches/:id` | Admin | Update branch name/address |
| POST | `/org/change-requests` | Admin | Propose new state or zone |
| GET | `/org/change-requests` | Admin, Lead Pastor | List requests |
| POST | `/org/change-requests/:id/approve` | Lead Pastor | Approve and create entity |
| POST | `/org/change-requests/:id/reject` | Lead Pastor | Reject proposal |

## Change Request Payloads

- `CREATE_STATE`: `{ "name": string }`
- `CREATE_ZONE`: `{ "name": string, "stateId": string }`

## Web Routes

| Route | Audience |
| ----- | -------- |
| `/admin/org` | Admin — hierarchy, create branch, propose state/zone |
| `/approvals/org` | Lead Pastor — approve/reject pending requests |

## RBAC

- All `/org/*` routes require authentication
- Branch CRUD and change-request creation: `@Roles(ADMIN)`
- Change-request approve/reject: `@Roles(LEAD_PASTOR)`
- Tree and list: Admin + Lead Pastor

## Acceptance

- [ ] Admin creates branch under seeded zone
- [ ] Admin proposes new zone → LP approves → zone appears in tree
- [ ] Rejected request does not create entity
- [ ] Onboard form shows org selectors based on role
- [ ] `progress-tracker.md` updated
