import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { HealthResponse } from "@repo/types";
import { Public } from "../common/decorators/public.decorator";
import { PrismaService } from "../prisma/prisma.service";

@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async getHealth(): Promise<HealthResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException("Database unavailable");
    }

    return {
      status: "ok",
      service: "jnlop-api",
      timestamp: new Date().toISOString(),
    };
  }
}
