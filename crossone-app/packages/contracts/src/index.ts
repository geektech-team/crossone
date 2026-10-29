export type ApiError = Readonly<{ code: string; message: string }>;
export type HealthResponse = Readonly<{ status: "ok"; service: "api" }>;
