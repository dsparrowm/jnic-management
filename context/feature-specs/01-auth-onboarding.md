# Epic 1 — Auth & Onboarding

Read `AGENTS.md` before starting.

**Phase:** 1  
**User stories:** US-1.1, US-1.2, US-1.3

## Scope

Admin-only pastor onboarding with email link, password setup, account deactivation, and
reassignment. Foundation for all other features.

**In scope:** JWT auth, onboarding token flow, Admin user management UI, email queue.

**Out of scope:** Self-registration, SSO, MFA, password reset (add in Phase 7 if needed).

## User Story Acceptance

### US-1.1 — Admin onboards pastor

- [ ] Only `ADMIN` role can access onboarding form and API
- [ ] Admin enters name, phone, email, role, org assignment (state/zone/branch)
- [ ] System creates user with `status=PENDING`
- [ ] Onboarding email sent with secure link
- [ ] Link opens password setup screen
- [ ] After password set: `status=ACTIVE`, auto-login, redirect to dashboard
- [ ] Token expires after 48 hours
- [ ] Admin can resend link for expired/unused tokens

### US-1.2 — Pastors cannot onboard

- [ ] Onboarding UI not visible to non-Admin roles
- [ ] API returns 403 for non-Admin on onboarding endpoints

### US-1.3 — Deactivate / reassign

- [ ] Only Admin can deactivate or reassign
- [ ] Deactivated users cannot log in; historical data preserved
- [ ] Reassignment updates org FKs going forward; past reports stay on old branch

## API Endpoints

| Method | Path | Role | Purpose |
| ------ | ---- | ---- | ------- |
| POST | `/auth/login` | Public | Email + password login |
| POST | `/auth/refresh` | Authenticated | Refresh access token |
| POST | `/auth/logout` | Authenticated | Invalidate refresh token |
| POST | `/onboarding/users` | Admin | Create pending user + send email |
| POST | `/onboarding/users/:id/resend` | Admin | Resend onboarding email |
| GET | `/onboarding/validate/:token` | Public | Check token validity |
| POST | `/onboarding/complete` | Public | Set password + return tokens |
| PATCH | `/users/:id/deactivate` | Admin | Set status DEACTIVATED |
| PATCH | `/users/:id/reassign` | Admin | Update org FKs + role if needed |
| GET | `/users/me` | Authenticated | Current user profile |

## Web Routes

| Route | Audience |
| ----- | -------- |
| `/login` | All |
| `/onboard/[token]` | Pending users |
| `/admin/onboard` | Admin |
| `/admin/users` | Admin |

## Data Model

**User** (Prisma):

- `role`, `status`, `email`, `phone`, `name`, `passwordHash`
- `onboardingToken`, `onboardingTokenExpiry`
- `stateId`, `zoneId`, `branchId` (nullable)
- `createdById`

## RBAC

- `@Roles('ADMIN')` guard on all `/onboarding/*` create/resend routes
- `@Roles('ADMIN')` on deactivate/reassign
- Public routes: login, validate token, complete onboarding
- JWT guard on all other routes; reject `DEACTIVATED` users

## Background Jobs

- `send-onboarding-email` — BullMQ job on user create / resend

## UI Notes

- Borrow login shell layout from `jubilee-nation` (navy + gold)
- Admin onboarding form: role select drives which org FK fields appear
- Show token expiry status on admin users list

## Acceptance

- [ ] End-to-end: Admin onboards → email → pastor sets password → dashboard
- [ ] Non-Admin gets 403 on onboarding API
- [ ] Deactivated user login rejected
- [ ] `progress-tracker.md` updated
