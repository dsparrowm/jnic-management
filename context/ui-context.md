# UI Context

Design tokens for JNLOP — JNIC brand (navy sidebar, gold accent).

Extracted from the `jubilee-nation` mock demo (`src/styles.css`). Use semantic CSS
variables only; never hardcode hex in components.

## Theme

Light mode dashboard. Enterprise church operations UI — light gray page background,
white cards, navy sidebar, gold primary accent.

## Colors

All components use CSS custom properties defined in `apps/web/app/globals.css` (once
scaffolded).

| Role | CSS Variable | Value |
| ---- | ------------ | ----- |
| Page background | `--bg-base` | `#F4F6FB` |
| Surface / Card | `--bg-surface` | `#FFFFFF` |
| Elevated surface | `--bg-elevated` | `#FFFFFF` |
| Muted surface | `--bg-subtle` | `#EEF1F8` |
| Sidebar background | `--bg-sidebar` | `#0D1B3E` |
| Sidebar surface | `--bg-sidebar-surface` | `#162548` |
| Primary text | `--text-primary` | `#111827` |
| Muted text | `--text-muted` | `#6B7280` |
| Sidebar text | `--text-sidebar` | `#E5E9F2` |
| Sidebar muted text | `--text-sidebar-muted` | `#8A96B0` |
| Primary accent (gold) | `--accent-primary` | `#C9A050` |
| Accent hover | `--accent-hover` | `#B8903A` |
| Accent foreground | `--accent-foreground` | `#FFFFFF` |
| Border default | `--border-default` | `#E5E7EB` |
| Border sidebar | `--border-sidebar` | `#1E2F55` |
| Success | `--state-success` | `#16A34A` |
| Warning | `--state-warning` | `#D97706` |
| Error | `--state-error` | `#DC2626` |
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

Reuse dashboard tokens. Auth cards on `--bg-surface` over `--bg-base` page background.
Primary buttons use `--accent-primary` with `--accent-foreground` text.

## Typography

| Role | Font | Usage |
| ---- | ---- | ----- |
| UI text | Inter (`next/font/google`) | Body, tables, forms |
| Display | Plus Jakarta Sans | Page titles, headings |
| Mono | JetBrains Mono | IDs, codes, timestamps |

### Type Scale

| Usage | Classes |
| ----- | ------- |
| Page title | `text-2xl font-semibold font-display` |
| Page subtitle | `text-sm text-[--text-muted]` |
| Section label | `text-xs uppercase tracking-wide text-[--text-muted]` |
| Nav item | `text-sm` |
| Table header | `text-sm font-medium text-[--text-muted]` |
| Metric value | `text-3xl font-semibold` |
| Stat label | `text-sm text-[--text-muted]` |

## Layout

| Element | Value |
| ------- | ----- |
| Sidebar width | `260px` (`--sidebar-width`) |
| Header height | `64px` |
| Page padding | `p-6` |
| Card radius | `rounded-xl` |
| Button / input radius | `rounded-lg` (`--radius`) |
| Base radius token | `0.625rem` |

## App Shell

- **Sidebar** — Navy gradient (`sidebar-gradient`), JNIC logo, role-filtered nav groups
- **Header** — Page title, notifications bell, user avatar menu
- **Main** — Scrollable content on `--bg-base`
- **Cards** — White surface, subtle shadow (`--shadow-card-token`), optional `card-hover`

## Buttons

| Variant | Style |
| ------- | ----- |
| Primary | `bg-[--accent-primary] text-[--accent-foreground] hover:bg-[--accent-hover]` |
| Secondary | `border border-[--border-default] bg-white` |
| Ghost | `text-[--text-muted] hover:bg-[--bg-subtle]` |
| Destructive | `bg-[--state-error] text-white` |

## Status Badges (Reports)

| Status | Color token |
| ------ | ----------- |
| Submitted / Pending review | `--state-info` |
| Reviewed (zone/state/HQ) | `--state-success` |
| Overdue / Missed | `--state-warning` |
| Error / Rejected | `--state-error` |

## Icons

Lucide React. Inline `h-4 w-4`, nav `h-[18px] w-[18px]`.

## Data Display Patterns

Borrow from `jubilee-nation` mock:

- **Stat cards** — metric value + label + optional trend
- **Data tables** — sortable columns, status badges, row actions
- **Drill-down** — State → Zone → Branch breadcrumb navigation
- **Report form** — Unified attendance + finance sections in one submit
- **Feedback thread** — Comment list below report detail (informational, no blocking UI)
- **Missed submission flag** — Warning badge on branch rows in aggregate views

## Responsive

Mobile-first. Sidebar collapses to sheet/drawer below `lg` breakpoint.

## shadcn/ui

Map semantic tokens to shadcn variables in `globals.css` (same pattern as jubilee-nation).
Do not modify `components/ui/*` primitives — customise via `className` and CSS variables.
