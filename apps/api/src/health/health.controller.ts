import { Controller, Get } from "@nestjs/common";
import type { HealthResponse } from "@repo/types";

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: "ok",
      service: "jnlop-api",
      timestamp: new Date().toISOString(),
    };
  }
}
