import { createServer } from "@geektech/backone";
import { getHealth } from "@crossone-app/modules";

export function createApi() {
  const app = createServer({ development: process.env.NODE_ENV !== "production" });
  app.get("/api/health", (ctx) => ctx.json(getHealth()));
  return app;
}
