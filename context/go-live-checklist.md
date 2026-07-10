# JNLOP MVP Go-Live Checklist

MVP readiness checklist aligned to Phases 0–7 in `mvp-roadmap.md`. Use alongside
`progress-tracker.md`.

## Deployment Approach

```
Local development (Docker + turbo dev)
    ↓
Staging (Vercel + Railway/Render)
    ↓
Internal UAT (JNIC stakeholders)
    ↓
Production go-live
```

**Objective:** All MVP user stories (US-1.1 through US-4.3) work end-to-end with real
persistence before production deployment.

---

## Phase 0 — Scaffold

- [x] Context files (`AGENTS.md`, `context/*`)
- [ ] Turborepo monorepo scaffolded
- [ ] Docker Compose runs Postgres + Redis
- [ ] Prisma migrations apply cleanly
- [ ] `.env.example` documents all required variables
- [ ] Root README with local dev instructions

---

## Phase 1 — Auth + Onboarding (Epic 1)

- [ ] JWT login and refresh token flow
- [ ] Admin onboarding form creates pending user
- [ ] Onboarding email sent with secure link
- [ ] Pastor sets password via token; auto-login works
- [ ] Token expires after 48 hours
- [ ] Admin can resend expired link
- [ ] Non-Admin roles blocked from onboarding (API 403)
- [ ] Admin can deactivate user (login blocked, history preserved)
- [ ] Admin can reassign user to different org node

---

## Phase 2 — Org + Lead Pastor Approvals

- [ ] Admin can manage states, zones, branches
- [ ] New state/zone requires Lead Pastor approval
- [ ] Lead Pastor can approve or reject org change requests
- [ ] Approved changes appear in hierarchy
- [ ] Dev seed data available

---

## Phase 3 — Profiles (Epic 2)

- [ ] Pastor can upload JPG/PNG profile picture
- [ ] Size limits enforced; default avatar when none set
- [ ] Admin pastor directory lists all pastors
- [ ] Directory filterable by state, zone, branch, role

---

## Phase 4 — Weekly Reports (Epics 3.1, 4)

- [ ] Branch Pastor can submit weekly report
- [ ] Admin Staff can submit weekly report
- [ ] Report includes attendance (adult, teenage, children)
- [ ] Report includes finance (tithe, offering, other, currency)
- [ ] Report tied to service date and week
- [ ] Status shows pending zone review on submit
- [ ] Report locked after zone review begins
- [ ] Missed submission flagged on dashboards

---

## Phase 5 — Hierarchy + Feedback (Epics 3.2–3.5)

- [ ] Zonal Pastor sees zone branch reports with drill-down
- [ ] Zonal Pastor can leave feedback
- [ ] State Pastor sees state aggregates with drill-down
- [ ] State Pastor can leave feedback
- [ ] Lead Pastor / Admin see national dashboard with drill-down
- [ ] Lead Pastor can leave feedback at any level
- [ ] Feedback visible as thread on report
- [ ] Feedback does not block report progression
- [ ] Submitter notified on new feedback (in-app + email)

---

## Phase 6 — Monthly Aggregation (Epic 3.6)

- [ ] Monthly summaries auto-compute from weekly reports
- [ ] Summaries scoped to viewer's role level
- [ ] Totals include attendance and finance
- [ ] Weekly breakdown viewable alongside summary
- [ ] Lead Pastor approves national monthly summary

---

## Phase 7 — Hardening & Production

### Security

- [ ] RBAC enforced on all API endpoints (not UI-only)
- [ ] Rate limiting on auth endpoints
- [ ] Passwords hashed with bcrypt
- [ ] JWT secrets not committed to repo
- [ ] R2 bucket access restricted to presigned URLs
- [ ] CORS configured for production web origin only

### Quality

- [ ] TypeScript strict passes across monorepo
- [ ] Lint passes across monorepo
- [ ] Smoke e2e: onboarding flow
- [ ] Smoke e2e: weekly report submit
- [ ] Smoke e2e: hierarchy read by role
- [ ] Error states on all forms
- [ ] Loading states on async pages

### Operations

- [ ] Production database backed up
- [ ] Redis available for jobs and cache
- [ ] BullMQ workers running in production
- [ ] Email delivery verified (Resend)
- [ ] Environment variables set on Vercel + API host
- [ ] Health check endpoint monitored

### Documentation

- [ ] README: local dev setup
- [ ] README: deploy instructions
- [ ] `progress-tracker.md` reflects go-live status
- [ ] Admin runbook: onboard pastor, resend link, deactivate user

---

## MVP Success Sign-off

Sign off when all items above for Phases 1–6 are checked and Phase 7 security/quality
items are satisfied:

| Story | Verified |
| ----- | -------- |
| US-1.1 Onboard pastor | [ ] |
| US-1.2 Pastors cannot onboard | [ ] |
| US-1.3 Deactivate / reassign | [ ] |
| US-2.1 Profile picture | [ ] |
| US-2.2 Pastor directory | [ ] |
| US-3.1 Submit weekly report | [ ] |
| US-3.2 Zonal review | [ ] |
| US-3.3 State view | [ ] |
| US-3.4 National dashboard | [ ] |
| US-3.5 Feedback | [ ] |
| US-3.6 Monthly summary | [ ] |
| US-4.1 Attendance breakdown | [ ] |
| US-4.2 Finance figures | [ ] |
| US-4.3 Aggregates + missed flags | [ ] |
