import { OrgChangeStatus, OrgChangeType } from "@repo/database";

export type OrgPastorRef = {
  id: string;
  name: string;
} | null;

export type OrgTreeBranch = {
  id: string;
  name: string;
  address: string | null;
  districtId: string | null;
  zoneId: string | null;
  stateId: string;
  pastor: OrgPastorRef;
};

export type OrgTreeDistrict = {
  id: string;
  name: string;
  zoneId: string;
  pastor: OrgPastorRef;
  branches: OrgTreeBranch[];
};

export type OrgTreeZone = {
  id: string;
  name: string;
  stateId: string;
  pastor: OrgPastorRef;
  districts: OrgTreeDistrict[];
  /** Branches in this zone not yet assigned to a district. */
  branches: OrgTreeBranch[];
};

export type OrgTreeState = {
  id: string;
  name: string;
  regionId: string | null;
  pastor: OrgPastorRef;
  zones: OrgTreeZone[];
  /** Branches in this state that are not assigned to a zone or district. */
  branches: OrgTreeBranch[];
};

export type OrgTreeRegion = {
  id: string;
  name: string;
  pastor: OrgPastorRef;
  states: OrgTreeState[];
};

export type OrgTreeResponse = {
  regions: OrgTreeRegion[];
  /** States not assigned to a region. */
  unassignedStates: OrgTreeState[];
};

export type OrgChangeRequestView = {
  id: string;
  type: OrgChangeType;
  payload: Record<string, unknown>;
  status: OrgChangeStatus;
  reviewNote: string | null;
  createdAt: Date;
  requestedBy: { id: string; name: string; email: string };
  reviewedBy: { id: string; name: string; email: string } | null;
};

export function toChangeRequestView(request: {
  id: string;
  type: OrgChangeType;
  payload: unknown;
  status: OrgChangeStatus;
  reviewNote: string | null;
  createdAt: Date;
  requestedBy: { id: string; name: string; email: string };
  reviewedBy?: { id: string; name: string; email: string } | null;
}): OrgChangeRequestView {
  return {
    id: request.id,
    type: request.type,
    payload: request.payload as Record<string, unknown>,
    status: request.status,
    reviewNote: request.reviewNote,
    createdAt: request.createdAt,
    requestedBy: request.requestedBy,
    reviewedBy: request.reviewedBy ?? null,
  };
}
