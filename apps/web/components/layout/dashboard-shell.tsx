"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getRefreshToken, getStoredUser, isAdmin, isLeadPastor } from "@/lib/auth";
import { api } from "@/lib/api";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();

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
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <header
        className="border-b px-6 py-4"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>
              JNLOP
            </p>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {user.name} · {user.role.replace(/_/g, " ")}
              </span>
            )}
            {isAdmin(user) && (
              <>
                <Link
                  href="/admin/onboard"
                  className={cnLink(pathname === "/admin/onboard")}
                >
                  Onboard
                </Link>
                <Link href="/admin/users" className={cnLink(pathname === "/admin/users")}>
                  Users
                </Link>
                <Link href="/admin/org" className={cnLink(pathname === "/admin/org")}>
                  Org
                </Link>
              </>
            )}
            {isLeadPastor(user) && (
              <Link
                href="/approvals/org"
                className={cnLink(pathname === "/approvals/org")}
              >
                Approvals
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}

function cnLink(active: boolean) {
  return `text-sm ${active ? "font-medium" : ""}`;
}
