"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Role } from "@repo/types";
import { cn } from "@/lib/utils";
import { formatRole, getNavSectionsForRole } from "@/lib/navigation";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  role: Role;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

export function AppSidebar({
  role,
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
}: AppSidebarProps) {
  const pathname = usePathname();
  const sections = getNavSectionsForRole(role);

  const sidebarContent = (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-background transition-all duration-300",
        collapsed ? "w-20" : "w-60",
      )}
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <div
          className={cn("flex items-center gap-2.5", collapsed && "w-full justify-center")}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            JN
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">JNLOP</p>
              <p className="truncate text-xs text-muted-foreground">{formatRole(role)}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden shrink-0 lg:inline-flex"
            onClick={() => onCollapsedChange(true)}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {collapsed && (
        <div className="hidden justify-center border-b border-border py-2 lg:flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange(false)}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3">
        {sections.map((section) => (
          <div key={section.id} className="mb-4 px-3">
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={() => onMobileOpenChange(false)}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      collapsed ? "justify-center" : "gap-2.5",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <>
      <div className="hidden h-full shrink-0 lg:block">{sidebarContent}</div>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close navigation"
          onClick={() => onMobileOpenChange(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-300",
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
