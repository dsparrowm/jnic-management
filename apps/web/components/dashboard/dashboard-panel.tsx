import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardPanelProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function DashboardPanel({
  title,
  description,
  actionHref,
  actionLabel = "View all",
  children,
  className,
}: DashboardPanelProps) {
  return (
    <section className={cn("rounded-lg border border-border bg-card shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actionHref && (
          <Link
            href={actionHref}
            className="shrink-0 text-xs font-medium text-primary hover:text-primary/80"
          >
            {actionLabel}
          </Link>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
