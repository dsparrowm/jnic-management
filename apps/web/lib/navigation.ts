import { Role } from "@repo/types";
import {
  Building2,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
  UserCircle,
  UsersRound,
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
        roles: [Role.BRANCH_PASTOR, Role.ADMIN_STAFF],
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
        id: "org-approvals",
        label: "Org Approvals",
        href: "/approvals/org",
        icon: CheckSquare,
        roles: [Role.LEAD_PASTOR],
      },
    ],
  },
];

export function getNavSectionsForRole(role: Role): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
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
    "/admin/pastors": "Pastors",
    "/admin/org": "Organisation",
    "/approvals/org": "Org Approvals",
  };
  return titles[pathname] ?? "JNLOP";
}
