import { BadRequestException } from "@nestjs/common";
import {
  OrgAssignmentInput,
  ResolvedOrgAssignment,
  Role,
  validateOrgAssignmentStructure,
} from "@repo/types";
import { PrismaService } from "../prisma/prisma.service";

export async function resolveAndValidateOrgAssignment(
  prisma: PrismaService,
  role: Role,
  input: OrgAssignmentInput,
): Promise<ResolvedOrgAssignment> {
  let stateId = input.stateId?.trim() || null;
  let zoneId = input.zoneId?.trim() || null;
  let branchId = input.branchId?.trim() || null;

  if (branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { zone: true },
    });
    if (!branch) {
      throw new BadRequestException("Branch not found");
    }

    if (zoneId && zoneId !== branch.zoneId) {
      throw new BadRequestException("Zone does not match selected branch");
    }
    if (stateId && stateId !== branch.zone.stateId) {
      throw new BadRequestException("State does not match selected branch");
    }

    zoneId = branch.zoneId;
    stateId = branch.zone.stateId;
  } else if (zoneId) {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      throw new BadRequestException("Zone not found");
    }
    if (stateId && stateId !== zone.stateId) {
      throw new BadRequestException("State does not match selected zone");
    }
    stateId = zone.stateId;
  } else if (stateId) {
    const state = await prisma.state.findUnique({ where: { id: stateId } });
    if (!state) {
      throw new BadRequestException("State not found");
    }
  }

  const structuralError = validateOrgAssignmentStructure(role, { stateId, zoneId, branchId });
  if (structuralError) {
    throw new BadRequestException(structuralError);
  }

  if (role === Role.STATE_PASTOR && !input.zoneId?.trim() && !branchId) {
    zoneId = null;
  }

  if ((role === Role.STATE_PASTOR || role === Role.ZONAL_PASTOR) && !branchId) {
    branchId = null;
  }

  return { stateId, zoneId, branchId };
}
