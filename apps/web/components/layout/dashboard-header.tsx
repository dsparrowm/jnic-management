"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Menu, Search } from "lucide-react";
import { AuthUser, api } from "@/lib/api";
import { clearSession, getRefreshToken } from "@/lib/auth";
import { formatRole } from "@/lib/navigation";
import { UserAvatar } from "@/components/profile/user-avatar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  user: AuthUser;
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export function DashboardHeader({ user, title, subtitle, onMenuClick }: DashboardHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await api.logout(refresh);
      } catch {
        // ignore
      }
    }
    clearSession();
    router.push("/login");
  }

  return (
    <header className="border-b border-border bg-background px-4 py-3 lg:px-6">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-foreground lg:text-xl">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground lg:text-sm">{subtitle}</p>
          )}
        </div>

        <div className="hidden max-w-md flex-1 lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search pastors, branches, reports..."
              disabled
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted"
              >
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{formatRole(user.role)}</p>
                </div>
                <UserAvatar
                  name={user.name}
                  profilePicUrl={user.profilePicUrl}
                  className="h-9 w-9"
                  fallbackClassName="bg-primary text-primary-foreground"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span>{user.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => void handleLogout()}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
