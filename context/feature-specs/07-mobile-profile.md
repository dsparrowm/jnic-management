# Mobile profile screen

Read `AGENTS.md` before starting.

**Track:** post-MVP mobile UX  
**Depends on:** Epic 2 profile APIs (`GET /users/me`, presign upload)

## Scope

Redesign `/profile` to match the pastor Home light-shell patterns: identity hero,
grouped read-only cards, app shortcuts, and sign out.

**In scope**

- `ProfileHero` aligned with Home light hero
- Account + Assignment read-only cards
- Profile photo upload (presign → Cloudinary → `PATCH /users/me/profile-picture`)
- App shortcut rows (notifications, reports, role-specific tabs)
- Sign out

**Out of scope**

- Change password, notification prefs, self-service assignment edits

## Acceptance

- [x] Profile matches Home visual language (light hero, `SurfaceCard`, overline sections)
- [x] Photo upload works on device and web preview
- [x] Assignment reflects role hierarchy; dual-scope shows home branch
- [x] `progress-tracker.md` updated
