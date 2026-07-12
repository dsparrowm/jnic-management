import { LucideIcon } from "lucide-react";

interface SummaryStatProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive";
}

export function SummaryStat({ label, value, icon: Icon, tone = "default" }: SummaryStatProps) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700 bg-emerald-50"
      : tone === "warning"
        ? "text-amber-700 bg-amber-50"
        : tone === "destructive"
          ? "text-red-700 bg-red-50"
          : "text-muted-foreground bg-muted";

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
