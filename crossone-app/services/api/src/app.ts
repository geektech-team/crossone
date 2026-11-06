import { BackOneServer, type AppOptions } from "@geektech/backone";
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
