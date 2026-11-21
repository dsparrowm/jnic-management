import { Building2, GitBranch, Globe, Layers, MapPin, Plus } from "lucide-react";
import { allOrgStates, OrgTreeResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";

export interface OrgSummary {
  regions: number;
  states: number;
  zones: number;
  districts: number;
  branches: number;
}

interface OrgPageHeaderProps {
  orgTree: OrgTreeResponse;
  onAddRegion: () => void;
  onAddState: () => void;
  onAddZone: () => void;
  onAddDistrict: () => void;
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

export function computeOrgSummary(orgTree: OrgTreeResponse): OrgSummary {
  let zones = 0;
  let districts = 0;
  let branches = 0;
  for (const state of allOrgStates(orgTree)) {
    zones += state.zones.length;
    branches += state.branches.length;
    for (const zone of state.zones) {
      districts += zone.districts.length;
      branches += zone.branches.length;
      for (const district of zone.districts) {
        branches += district.branches.length;
      }
    }
  }
  return {
    regions: orgTree.regions.length,
    states: allOrgStates(orgTree).length,
    zones,
    districts,
    branches,
  };
}

export function OrgPageHeader({
  orgTree,
  onAddRegion,
  onAddState,
  onAddZone,
  onAddDistrict,
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
            Manage the territorial hierarchy — regions, states, zones, districts and branches.
            Pastor assignment is handled separately in the pastor directory.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <SummaryChip icon={Globe} label="Regions" value={summary.regions} />
            <SummaryChip icon={MapPin} label="States" value={summary.states} />
            <SummaryChip icon={Building2} label="Zones" value={summary.zones} />
            <SummaryChip icon={Layers} label="Districts" value={summary.districts} />
            <SummaryChip icon={GitBranch} label="Branches" value={summary.branches} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onAddRegion}>
            <Plus className="h-4 w-4" />
            Add region
          </Button>
          <Button type="button" variant="outline" onClick={onAddState}>
            <Plus className="h-4 w-4" />
            Add state
          </Button>
          <Button type="button" variant="outline" onClick={onAddZone}>
            <Plus className="h-4 w-4" />
            Add zone
          </Button>
          <Button type="button" variant="outline" onClick={onAddDistrict}>
            <Plus className="h-4 w-4" />
            Add district
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
