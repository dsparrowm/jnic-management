# UI Context

Design tokens for JNLOP — JNIC brand accents on a **Rokswood-style** light enterprise shell.

**UX reference:** `rokswood-hive-web` (`/home/davies/rokswood-hive-web`) for app shell layout,
navigation, and dense dashboard patterns. Borrow `jubilee-nation` only for report form field
structure (Phase 4+), not sidebar chrome.

Use semantic CSS variables only; never hardcode hex in components.

## Theme

Light mode enterprise portal — soft gray page background (`--bg-base`), white sidebar and
header surfaces, JNIC gold as primary CTA/accent. Compact, high-information layouts.

## Colors

All components use CSS custom properties in `apps/web/app/globals.css`.

| Role | CSS Variable | Value |
| ---- | ------------ | ----- |
| Page background | `--bg-base` | `#F4F6FB` |
| Surface / Card | `--bg-surface` / `--card` | `#FFFFFF` |
| Muted surface | `--bg-subtle` / `--muted` | `#EEF1F8` / `#F3F4F6` |
| Brand navy (accents, charts) | `--bg-brand-navy` | `#0D1B3E` |
| Primary text | `--text-primary` / `--foreground` | `#111827` |
| Muted text | `--text-muted` / `--muted-foreground` | `#6B7280` |
| Primary accent (gold) | `--accent-primary` / `--primary` | `#C9A050` |
| Accent hover | `--accent-hover` | `#B8903A` |
| Accent foreground | `--accent-foreground` / `--primary-foreground` | `#FFFFFF` |
| Border default | `--border-default` / `--border` | `#E5E7EB` |
| Success | `--state-success` | `#16A34A` |
| Warning | `--state-warning` | `#D97706` |
| Error | `--state-error` / `--destructive` | `#DC2626` |
| Info | `--state-info` | `#2563EB` |

### Chart palette

| Role | CSS Variable | Value |
| ---- | ------------ | ----- |
| Gold | `--chart-gold` | `#C9A050` |
| Navy | `--chart-navy` | `#0D1B3E` |
| Info | `--chart-info` | `#2563EB` |
| Success | `--chart-success` | `#16A34A` |
| Warning | `--chart-warning` | `#D97706` |

### Auth pages (login, onboard)

Auth cards on `--bg-surface` over `--bg-base` page background. Primary buttons use
`--accent-primary` with `--accent-foreground` text.

Login uses a **split layout** (jubilee-nation reference): navy `--sidebar-gradient` hero panel
on large screens, form card on the right with `--shadow-lg-token`. Sign-in CTA uses
`--bg-sidebar` / `--bg-sidebar-surface`.

## Typography

| Role | Font | Usage |
| ---- | ---- | ----- |
| UI text | Inter (system stack) | Body, tables, forms |
| Display | Plus Jakarta Sans | Page titles, headings |
| Mono | JetBrains Mono | IDs, codes, timestamps |

### Type Scale

| Usage | Classes |
| ----- | ------- |
| Page title | `text-xl font-bold` (header) / `text-2xl font-semibold` (in-page) |
| Page subtitle | `text-sm text-muted-foreground` |
| Section label | `text-xs uppercase tracking-wider text-muted-foreground` |
| Nav item | `text-sm` |
| Table header | `text-sm font-medium text-muted-foreground` |
| Metric value | `text-2xl font-semibold` |
| Stat label | `text-sm text-muted-foreground` |

## Layout

| Element | Value |
| ------- | ----- |
| Sidebar width (expanded) | `240px` (`w-60`) |
| Sidebar width (collapsed) | `80px` (`w-20`) |
| Header height | ~`56px` |
| Page padding | `p-4 lg:p-6` |
| Card radius | `rounded-lg` |
| Button / input radius | `rounded-lg` (`--radius`) |
| Base radius token | `0.625rem` |

## App Shell (Rokswood pattern)

- **Sidebar** — White (`bg-background`), right border, collapsible, grouped nav sections
  (Core / Administration / Leadership), Lucide icons, `bg-muted` active state
- **Header** — White bar with page title, disabled search placeholder, notifications bell
  (Phase 5), user avatar dropdown with logout
- **Main** — Scrollable content on `bg-muted/40` over `--bg-base`
- **Cards** — White surface, `border-border`, subtle `shadow-sm`

## Buttons

Use shared `Button` from `components/ui/button.tsx`.

| Variant | Style |
| ------- | ----- |
| Primary (default) | `bg-primary text-primary-foreground hover:bg-primary/90` |
| Outline | `border border-border bg-background` |
| Secondary | `bg-secondary text-secondary-foreground` |
| Ghost | `text-muted-foreground hover:bg-muted` |
| Destructive | `bg-destructive text-white` |

## Status Badges (Reports)

| Status | Color token |
| ------ | ----------- |
| Submitted / Pending review | `--state-info` |
| Reviewed (zone/state/HQ) | `--state-success` |
| Overdue / Missed | `--state-warning` |
| Error / Rejected | `--state-error` |

## Icons

Lucide React. Inline `h-4 w-4`, nav `h-4 w-4`.

## Data Display Patterns

Borrow from **Rokswood** for shell and cards; **jubilee-nation** for report forms only:

- **Stat cards** — metric value + label + icon chip in muted box
- **Data tables** — sortable columns, status badges, row actions
- **Drill-down** — State → Zone → Branch breadcrumb navigation
- **Report form** — Unified attendance + finance sections (Phase 4)
- **Feedback thread** — Comment list below report detail (Phase 5)
- **Missed submission flag** — Warning badge on branch rows

## Responsive

Mobile-first. Sidebar hidden below `lg`; hamburger opens slide-over drawer with backdrop.

## Mobile HQ Home

The sibling Expo app uses the same semantic navy/gold palette with a native command-center
composition rather than reproducing web cards:

- Compact identity hero with profile image fallback, greeting, role, and reporting week
- One high-emphasis weekly health card with report coverage and a contextual action
- Three compact role-aware KPIs; avoid oversized stat grids and duplicate navigation shortcuts
- Action queue ordered by operational severity, followed by an accessible six-week attendance trend
- Recent activity is sourced only from persisted user notifications; provide deliberate loading,
  error, refresh, and empty states
- Minimum interactive target is `44px`; charts require a screen-reader summary and layouts must
  remain usable at 150% text scaling

## Mobile Screen System

All Expo routes extend the Home visual language through shared mobile primitives:

- Navy safe-area hero with icon, title, supporting copy, and optional role/status action
- Light content sheet that overlaps the hero; white elevated surfaces use semantic status tones
- Gold-tinted pull-to-refresh, skeleton first loads, icon-led empty states, and inline retry notices
- Grouped rows, shared month navigation, search controls, and status pills use `44px` targets
- Native form sheets include a drag handle, close action, safe-area spacing, and guarded dismissal
- Login sits on navy without a wrapping form card: JNIC logo, JNLOP, on-navy fields, and
  gold Sign in. Unavailable and not-found use the same tokens without the tab layout

### Android Back contract

- A form sheet or modal handles Back first and confirms before discarding entered data
- Back on a non-Home root tab returns to Home
- Back on Home, Login, or the unavailable screen is left to Android’s normal exit/minimize behavior
- Submitting forms cannot be dismissed through hardware Back

## shadcn/ui

Primitives in `components/ui/*` — do not modify generated files. Map JNIC tokens to shadcn
variables in `globals.css`. Customise via `className` and CSS variables.
