# Epic 2 — Pastor Profile

Read `AGENTS.md` before starting.

**Phase:** 3  
**User stories:** US-2.1, US-2.2

## Scope

Profile picture upload via Cloudinary and Admin pastor directory with filters.

**Out of scope:** Full profile editing (bio, qualifications) — MVP is photo + directory only.

## User Story Acceptance

### US-2.1 — Profile picture

- [x] Pastor can upload JPG or PNG
- [x] Max file size enforced (e.g. 2MB)
- [x] Optional basic crop on client before upload
- [x] Default placeholder avatar when no picture

### US-2.2 — Pastor directory

- [x] Admin sees all pastors with photo, role, assigned location
- [x] Filterable by state, zone, branch, role
- [x] Table and card views; resend onboarding and deactivate on same page

## API Endpoints

| Method | Path | Role | Purpose |
| ------ | ---- | ---- | ------- |
| POST | `/files/profile-picture/presign` | Authenticated | Get Cloudinary signed upload params |
| PATCH | `/users/me/profile-picture` | Authenticated | Save `profilePicUrl` after upload |
| GET | `/users/pastors` | Admin, state, zonal, and branch pastors | Paginated pastor directory with filters |
| GET | `/org/areas` | Authenticated pastors and HQ | State and zone names for directory filters |

## Web Routes

| Route | Audience |
| ----- | -------- |
| `/profile` | All pastors |
| `/admin/pastors` | Admin |

**Note:** `/admin/pastors` also hosts US-1.3 admin actions (resend onboarding, deactivate). `/admin/users` redirects here.

## Data Model

- `User.profilePicUrl` — Cloudinary delivery URL

## RBAC

- Any authenticated pastor can update own profile picture
- Admin, state pastors, zonal pastors, and branch pastors can read the pastor directory
- Onboard, reassign, and deactivate stay Admin-only

## Acceptance

- [x] Upload flow works end-to-end via presigned URL
- [x] Directory filters return correct subsets
- [x] `progress-tracker.md` updated
