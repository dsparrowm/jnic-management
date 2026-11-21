# Structure v2 — dual-line organisation

Replaces the single territorial hierarchy with two reporting lines per
`context/structure-v2-plan.md` and `context/directorates-seed.json`.

## Territorial line

Senior Pastor → Resident Pastor → Regional → State → Zonal → District → Branch.

- `Region`, `District` models; `State.regionId`, `Branch.districtId` nullable.
- `GET /org/tree` → `{ regions: RegionNode[], unassignedStates: StateNode[] }`,
  nodes carry `pastor` seat refs; states may sit outside any region.
- Admin CRUD: `POST /org/regions`, `POST /org/districts`; create state/branch
  accept `regionId`/`districtId` and optional pastor seats.

## Directorate line

Directors → Resident Pastor → Senior Pastor (resident pastor is the senior
pastor's assistant).

- `Directorate` (key, name, mandate) → `Desk` (head + deputy seats, duties)
  → `BranchUnitType` → `ServiceUnit` (branch instance, coordinator seat).
- `DirectorateAssignment`: one seat per user (`userId @unique`), offices
  DIRECTOR / DEPUTY_DIRECTOR / SECRETARY / DESK_HEAD / DEPUTY_DESK_HEAD /
  UNIT_COORDINATOR / MEMBER; optional `deskId`, `agreedWeeklyHours`, `termYears`.
- Endpoints under `/directorates`: list/detail readable by HQ pastors;
  assignment + unit mutations admin-only. Served as data — desks, mandates and
  KPIs seed from `context/directorates-seed.json`, no per-directorate code.
- Users list/detail expose a `directorate` facet; filters by `regionId`,
  `districtId`, `directorateId`.

## Roles

`SENIOR_PASTOR` (renamed from `LEAD_PASTOR`), `RESIDENT_PASTOR`,
`REGIONAL_PASTOR`, `DISTRICT_PASTOR` added. `HQ_PASTOR_ROLES` = SENIOR+RESIDENT.
Everywhere LEAD_PASTOR was enforced now uses `isHqPastor()`/`HQ_PASTOR_ROLES`.

## Slice B — B1 weekly report v2 (implemented)

- Reporting chain: Branch → District → Zone → State → Region → HQ
  (SENIOR_PASTOR + RESIDENT_PASTOR). ADMIN is out of the report flow:
  removed from `HQ_VIEW_ROLES`, `FEEDBACK_ROLES` and rollup-forward
  notifications; mobile `isHqUser` no longer counts admin.
- Statuses: `DISTRICT_REVIEWED` and `REGIONAL_REVIEWED` join the chain.
- B1 attendance fields: men, women, youth, children, midweekAttendance,
  firstTimeVisitors, newConverts, followUpVisits, unitsActive, outreachHeld;
  report notes: pastoralIssues, prayerRequests, nextWeekPlans.
  Legacy adult/teenage/children columns remain for history.
- Forward endpoints: `POST /reports/district/:weekOf/forward` and
  `/reports/region/:weekOf/forward`; zone forward sweeps
  SUBMITTED + DISTRICT_REVIEWED; state forward sweeps ZONE+STATE_REVIEWED to
  STATE_REVIEWED (region path) or HQ_REVIEWED (no region).
- Summaries: `/reports/district/summary` and `/reports/region/summary` with
  rollup gating identical to the zone→state gate.
- MonthlySummary keeps new totals: totalMen/Women/Youth/Visitors/Converts.

## Slice C — report-template engine (implemented)

`ReportTemplate` rows carry each directorate's D1–D6: level (UNIT → desk heads, DESK → directorate officers, DIRECTORATE → resident pastor, COUNCIL → senior pastor), cadence, dueDay and a JSON field list (`{key,label,type}`). `TemplateReport` stores submissions with `periodKey`, `data`, and a review status (`SUBMITTED → DESK_REVIEWED → DIRECTOR_REVIEWED → RESIDENT_REVIEWED → SENIOR_REVIEWED`); each review writes the next status for that level and notifies the next reviewers.

B1 service units: `Attendance.activeUnitIds` stores which chartered units were active; `unitsActive` derives from it when the branch has units.
