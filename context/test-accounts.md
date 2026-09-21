# Test pastor accounts

Use these for mobile/web flow testing. **Do not commit production passwords.**

## Provision on Render (recommended)

1. In [Render](https://dashboard.render.com), open the JNLOP Postgres instance → **Connect** → copy the **External Database URL**.
2. From the monorepo root:

```bash
DATABASE_URL="postgresql://..." pnpm exec tsx apps/api/scripts/provision-test-pastors.ts
```

This creates or refreshes **ACTIVE** accounts (no email onboarding step).

## Default credentials

| Role | Email | Password | Scope |
| ---- | ----- | -------- | ----- |
| Zonal pastor | `zonal@jnic.org` | `ChangeMe123!` | Victoria Island zone · home branch VI Main Campus |
| State pastor | `state@jnic.org` | `ChangeMe123!` | Lagos State |

Override with env vars: `PROVISION_ZONAL_EMAIL`, `PROVISION_ZONAL_PASSWORD`, `PROVISION_STATE_EMAIL`, `PROVISION_STATE_PASSWORD`, `PROVISION_BRANCH_NAME`.

## Alternative: Admin onboarding (email link)

1. Web → **Pastors** → **Onboard pastor**
2. **Zonal pastor:** role `ZONAL_PASTOR`, state + zone = Victoria Island, optional home branch = VI Main Campus
3. **State pastor:** role `STATE_PASTOR`, state = Lagos State
4. Pastor completes `/onboard/[token]` on web to set password (48h link)

## Existing accounts (reference)

| Role | Email | Notes |
| ---- | ----- | ----- |
| Admin | `admin@jnic.org` | Platform admin |
| Lead pastor | `lead@jnic.org` | HQ approvals |
| Branch pastor | Davies test account | VI Main Campus (production) |
| Zonal pastor | `joycehope1530@gmail.com` | Onboarded via Admin UI · Victoria Island zone (password not stored in repo) |
