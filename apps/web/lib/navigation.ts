import { Role, canSubmitWeeklyReports } from "@repo/types";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
  UserCircle,
  UsersRound,
  BarChart3,
  CheckSquare,
} from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

const ALL_ROLES = Object.values(Role);

export const navSections: NavSection[] = [
  {
    id: "core",
    label: "Core",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ALL_ROLES,
      },
      {
        id: "profile",
        label: "Profile",
        href: "/profile",
        icon: UserCircle,
        roles: ALL_ROLES,
      },
      {
        id: "submit-report",
        label: "Submit Report",
        href: "/reports/submit",
        icon: ClipboardList,
        roles: [Role.STATE_PASTOR, Role.ZONAL_PASTOR, Role.BRANCH_PASTOR],
      },
      {
        id: "summaries",
        label: "Monthly Summaries",
        href: "/summaries",
        icon: BarChart3,
        roles: [
          Role.BRANCH_PASTOR,
          Role.ZONAL_PASTOR,
          Role.STATE_PASTOR,
          Role.LEAD_PASTOR,
          Role.ADMIN,
        ],
      },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      {
        id: "pastors",
        label: "Pastors",
        href: "/admin/pastors",
        icon: UsersRound,
        roles: [Role.ADMIN],
      },
      {
        id: "org",
        label: "Organisation",
        href: "/admin/org",
        icon: Building2,
        roles: [Role.ADMIN],
      },
    ],
  },
  {
    id: "leadership",
    label: "Leadership",
    items: [
      {
        id: "zone-reports",
        label: "Zone Reports",
        href: "/reports/zone",
        icon: ClipboardList,
        roles: [Role.ZONAL_PASTOR],
      },
      {
        id: "state-reports",
        label: "State Reports",
        href: "/reports/state",
        icon: ClipboardList,
        roles: [Role.STATE_PASTOR],
      },
      {
        id: "national-reports",
        label: "National Reports",
        href: "/reports/national",
        icon: ClipboardList,
        roles: [Role.LEAD_PASTOR, Role.ADMIN],
      },
      {
        id: "summary-approvals",
        label: "Summary Approvals",
        href: "/approvals/summaries",
        icon: CheckSquare,
        roles: [Role.LEAD_PASTOR],
      },
    ],
  },
];

export function getNavSectionsForRole(role: Role, branchId?: string | null): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.id === "submit-report") {
          return canSubmitWeeklyReports(role, branchId);
        }
        return item.roles.includes(role);
      }),
    }))
    .filter((section) => section.items.length > 0);
}

export function formatRole(role: string): string {
  return role.replace(/_/g, " ");
}

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/profile": "Profile",
    "/reports/submit": "Submit Report",
    "/reports/zone": "Zone Reports",
    "/reports/state": "State Reports",
    "/reports/national": "National Reports",
    "/summaries": "Monthly Summaries",
    "/approvals/summaries": "Summary Approvals",
    "/admin/pastors": "Pastors",
    "/admin/org": "Organisation",
    "/approvals/org": "Org Approvals",
  };
  return titles[pathname] ?? "JNLOP";
}
