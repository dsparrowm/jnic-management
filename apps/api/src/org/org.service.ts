import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrgChangeStatus, OrgChangeType, Prisma, UserStatus } from "@repo/database";
import type { Branch, District, Region, State, Zone } from "@repo/database";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateBranchDto,
  CreateDistrictDto,
  CreateOrgChangeRequestDto,
  CreateRegionDto,
  CreateStateDto,
  CreateZoneDto,
  UpdateBranchDto,
  UpdateDistrictDto,
  UpdateRegionDto,
  UpdateStateDto,
  UpdateZoneDto,
} from "./dto/org.dto";
import {
  OrgChangeRequestView,
  OrgPastorRef,
  OrgTreeBranch,
  OrgTreeResponse,
  OrgTreeState,
  toChangeRequestView,
} from "./org.types";

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  /** Flat area lists for pickers (onboarding, reassignment, admin forms). */
  async listAreas() {
    const [regions, states, zones, districts, branches] = await Promise.all([
      this.prisma.region.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      this.prisma.state.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, regionId: true },
      }),
      this.prisma.zone.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, stateId: true },
      }),
      this.prisma.district.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, zoneId: true },
      }),
      this.prisma.branch.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, address: true, stateId: true, zoneId: true, districtId: true },
      }),
    ]);
    return { regions, states, zones, districts, branches };
  }

  async getTree(): Promise<OrgTreeResponse> {
    const [regions, states] = await Promise.all([
      this.prisma.region.findMany({
        orderBy: { name: "asc" },
        include: {
          regionalPastor: { select: { id: true, name: true } },
        },
      }),
      this.prisma.state.findMany({
        orderBy: { name: "asc" },
        include: {
          statePastor: { select: { id: true, name: true } },
          zones: {
            orderBy: { name: "asc" },
            include: {
              zonalPastor: { select: { id: true, name: true } },
              districts: {
                orderBy: { name: "asc" },
                include: {
                  districtPastor: { select: { id: true, name: true } },
                  branches: {
                    orderBy: { name: "asc" },
                    include: { branchPastor: { select: { id: true, name: true } } },
                  },
                },
              },
              branches: {
                where: { districtId: null },
                orderBy: { name: "asc" },
                include: { branchPastor: { select: { id: true, name: true } } },
              },
            },
          },
          branches: {
            where: { zoneId: null, districtId: null },
            orderBy: { name: "asc" },
            include: { branchPastor: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    const mapBranch = (branch: {
      id: string;
      name: string;
      address: string | null;
      districtId: string | null;
      zoneId: string | null;
      stateId: string;
      branchPastor: OrgPastorRef;
    }): OrgTreeBranch => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      districtId: branch.districtId,
      zoneId: branch.zoneId,
      stateId: branch.stateId,
      pastor: branch.branchPastor,
    });

    const mapState = (state: (typeof states)[number]): OrgTreeState => ({
      id: state.id,
      name: state.name,
      regionId: state.regionId,
      pastor: state.statePastor,
      zones: state.zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        stateId: zone.stateId,
        pastor: zone.zonalPastor,
        districts: zone.districts.map((district) => ({
          id: district.id,
          name: district.name,
          zoneId: district.zoneId,
          pastor: district.districtPastor,
          branches: district.branches.map(mapBranch),
        })),
        branches: zone.branches.map(mapBranch),
      })),
      branches: state.branches.map(mapBranch),
    });

    return {
      regions: regions.map((region) => ({
        id: region.id,
        name: region.name,
        pastor: region.regionalPastor,
        states: states.filter((s) => s.regionId === region.id).map(mapState),
      })),
      unassignedStates: states.filter((s) => !s.regionId).map(mapState),
    };
  }

  async createRegion(dto: CreateRegionDto): Promise<Region> {
    const existing = await this.prisma.region.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException("Region name already exists");
    }
    return this.prisma.region.create({ data: { name: dto.name } });
  }

  async updateRegion(id: string, dto: UpdateRegionDto): Promise<Region> {
    await this.ensureRegion(id);
    const data: Prisma.RegionUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.regionalPastorId !== undefined) {
      data.regionalPastor = dto.regionalPastorId
        ? { connect: { id: await this.ensureActiveUser(dto.regionalPastorId) } }
        : { disconnect: true };
    }
    return this.prisma.region.update({ where: { id }, data });
  }

  async createState(dto: CreateStateDto): Promise<State> {
    const existing = await this.prisma.state.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException("State name already exists");
    }
    if (dto.regionId) {
      await this.ensureRegion(dto.regionId);
    }

    return this.prisma.state.create({
      data: { name: dto.name, regionId: dto.regionId ?? null },
    });
  }

  async createZone(dto: CreateZoneDto): Promise<Zone> {
    await this.ensureState(dto.stateId);

    const existing = await this.prisma.zone.findUnique({
      where: { stateId_name: { stateId: dto.stateId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException("Zone name already exists in this state");
    }

    return this.prisma.zone.create({
      data: { name: dto.name, stateId: dto.stateId },
    });
  }

  async createDistrict(dto: CreateDistrictDto): Promise<District> {
    await this.ensureZone(dto.zoneId);

    const existing = await this.prisma.district.findUnique({
      where: { zoneId_name: { zoneId: dto.zoneId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException("District name already exists in this zone");
    }

    return this.prisma.district.create({
      data: { name: dto.name, zoneId: dto.zoneId },
    });
  }

  async createBranch(dto: CreateBranchDto): Promise<Branch> {
    await this.ensureState(dto.stateId);
    const districtId = dto.districtId?.trim() || null;
    let zoneId = dto.zoneId?.trim() || null;

    if (districtId) {
      const district = await this.prisma.district.findUnique({
        where: { id: districtId },
        include: { zone: true },
      });
      if (!district) {
        throw new NotFoundException("District not found");
      }
      if (district.zone.stateId !== dto.stateId) {
        throw new BadRequestException("District is not in the selected state");
      }
      if (zoneId && zoneId !== district.zoneId) {
        throw new BadRequestException("Zone does not match selected district");
      }
      zoneId = district.zoneId;
    } else if (zoneId) {
      const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
      if (!zone) {
        throw new NotFoundException("Zone not found");
      }
      if (zone.stateId !== dto.stateId) {
        throw new BadRequestException("Zone is not in the selected state");
      }
    }

    const existing = await this.prisma.branch.findUnique({
      where: { stateId_name: { stateId: dto.stateId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException("Branch name already exists in this state");
    }

    return this.prisma.branch.create({
      data: {
        name: dto.name,
        stateId: dto.stateId,
        zoneId,
        districtId,
        address: dto.address,
      },
    });
  }

  async updateState(id: string, dto: UpdateStateDto): Promise<State> {
    await this.ensureState(id);
    const data: Prisma.StateUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.regionId !== undefined) {
      if (dto.regionId) {
        await this.ensureRegion(dto.regionId);
        data.region = { connect: { id: dto.regionId } };
      } else {
        data.region = { disconnect: true };
      }
    }
    if (dto.statePastorId !== undefined) {
      data.statePastor = dto.statePastorId
        ? { connect: { id: await this.ensureActiveUser(dto.statePastorId) } }
        : { disconnect: true };
    }
    return this.prisma.state.update({ where: { id }, data });
  }

  async updateZone(id: string, dto: UpdateZoneDto): Promise<Zone> {
    await this.ensureZone(id);
    const data: Prisma.ZoneUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.zonalPastorId !== undefined) {
      data.zonalPastor = dto.zonalPastorId
        ? { connect: { id: await this.ensureActiveUser(dto.zonalPastorId) } }
        : { disconnect: true };
    }
    return this.prisma.zone.update({ where: { id }, data });
  }

  async updateDistrict(id: string, dto: UpdateDistrictDto): Promise<District> {
    await this.ensureDistrict(id);
    const data: Prisma.DistrictUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.districtPastorId !== undefined) {
      data.districtPastor = dto.districtPastorId
        ? { connect: { id: await this.ensureActiveUser(dto.districtPastorId) } }
        : { disconnect: true };
    }
    return this.prisma.district.update({ where: { id }, data });
  }

  async updateBranch(id: string, dto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.ensureBranch(id);
    const data: Prisma.BranchUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.branchPastorId !== undefined) {
      data.branchPastor = dto.branchPastorId
        ? { connect: { id: await this.ensureActiveUser(dto.branchPastorId) } }
        : { disconnect: true };
    }
    if (dto.districtId !== undefined) {
      if (dto.districtId) {
        const district = await this.prisma.district.findUnique({
          where: { id: dto.districtId },
          include: { zone: true },
        });
        if (!district) throw new NotFoundException("District not found");
        if (district.zone.stateId !== branch.stateId) {
          throw new BadRequestException("District is not in the branch's state");
        }
        data.district = { connect: { id: district.id } };
        data.zone = { connect: { id: district.zoneId } };
      } else {
        data.district = { disconnect: true };
      }
    }
    return this.prisma.branch.update({ where: { id }, data });
  }

  async proposeChange(
    requestedById: string,
    dto: CreateOrgChangeRequestDto,
  ): Promise<OrgChangeRequestView> {
    this.validateChangePayload(dto.type, dto.payload);

    if (dto.type === OrgChangeType.CREATE_STATE) {
      const name = dto.payload.name as string;
      const existing = await this.prisma.state.findUnique({ where: { name } });
      if (existing) {
        throw new ConflictException("State name already exists");
      }
    }

    if (dto.type === OrgChangeType.CREATE_ZONE) {
      const stateId = dto.payload.stateId as string;
      const name = dto.payload.name as string;
      await this.ensureState(stateId);
      const existing = await this.prisma.zone.findUnique({
        where: { stateId_name: { stateId, name } },
      });
      if (existing) {
        throw new ConflictException("Zone name already exists in this state");
      }
    }

    const created = await this.prisma.orgChangeRequest.create({
      data: {
        type: dto.type,
        payload: dto.payload as Prisma.InputJsonValue,
        requestedById,
      },
      include: { requestedBy: { select: { id: true, name: true, email: true } } },
    });
    return toChangeRequestView(created);
  }

  async listChangeRequests(): Promise<OrgChangeRequestView[]> {
    const requests = await this.prisma.orgChangeRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return requests.map(toChangeRequestView);
  }

  async approveChange(
    id: string,
    reviewedById: string,
    reviewNote?: string,
  ): Promise<OrgChangeRequestView> {
    const request = await this.findPendingRequest(id);

    await this.prisma.$transaction(async (tx) => {
      if (request.type === OrgChangeType.CREATE_STATE) {
        const name = (request.payload as { name: string }).name;
        await tx.state.create({ data: { name } });
      } else if (request.type === OrgChangeType.CREATE_ZONE) {
        const { name, stateId } = request.payload as { name: string; stateId: string };
        await tx.zone.create({ data: { name, stateId } });
      }

      await tx.orgChangeRequest.update({
        where: { id },
        data: {
          status: OrgChangeStatus.APPROVED,
          reviewedById,
          reviewNote,
        },
      });
    });

    return this.getChangeRequest(id);
  }

  async rejectChange(
    id: string,
    reviewedById: string,
    reviewNote?: string,
  ): Promise<OrgChangeRequestView> {
    await this.findPendingRequest(id);

    const updated = await this.prisma.orgChangeRequest.update({
      where: { id },
      data: {
        status: OrgChangeStatus.REJECTED,
        reviewedById,
        reviewNote,
      },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return toChangeRequestView(updated);
  }

  private validateChangePayload(type: OrgChangeType, payload: Record<string, unknown>) {
    if (type === OrgChangeType.CREATE_STATE) {
      if (typeof payload.name !== "string" || payload.name.trim().length < 2) {
        throw new BadRequestException("State name is required");
      }
      return;
    }

    if (type === OrgChangeType.CREATE_ZONE) {
      if (typeof payload.name !== "string" || payload.name.trim().length < 2) {
        throw new BadRequestException("Zone name is required");
      }
      if (typeof payload.stateId !== "string" || !payload.stateId) {
        throw new BadRequestException("stateId is required for new zone");
      }
      return;
    }

    throw new BadRequestException("Unsupported change type");
  }

  private async findPendingRequest(id: string) {
    const request = await this.prisma.orgChangeRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException("Change request not found");
    }
    if (request.status !== OrgChangeStatus.PENDING_LP_APPROVAL) {
      throw new BadRequestException("Change request is not pending approval");
    }
    return request;
  }

  private async getChangeRequest(id: string): Promise<OrgChangeRequestView> {
    const request = await this.prisma.orgChangeRequest.findUnique({
      where: { id },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!request) {
      throw new NotFoundException("Change request not found");
    }
    return toChangeRequestView(request);
  }

  private async ensureRegion(id: string) {
    const region = await this.prisma.region.findUnique({ where: { id } });
    if (!region) throw new NotFoundException("Region not found");
    return region;
  }

  private async ensureState(id: string) {
    const state = await this.prisma.state.findUnique({ where: { id } });
    if (!state) throw new NotFoundException("State not found");
    return state;
  }

  private async ensureZone(id: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException("Zone not found");
    return zone;
  }

  private async ensureDistrict(id: string) {
    const district = await this.prisma.district.findUnique({ where: { id } });
    if (!district) throw new NotFoundException("District not found");
    return district;
  }

  private async ensureBranch(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException("Branch not found");
    return branch;
  }

  private async ensureActiveUser(id: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!user) throw new NotFoundException("User not found");
    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException("User is not active");
    }
    return user.id;
  }
}
