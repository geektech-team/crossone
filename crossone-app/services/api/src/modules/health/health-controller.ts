import { Controller, Get } from "@geektech/backone/decorators";
import type { HealthResponse } from "@crossone-app/contracts";
import { getHealth } from "@crossone-app/modules";

@Controller("/api")
export class HealthController {
  @Get("/health")
  health(): HealthResponse {
    return getHealth();
  }
}
