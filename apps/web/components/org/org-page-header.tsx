import { Building2, GitBranch, MapPin, Plus } from "lucide-react";
import { OrgState } from "@/lib/api";
import { Button } from "@/components/ui/button";

export interface OrgSummary {
  states: number;
  zones: number;
  branches: number;
}

interface OrgPageHeaderProps {
  orgTree: OrgState[];
  onAddState: () => void;
  onAddZone: () => void;
  onAddBranch: () => void;
}

function SummaryChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function computeOrgSummary(orgTree: OrgState[]): OrgSummary {
  let zones = 0;
  let branches = 0;
  for (const state of orgTree) {
    zones += state.zones.length;
    for (const zone of state.zones) {
      branches += zone.branches.length;
    }
  }
  return { states: orgTree.length, zones, branches };
}

export function OrgPageHeader({
  orgTree,
  onAddState,
  onAddZone,
  onAddBranch,
}: OrgPageHeaderProps) {
  const summary = computeOrgSummary(orgTree);

  return (
    <div className="border-b border-border px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Administration
          </p>
          <h2 className="text-2xl font-semibold text-foreground">Organisation</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Manage the state, zone, and branch hierarchy. Pastor assignment is handled separately
            in the pastor directory.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <SummaryChip icon={MapPin} label="States" value={summary.states} />
            <SummaryChip icon={Building2} label="Zones" value={summary.zones} />
            <SummaryChip icon={GitBranch} label="Branches" value={summary.branches} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onAddState}>
            <Plus className="h-4 w-4" />
            Add state
          </Button>
          <Button type="button" variant="outline" onClick={onAddZone}>
            <Plus className="h-4 w-4" />
            Add zone
          </Button>
          <Button type="button" onClick={onAddBranch}>
            <Plus className="h-4 w-4" />
            Add branch
          </Button>
        </div>
      </div>
    </div>
  );
}
