import { BadRequestException } from "@nestjs/common";
import {
  OrgAssignmentInput,
  ResolvedOrgAssignment,
  Role,
  validateOrgAssignmentStructure,
} from "@repo/types";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Resolves a person's territorial seat along the five-tier chain
 * Region -> State -> Zone -> District -> Branch, deriving every ancestor
 * id from the most specific entity supplied.
 */
export async function resolveAndValidateOrgAssignment(
  prisma: PrismaService,
  role: Role,
  input: OrgAssignmentInput,
): Promise<ResolvedOrgAssignment> {
  let regionId = input.regionId?.trim() || null;
  let stateId = input.stateId?.trim() || null;
  let zoneId = input.zoneId?.trim() || null;
  let districtId = input.districtId?.trim() || null;
  let branchId = input.branchId?.trim() || null;

  if (branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { zone: true, district: true },
    });
    if (!branch) {
      throw new BadRequestException("Branch not found");
    }

    if (districtId && branch.districtId && districtId !== branch.districtId) {
      throw new BadRequestException("District does not match selected branch");
    }
    if (zoneId && branch.zoneId && zoneId !== branch.zoneId) {
      throw new BadRequestException("Zone does not match selected branch");
    }
    if (stateId && stateId !== branch.stateId) {
      throw new BadRequestException("State does not match selected branch");
    }

    districtId = branch.districtId;
    zoneId = branch.district?.zoneId ?? branch.zoneId;
    stateId = branch.stateId;
  }

  if (districtId) {
    const district = await prisma.district.findUnique({
      where: { id: districtId },
      include: { zone: { include: { state: true } } },
    });
    if (!district) {
      throw new BadRequestException("District not found");
    }
    if (zoneId && zoneId !== district.zoneId) {
      throw new BadRequestException("Zone does not match selected district");
    }
    if (stateId && stateId !== district.zone.stateId) {
      throw new BadRequestException("State does not match selected district");
    }
    zoneId = district.zoneId;
    stateId = district.zone.stateId;
  }

  if (zoneId) {
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: { state: true },
    });
    if (!zone) {
      throw new BadRequestException("Zone not found");
    }
    if (stateId && stateId !== zone.stateId) {
      throw new BadRequestException("State does not match selected zone");
    }
    stateId = zone.stateId;
  }

  if (stateId) {
    const state = await prisma.state.findUnique({
      where: { id: stateId },
      include: { region: true },
    });
    if (!state) {
      throw new BadRequestException("State not found");
    }
    if (regionId && state.regionId && regionId !== state.regionId) {
      throw new BadRequestException("Region does not match selected state");
    }
    regionId = state.regionId;
  } else if (regionId) {
    const region = await prisma.region.findUnique({ where: { id: regionId } });
    if (!region) {
      throw new BadRequestException("Region not found");
    }
  }

  const structuralError = validateOrgAssignmentStructure(role, {
    regionId,
    stateId,
    zoneId,
    districtId,
    branchId,
  });
  if (structuralError) {
    throw new BadRequestException(structuralError);
  }

  if (role === Role.REGIONAL_PASTOR) {
    stateId = null;
    zoneId = null;
    districtId = null;
    branchId = null;
  }

  if (role === Role.STATE_PASTOR && !input.zoneId?.trim() && !districtId && !branchId) {
    zoneId = null;
    districtId = null;
  }

  if (
    (role === Role.STATE_PASTOR || role === Role.ZONAL_PASTOR || role === Role.REGIONAL_PASTOR) &&
    !branchId
  ) {
    districtId = null;
    branchId = null;
  }

  if (role === Role.DISTRICT_PASTOR && !branchId) {
    branchId = null;
  }

  return { regionId, stateId, zoneId, districtId, branchId };
}
