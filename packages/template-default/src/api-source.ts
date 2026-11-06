// Project-owned composition follows BackOne CLI's object-first minimal scaffold.
export const apiSources = {
  "app.ts": `import { BackOneServer, type AppOptions } from "@geektech/backone";
import { registerModules } from "@geektech/backone/decorators";
import { devPorts } from "@crossone-app/config";
import { HealthModule } from "./modules/health/health-module";

export type ApplicationOptions = AppOptions;

export class Application {
  readonly server: BackOneServer;
  private initializing?: Promise<this>;
  private starting?: Promise<number>;
  private stopping?: Promise<void>;
  private disposing?: Promise<void>;
  private stopped = false;

  constructor(options: ApplicationOptions = {}) {
    this.server = new BackOneServer({
      port: devPorts.api,
      hostname: "127.0.0.1",
      development: process.env.NODE_ENV !== "production",
      ...options,
    });
    registerModules(this.server, [new HealthModule()]);
  }

  initialize(): Promise<this> {
    if (this.stopped) return Promise.reject(new Error("Application is closed"));
    return this.initializing ??= this.initializeResources()
      .then(() => {
        if (this.stopped) throw new Error("Application is closed");
        return this;
      })
      .catch(async (error: unknown) => {
        this.stopped = true;
        await this.dispose();
        throw error;
      });
  }

  start(): Promise<number> {
    if (this.stopped) return Promise.reject(new Error("Application is closed"));
    return this.starting ??= (async () => {
      try {
        await this.initialize();
        if (this.stopped) throw new Error("Application is closed");
        return await this.server.listen();
      } catch (error) {
        this.stopped = true;
        await this.dispose();
        throw error;
      }
    })();
  }

  stop(): Promise<void> {
    this.stopped = true;
    return this.stopping ??= (async () => {
      await this.initializing?.catch(() => undefined);
      await this.starting?.catch(() => undefined);
      await this.dispose();
    })();
  }

  private async initializeResources(): Promise<void> {
    // Initialize application-owned resources here; importing app.ts never listens.
  }

  private dispose(): Promise<void> {
    return this.disposing ??= this.server.close({ timeout: 1000 });
  }
}
`,
  "index.ts": `import { devPorts } from "@crossone-app/config";
import { Application } from "./app";

const hostname = process.env.HOST ?? "127.0.0.1";
const app = new Application({
  port: Number(process.env.PORT ?? devPorts.api),
  hostname,
});
const shutdown = () => {
  void app.stop().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

try {
  const port = await app.start();
  console.log("CrossOne API listening on http://" + hostname + ":" + port);
} catch (error) {
  await app.stop();
  throw error;
}
`,
  "modules/health/health-controller.ts": `import { Controller, Get } from "@geektech/backone/decorators";
import type { HealthResponse } from "@crossone-app/contracts";
import { getHealth } from "@crossone-app/modules";

@Controller("/api")
export class HealthController {
  @Get("/health")
  health(): HealthResponse {
    return getHealth();
  }
}
`,
  "modules/health/health-module.ts": `import { Module } from "@geektech/backone/decorators";
import { HealthController } from "./health-controller";

@Module<HealthModule>({ controllers: (module) => [module.controller] })
export class HealthModule {
  readonly controller = new HealthController();
}
`,
  "app.test.ts": `import { expect, test } from "bun:test";
import { Application } from "./app";

test("health module returns the shared API contract without listening", async () => {
  const app = new Application({ port: 0 });
  try {
    await app.initialize();
    expect(app.server.port).toBeNull();
    const response = await app.server.handle(new Request("http://localhost/api/health"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ status: "ok", service: "api" });
  } finally {
    await app.stop();
  }
});

test("Application coordinates initialization and repeatable shutdown", async () => {
  const app = new Application({ port: 0 });
  const initializing = app.initialize();
  expect(app.initialize()).toBe(initializing);
  await initializing;
  const stopping = app.stop();
  expect(app.stop()).toBe(stopping);
  await stopping;
  await expect(app.initialize()).rejects.toThrow("Application is closed");
  await expect(app.start()).rejects.toThrow("Application is closed");
});

test("each Application owns an independent server and module graph", async () => {
  const first = new Application({ port: 0 });
  const second = new Application({ port: 0 });
  try {
    expect(first.server).not.toBe(second.server);
    await Promise.all([first.initialize(), second.initialize()]);
    await first.stop();
    const response = await second.server.handle(new Request("http://localhost/api/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", service: "api" });
  } finally {
    await Promise.all([first.stop(), second.stop()]);
  }
});
`,
} as const;
