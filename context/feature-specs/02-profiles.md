# Epic 2 — Pastor Profile

Read `AGENTS.md` before starting.

**Phase:** 3  
**User stories:** US-2.1, US-2.2

## Scope

Profile picture upload via Cloudflare R2 and Admin pastor directory with filters.

**Out of scope:** Full profile editing (bio, qualifications) — MVP is photo + directory only.

## User Story Acceptance

### US-2.1 — Profile picture

- [ ] Pastor can upload JPG or PNG
- [ ] Max file size enforced (e.g. 2MB)
- [ ] Optional basic crop on client before upload
- [ ] Default placeholder avatar when no picture

### US-2.2 — Pastor directory

- [x] Admin sees all pastors with photo, role, assigned location
- [x] Filterable by state, zone, branch, role
- [x] Table and card views; resend onboarding and deactivate on same page

## API Endpoints

| Method | Path | Role | Purpose |
| ------ | ---- | ---- | ------- |
| POST | `/files/profile-picture/presign` | Authenticated | Get R2 presigned upload URL |
| PATCH | `/users/me/profile-picture` | Authenticated | Save `profilePicUrl` after upload |
| GET | `/users/pastors` | Admin | Paginated pastor directory with filters |

## Web Routes

| Route | Audience |
| ----- | -------- |
| `/profile` | All pastors |
| `/admin/pastors` | Admin |

**Note:** `/admin/pastors` also hosts US-1.3 admin actions (resend onboarding, deactivate). `/admin/users` redirects here.

## Data Model

- `User.profilePicUrl` — R2 public or signed URL

## RBAC

- Any authenticated pastor can update own profile picture
- Only Admin can access pastor directory list

## Acceptance

- [ ] Upload flow works end-to-end via presigned URL
- [ ] Directory filters return correct subsets
- [ ] `progress-tracker.md` updated
