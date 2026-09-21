# Mobile pastor reporting

Read `AGENTS.md` before starting.

**Track:** post-MVP mobile M5–M7  
**Depends on:** Epic 3/4 APIs (already shipped), shared report DTOs in `packages/types`

## Scope

Make `/home/davies/jnic-mobile` the primary weekly-reporting client for every
`ACTIVE` pastor role. Web `/reports/*` stays as a desktop fallback — do not remove
those routes.

**In scope**

- Open the app beyond HQ (remove HQ-only login redirect)
- Role-filtered Weekly tab: submit, zone/state review + forward, HQ national drill-down
- Pastor Home composed from existing report + notification endpoints
- Non-blocking feedback on report detail
- Shared weekly/zone/state/national/feedback DTOs in `@repo/types`

**Out of scope**

- New NestJS reporting rules or status values
- Removing web reporting
- `GET /dashboard/pastor` (compose existing endpoints first)
- Password onboarding on mobile (stays on web)

## Product rules

- Submitters: `canSubmitWeeklyReports(role, branchId)`
- Reviewers: zonal sees own zone on submit; state sees forwarded zones; Admin/LP can open every state, zone, and branch, including ones that have not forwarded
- Forward is explicit: `POST /reports/zone/:weekOf/forward`, `POST /reports/state/:weekOf/forward`
- Edit lock: PATCH only while `editable` (before `ZONE_REVIEWED`)
- Feedback does not block progression
- `GET /dashboard/hq` remains Admin / Lead Pastor only

## Mobile routes

| Route | Audience |
| ----- | -------- |
| Home | HQ command center, or pastor branch overview dashboard (see `06-pastor-branch-home.md`) |
| `/weekly` (Reports tab) | Role-aware week view |
| `/weekly/submit` | Pastor with `branchId` |
| `/weekly/[id]` | Report detail + feedback |
| `/library` | Pastor — upcoming HQ sermons/books |
| `/profile` | Assignment + session |
| Approve / Summaries | Lead Pastor monthly (unchanged, retitled Summaries) |
| `/pastors` | Admin pastor directory |
| `/pastors/[id]` | Admin pastor detail: contact, assignment, resend, reassign, deactivate |
| Org | Admin (unchanged) |

## API

Reuse existing NestJS endpoints. No new reporting endpoints in M5–M7.

## RBAC

Enforced in NestJS guards. Mobile hides tabs it cannot use; it must not be the only check.

## Acceptance

### M5 — Access + submit

- [x] Branch / zonal / state pastors reach Home instead of the HQ-only unavailable screen
- [x] Weekly submit/edit matches web fields (attendance + finance, NGN default, week from service date)
- [x] Submit UX: Sunday default, Naira formatting, live totals, no-service guard, confirm, receipt
- [x] Locked reports cannot be patched
- [x] Dual-scope pastors with `branchId` can submit from Weekly

### M6 — Review + forward

- [x] Zonal week view lists branches with missed / submitted / pending
- [x] State week view lists forwarded zones
- [x] Forward requires confirmation and cannot double-submit
- [x] Nested detail is reachable from the week list

### M7 — National + feedback

- [x] Admin / Lead Pastor see national weekly drill-down
- [x] Feedback thread on detail for zonal+, non-blocking
- [x] Notification activity on pastor Home deep-links to Weekly when a report id is present

- [x] `progress-tracker.md` updated
- [ ] Web `/reports/submit` still works as fallback
