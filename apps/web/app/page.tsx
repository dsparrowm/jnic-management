import type { HealthResponse } from "@repo/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getApiHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json() as Promise<HealthResponse>;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const health = await getApiHealth();

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-3xl">
        <div
          className="rounded-xl border p-8"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-default)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <p
            className="text-sm font-medium uppercase tracking-wide"
            style={{ color: "var(--accent-primary)" }}
          >
            JNLOP MVP
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Jubilee Nation Leadership & Operations</h1>
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            Phase 0 scaffold — monorepo, API health check, and design tokens are in place.
            Next: Auth + Onboarding (Epic 1).
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <StatusCard
              label="Web app"
              status="ok"
              detail="Next.js 15 on port 3000"
            />
            <StatusCard
              label="API"
              status={health ? "ok" : "error"}
              detail={
                health
                  ? `${health.service} — ${health.timestamp}`
                  : `Unreachable at ${API_URL}/health`
              }
            />
          </div>

          <p className="mt-8 text-xs" style={{ color: "var(--text-muted)" }}>
            Run <code className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5">docker compose up -d</code>{" "}
            then <code className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5">pnpm db:migrate</code>{" "}
            before Phase 1.
          </p>
        </div>
      </div>
    </main>
  );
}

function StatusCard({
  label,
  status,
  detail,
}: {
  label: string;
  status: "ok" | "error";
  detail: string;
}) {
  const color = status === "ok" ? "var(--state-success)" : "var(--state-error)";

  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: "var(--border-default)", background: "var(--bg-base)" }}
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
        {detail}
      </p>
    </div>
  );
}
