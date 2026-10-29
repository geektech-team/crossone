import type { HealthResponse } from "@crossone-app/contracts";

export const modules = [] as const;
export function getHealth(): HealthResponse {
  return { status: "ok", service: "api" };
}
