import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT = {
  ACTIVE: "success",
  PENDING: "warning",
  DEACTIVATED: "destructive",
} as const;

export function PastorStatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANT[status as keyof typeof STATUS_VARIANT] ?? "muted";
  const label = status.replace(/_/g, " ");

  return (
    <Badge variant={variant} className="gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "ACTIVE"
            ? "bg-emerald-500"
            : status === "PENDING"
              ? "bg-amber-500"
              : "bg-red-500"
        }`}
      />
      {label}
    </Badge>
  );
}
