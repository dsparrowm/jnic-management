"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, GitBranch, Globe, MapPin, Plus } from "lucide-react";
import { OrgBranch, OrgState, OrgTreeResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrgHierarchyPanelProps {
  orgTree: OrgTreeResponse;
  onAddRegion: () => void;
}

function PastorSeat({ name, placeholder }: { name: string | null; placeholder: string }) {
  return (
    <span className="text-xs text-muted-foreground">
      {name ? name : `No ${placeholder}`}
    </span>
  );
}

function BranchRow({ branch }: { branch: OrgBranch }) {
  return (
    <li className={cn("flex items-start gap-2 rounded-md px-3 py-2 text-sm", "text-muted-foreground hover:bg-muted/50")}>
      <GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>
        <span className="font-medium text-foreground">{branch.name}</span>
        {branch.address && (
          <p className="text-xs text-muted-foreground">{branch.address}</p>
        )}
        <PastorSeat name={branch.pastor?.name ?? null} placeholder="branch pastor" />
      </div>
    </li>
  );
}

export function OrgHierarchyPanel({ orgTree, onAddRegion }: OrgHierarchyPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasAny = orgTree.regions.length > 0 || orgTree.unassignedStates.length > 0;

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
        <MapPin className="h-10 w-10 text-muted-foreground/60" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">No organisation yet</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Start by adding a region, then create states, zones, districts and branches beneath it.
        </p>
        <Button type="button" className="mt-6" onClick={onAddRegion}>
          <Plus className="h-4 w-4" />
          Add region
        </Button>
      </div>
    );
  }

  function renderState(state: OrgState, depth: number) {
    const open = expanded.has(state.id);
    const pad = { paddingLeft: `${depth * 24 + 16}px` };
    return (
      <div key={state.id} className="border-b border-border last:border-b-0">
        <button
          type="button"
          onClick={() => toggle(state.id)}
          className="flex w-full items-center gap-3 py-2.5 pr-4 text-left transition-colors hover:bg-muted/50"
          style={pad}
        >
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium text-foreground">{state.name}</span>
          <PastorSeat name={state.pastor?.name ?? null} placeholder="state pastor" />
          <span className="ml-auto text-xs text-muted-foreground">
            {state.zones.length} zone{state.zones.length === 1 ? "" : "s"}
          </span>
        </button>

        {open && (
          <div className="bg-muted/20">
            {state.zones.length === 0 && state.branches.length === 0 && (
              <p className="py-3 text-sm text-muted-foreground" style={{ paddingLeft: `${(depth + 1) * 24 + 16}px` }}>
                No zones in this state
              </p>
            )}
            {state.zones.map((zone) => {
              const zoneOpen = expanded.has(zone.id);
              return (
                <div key={zone.id}>
                  <button
                    type="button"
                    onClick={() => toggle(zone.id)}
                    className="flex w-full items-center gap-3 py-2.5 pr-4 text-left transition-colors hover:bg-muted/50"
                    style={{ paddingLeft: `${(depth + 1) * 24 + 16}px` }}
                  >
                    {zoneOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">{zone.name}</span>
                    <PastorSeat name={zone.pastor?.name ?? null} placeholder="zonal pastor" />
                    <span className="ml-auto text-xs text-muted-foreground">
                      {zone.districts.length} district{zone.districts.length === 1 ? "" : "s"}
                    </span>
                  </button>

                  {zoneOpen && (
                    <div>
                      {zone.districts.map((district) => {
                        const distOpen = expanded.has(district.id);
                        return (
                          <div key={district.id}>
                            <button
                              type="button"
                              onClick={() => toggle(district.id)}
                              className="flex w-full items-center gap-3 py-2 pr-4 text-left transition-colors hover:bg-muted/50"
                              style={{ paddingLeft: `${(depth + 2) * 24 + 16}px` }}
                            >
                              {distOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )}
                              <span className="text-sm font-medium text-foreground">{district.name}</span>
                              <PastorSeat name={district.pastor?.name ?? null} placeholder="district pastor" />
                              <span className="ml-auto text-xs text-muted-foreground">
                                {district.branches.length} branch{district.branches.length === 1 ? "" : "es"}
                              </span>
                            </button>
                            {distOpen && (
                              <ul className="pb-2" style={{ paddingLeft: `${(depth + 3) * 24 + 16}px` }}>
                                {district.branches.length === 0 ? (
                                  <li className="py-2 text-sm text-muted-foreground">No branches in this district</li>
                                ) : (
                                  district.branches.map((b) => <BranchRow key={b.id} branch={b} />)
                                )}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                      {zone.branches.length > 0 && (
                        <ul className="pb-2" style={{ paddingLeft: `${(depth + 2) * 24 + 16}px` }}>
                          <li className="py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Unassigned to a district
                          </li>
                          {zone.branches.map((b) => <BranchRow key={b.id} branch={b} />)}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {state.branches.map((b) => (
              <div
                key={b.id}
                className="flex items-start gap-2 py-2.5 pr-4 text-sm"
                style={{ paddingLeft: `${(depth + 1) * 24 + 16}px` }}
              >
                <GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <span className="font-medium text-foreground">{b.name}</span>
                  <p className="text-xs text-muted-foreground">No zone</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Hierarchy</h3>
        <p className="text-xs text-muted-foreground">
          Regions, states, zones, districts and branches across JNIC
        </p>
      </div>
      <div className="divide-y divide-border">
        {orgTree.regions.map((region) => {
          const open = expanded.has(region.id);
          return (
            <div key={region.id}>
              <button
                type="button"
                onClick={() => toggle(region.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                {open ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <Globe className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium text-foreground">{region.name}</span>
                <PastorSeat name={region.pastor?.name ?? null} placeholder="regional pastor" />
                <span className="ml-auto text-xs text-muted-foreground">
                  {region.states.length} state{region.states.length === 1 ? "" : "s"}
                </span>
              </button>
              {open && (
                <div className="border-t border-border bg-muted/10">
                  {region.states.length === 0 ? (
                    <p className="px-12 py-4 text-sm text-muted-foreground">No states in this region</p>
                  ) : (
                    region.states.map((state) => renderState(state, 1))
                  )}
                </div>
              )}
            </div>
          );
        })}
        {orgTree.unassignedStates.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              States without a region
            </div>
            {orgTree.unassignedStates.map((state) => renderState(state, 0))}
          </div>
        )}
      </div>
    </div>
  );
}
