import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrgChangeStatus, OrgChangeType, Prisma } from "@repo/database";
import type { Branch, State, Zone } from "@repo/database";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateBranchDto,
  CreateOrgChangeRequestDto,
  UpdateBranchDto,
  UpdateStateDto,
  UpdateZoneDto,
} from "./dto/org.dto";
import { OrgChangeRequestView, OrgTreeState, toChangeRequestView } from "./org.types";

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  async getTree(): Promise<OrgTreeState[]> {
    return this.prisma.state.findMany({
      orderBy: { name: "asc" },
      include: {
        zones: {
          orderBy: { name: "asc" },
          include: {
            branches: { orderBy: { name: "asc" } },
          },
        },
      },
    });
  }

  async createBranch(dto: CreateBranchDto): Promise<Branch> {
    const zone = await this.prisma.zone.findUnique({ where: { id: dto.zoneId } });
    if (!zone) {
      throw new NotFoundException("Zone not found");
    }

    const existing = await this.prisma.branch.findUnique({
      where: { zoneId_name: { zoneId: dto.zoneId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException("Branch name already exists in this zone");
    }

    return this.prisma.branch.create({
      data: { name: dto.name, zoneId: dto.zoneId, address: dto.address },
    });
  }

  async updateState(id: string, dto: UpdateStateDto): Promise<State> {
    await this.ensureState(id);
    return this.prisma.state.update({ where: { id }, data: { name: dto.name } });
  }

  async updateZone(id: string, dto: UpdateZoneDto): Promise<Zone> {
    await this.ensureZone(id);
    return this.prisma.zone.update({ where: { id }, data: { name: dto.name } });
  }

  async updateBranch(id: string, dto: UpdateBranchDto): Promise<Branch> {
    await this.ensureBranch(id);
    return this.prisma.branch.update({
      where: { id },
      data: { name: dto.name, address: dto.address },
    });
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

  private async ensureBranch(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException("Branch not found");
    return branch;
  }
}
