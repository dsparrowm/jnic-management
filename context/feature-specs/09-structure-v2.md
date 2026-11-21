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
