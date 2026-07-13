import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type IconTone = "primary" | "info" | "success" | "warning" | "destructive";

const toneClasses: Record<IconTone, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-blue-50 text-[var(--state-info)]",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  destructive: "bg-red-50 text-red-700",
};

interface OverviewStatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  href?: string;
  iconTone?: IconTone;
  className?: string;
}

export function OverviewStatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  iconTone = "primary",
  className,
}: OverviewStatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className={cn("rounded-lg p-2.5", toneClasses[iconTone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <p className="font-mono text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </>
  );

  const cardClassName = cn(
    "rounded-lg border border-border bg-card p-5 shadow-sm transition-colors",
    href && "hover:bg-muted/40",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn("block", cardClassName)}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
