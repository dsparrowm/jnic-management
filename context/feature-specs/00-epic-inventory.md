# Epic Inventory

Maps confirmed user stories to implementation phases and feature specs.

## Epics Overview

| Epic | Name | Phase | Spec |
| ---- | ---- | ----- | ---- |
| 1 | Pastor & Admin Onboarding | 1 | `01-auth-onboarding.md` |
| 2 | Pastor Profile | 3 | `02-profiles.md` |
| 3 | Reporting Hierarchy | 4, 5, 6 | `03-reporting-hierarchy.md` |
| 4 | Attendance & Finance | 4, 5 | `04-attendance-finance.md` |

Cross-cutting: **Phase 2** (org structure + Lead Pastor approvals) supports Epics 1 and 3.

---

## Epic 1: Pastor & Admin Onboarding

| Story | Summary | Phase |
| ----- | ------- | ----- |
| US-1.1 | Admin onboards pastor via email link + password setup | 1 |
| US-1.2 | Pastors cannot onboard others (API + UI) | 1 |
| US-1.3 | Admin deactivates / reassigns accounts | 1 |

**Roles involved:** `ADMIN`, all pastor roles (as onboarded users)

---

## Epic 2: Pastor Profile

| Story | Summary | Phase |
| ----- | ------- | ----- |
| US-2.1 | Pastor uploads/updates profile picture | 3 |
| US-2.2 | Admin views filterable pastor directory | 3 |

**Roles involved:** All pastors, `ADMIN`

---

## Epic 3: Reporting Hierarchy

| Story | Summary | Phase |
| ----- | ------- | ----- |
| US-3.1 | Branch Pastor submits weekly report | 4 |
| US-3.2 | Zonal Pastor reviews zone reports + feedback | 5 |
| US-3.3 | State Pastor views state aggregates | 5 |
| US-3.4 | Lead Pastor / Admin national dashboard | 5 |
| US-3.5 | Feedback threads + notifications (non-blocking) | 5 |
| US-3.6 | Monthly auto-aggregated summaries | 6 |

**Roles involved:** `BRANCH_PASTOR`, `ADMIN_STAFF`, `ZONAL_PASTOR`, `STATE_PASTOR`,
`LEAD_PASTOR`, `ADMIN`

---

## Epic 4: Attendance & Finance

| Story | Summary | Phase |
| ----- | ------- | ----- |
| US-4.1 | Attendance: adult, teenage, children | 4 |
| US-4.2 | Finance: tithe, offering, other + currency | 4 |
| US-4.3 | Aggregates + missed submission flags | 4, 5 |

**Roles involved:** `BRANCH_PASTOR`, `ADMIN_STAFF` (submit); `ZONAL_PASTOR`,
`STATE_PASTOR` (aggregate views)

---

## Build Order

Aligned to `context/mvp-roadmap.md`:

1. **Phase 0** — Scaffold (prerequisite for all)
2. **Phase 1** — Epic 1 (US-1.1, US-1.2, US-1.3)
3. **Phase 2** — Org hierarchy + Lead Pastor org approvals
4. **Phase 3** — Epic 2 (US-2.1, US-2.2)
5. **Phase 4** — Epic 3.1 + Epic 4 (US-3.1, US-4.1, US-4.2, US-4.3 flags)
6. **Phase 5** — Epic 3.2–3.5 + US-4.3 aggregates
7. **Phase 6** — Epic 3.6 + Lead Pastor national summary approval
8. **Phase 7** — Hardening

## Confirmed Scope Decisions

These override ambiguities in the original architecture/user story docs:

| Topic | Decision |
| ----- | -------- |
| Admin vs HQ Admin | Same `ADMIN` role |
| Lead Pastor | Separate role; approves org changes + national summaries |
| Admin Staff | Same submission rights as Branch Pastor |
| Multi-branch pastors | 1:1 for MVP |
| Currency | NGN default; field stored for future config |
| Report cutoff | Monday 23:59 Africa/Lagos after Sunday week end |

## Out of Scope

Stories or features **not** in MVP user stories:

- Paystack / wallet / payroll
- Leave management, transfers, calendar, documents
- LMS / courses / training
- Public marketing landing page
- Mobile app
