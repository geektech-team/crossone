import type { TemplateFile } from "./template";
import { selectedClients, clientPortVariable, type ClientDefinition, type TemplateOptions } from "./clients";
import { platformSource } from "./platform-source";
import { Platform } from "transone/platform";

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const typescript = "5.9.3";
const transone = "^0.9.0";
const backone = "^0.1.2";
const transoneCli = "0.10.0";
const commonScripts = {
  typecheck: "tsc --noEmit --project tsconfig.json",
  test: "bun test --pass-with-no-tests",
};

function library(name: string, dependencies: Record<string, string> = {}): TemplateFile[] {
  return [
    {
      path: `packages/${name}/package.json`,
      content: json({
        name: `@crossone-app/${name}`,
        version: "0.0.0",
        private: true,
        type: "module",
        exports: "./src/index.ts",
        source: "./src/index.ts",
        dependencies,
        devDependencies: { typescript },
        scripts: {
          ...commonScripts,
          build: "bun build ./src/index.ts --target browser --outdir dist",
        },
      }),
    },
    {
      path: `packages/${name}/tsconfig.json`,
      content: json({ extends: "../../tsconfig.json", include: ["src/**/*.ts"] }),
    },
  ];
}

function clientApp(client: ClientDefinition): TemplateFile[] {
  const directory = `apps/${client.id}`;
  const title = client.title;
  const platformKey = Object.entries(Platform).find(([, value]) => value === client.platform)![0];
  const previewTarget = client.target === "web" ? client.platform : Platform.Web;
  const apiHost = 'process.env.API_URL ?? "http://127.0.0.1:" + devPorts.api';
  const platformConfig = client.target.startsWith("mp-")
    ? `  mp: { host: ${apiHost}, navigationBarTitleText: "${title}", outDir: "dist/${client.target}" },\n`
    : client.target.startsWith("app-")
      ? `  app: { host: ${apiHost}, appName: "${title}", bundleId: "com.crossone.${client.id.replace(/-/g, ".")}", outDir: "dist/${client.target}", pages: { "/": "src/index.ts" } },\n`
      : "";
  return [
    {
      path: `${directory}/package.json`,
      content: json({
        name: `@crossone-app/${client.id}`,
        version: "0.0.0",
        private: true,
        type: "module",
        dependencies: {
          transone,
          "@crossone-app/config": "workspace:*",
          "@crossone-app/contracts": "workspace:*",
          ...(client.target === "web" ? { "@crossone-app/ui": "workspace:*" } : {}),
        },
        devDependencies: { "transone-cli": transoneCli, typescript },
        scripts: {
          ...commonScripts,
          dev: `transone dev --target ${previewTarget}`,
          build: `transone build --target ${client.platform} --out-dir dist/${client.target}`,
          "build:web": `transone build --target ${previewTarget} --out-dir dist/web`,
        },
      }),
    },
    {
      path: `${directory}/tsconfig.json`,
      content: json({
        extends: "../../tsconfig.json",
        include: ["src/**/*.ts", "transone.config.ts"],
      }),
    },
    {
      path: `${directory}/transone.config.ts`,
      content: `import { Platform } from "transone/platform";
import { defineConfig } from "transone-cli";
import { devPorts } from "@crossone-app/config";

export default defineConfig({
  entry: "src/index.ts",
  target: Platform.${platformKey},
  server: {
    host: "127.0.0.1",
    port: Number(process.env.${clientPortVariable(client)} ?? devPorts["${client.id}"]),
    proxy: {
      "/api": {
        target: process.env.API_URL ?? "http://127.0.0.1:" + devPorts.api,
        changeOrigin: true,
      },
    },
  },
  build: { outDir: "dist/web" },
${platformConfig}});
`,
    },
    {
      path: `${directory}/src/index.ts`,
      content: client.target === "web" ? `import { Component, createApp, h, type VNode } from "transone";
import { createHeading } from "@crossone-app/ui";
import type { HealthResponse } from "@crossone-app/contracts";

interface AppState {
  count: number;
  apiStatus: string;
}

class App extends Component<Record<string, never>, AppState> {
  protected initState(): AppState {
    return { count: 0, apiStatus: "Not checked" };
  }

  protected initStyles(): void {
    this.styleManager.addStyle("app-body", {
      selector: "body",
      properties: {
        margin: 0,
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "system-ui, sans-serif",
      },
    });
    this.styleManager.addStyle("app-shell", {
      selector: ".app-shell",
      properties: {
        maxWidth: "${client.id === "client-web-phone" ? "480px" : "960px"}",
        margin: "80px auto",
        padding: "24px",
      },
    });
    this.styleManager.addStyle("app-button", {
      selector: "button",
      properties: {
        padding: "10px 16px",
        marginRight: "12px",
        cursor: "pointer",
      },
    });
  }

  protected render(): VNode {
    return h("main", { className: "app-shell" }, [
      createHeading("${title}"),
      h("p", {}, ["Your TransOne application is ready."]),
      h("button", {}, ["Count: {{count}}"], { click: () => this.increment() }),
      h("button", {}, ["Check API"], { click: () => this.checkApi() }),
      h("p", {}, ["API: {{apiStatus}}"]),
    ]);
  }

  protected increment(): void {
    this.state.count += 1;
  }

  protected async checkApi(): Promise<void> {
    this.state.apiStatus = "Checking...";
    try {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const health = await response.json() as HealthResponse;
      this.state.apiStatus = health.status === "ok" ? "Connected" : "Unexpected response";
    } catch {
      this.state.apiStatus = "API unavailable";
    }
  }
}

export const app = createApp({
  root: App,
  document: { lang: "en", title: "${title}" },
});
app.mount();
` : platformSource(client),
    },
  ];
}

export function getRuntimeTemplate(options: TemplateOptions = {}): TemplateFile[] {
  const clients = selectedClients(options);
  const clientScripts = Object.fromEntries(clients.flatMap((client) => [
    [`dev:${client.id}`, `bun run --cwd apps/${client.id} dev`],
    [`build:${client.id}`, `bun run --cwd apps/${client.id} build`],
  ]));
  const devFilters = [...clients.map((client) => `--filter @crossone-app/${client.id}`), "--filter @crossone-app/api"].join(" ");
  const buildCommands = ["bun run build:packages", ...clients.map((client) => `bun run build:${client.id}`), "bun run build:api"];
  return [
    {
      path: "package.json",
      content: json({
        name: "crossone-app",
        private: true,
        type: "module",
        packageManager: "bun@1.3.0",
        engines: { bun: ">=1.3.0" },
        workspaces: ["apps/*", "services/*", "packages/*", "tooling/*"],
        dependencies: { transone, "@geektech/backone": backone },
        devDependencies: { "transone-cli": transoneCli, typescript, "bun-types": "^1.3.0" },
        scripts: {
          dev: `bun run ${devFilters} dev`,
          ...clientScripts,
          "dev:api": "bun run --cwd services/api dev",
          "debug:api": "bun run --cwd services/api debug",
          build: buildCommands.join(" && "),
          "build:packages": "bun run --filter @crossone-app/config --filter @crossone-app/contracts --filter @crossone-app/modules --filter @crossone-app/ui build",
          "build:api": "bun run --cwd services/api build",
          "start:api": "bun run --cwd services/api start",
          typecheck: "tsc --noEmit --project tsconfig.json",
          test: "bun test",
        },
      }),
    },
    { path: "bunfig.toml", content: "[install]\nexact = true\n" },
    { path: ".gitignore", content: "node_modules/\ndist/\n.env\n.env.*\n!.env.example\n" },
    {
      path: "tsconfig.json",
      content: json({
        compilerOptions: {
          strict: true,
          target: "ESNext",
          module: "Preserve",
          moduleResolution: "bundler",
          noEmit: true,
          skipLibCheck: true,
          types: ["bun-types"],
          lib: ["ESNext", "DOM", "DOM.Iterable"],
          verbatimModuleSyntax: true,
        },
        include: ["apps/**/*.ts", "services/**/*.ts", "packages/**/*.ts"],
        exclude: ["node_modules", "**/dist"],
      }),
    },
    ...clients.flatMap(clientApp),
    {
      path: "services/api/package.json",
      content: json({
        name: "@crossone-app/api",
        version: "0.0.0",
        private: true,
        type: "module",
        dependencies: {
          "@geektech/backone": backone,
          "@crossone-app/config": "workspace:*",
          "@crossone-app/contracts": "workspace:*",
          "@crossone-app/modules": "workspace:*",
        },
        devDependencies: { typescript, "bun-types": "^1.3.0" },
        scripts: {
          ...commonScripts,
          dev: "bun --watch src/index.ts",
          debug: "bun --inspect --watch src/index.ts",
          build: "bun build ./src/index.ts --target bun --outdir dist",
          start: "NODE_ENV=production bun dist/index.js",
        },
      }),
    },
    {
      path: "services/api/tsconfig.json",
      content: json({ extends: "../../tsconfig.json", include: ["src/**/*.ts"] }),
    },
    {
      path: "services/api/src/app.ts",
      content: `import { createServer } from "@geektech/backone";
import { getHealth } from "@crossone-app/modules";

export function createApi() {
  const app = createServer({ development: process.env.NODE_ENV !== "production" });
  app.get("/api/health", (ctx) => ctx.json(getHealth()));
  return app;
}
`,
    },
    {
      path: "services/api/src/index.ts",
      content: `import { devPorts } from "@crossone-app/config";
import { createApi } from "./app";

const app = createApi();
const port = await app.listen({
  port: Number(process.env.PORT ?? devPorts.api),
  hostname: process.env.HOST ?? "127.0.0.1",
});
console.log("CrossOne API listening on http://" + (process.env.HOST ?? "127.0.0.1") + ":" + port);

async function stop(): Promise<void> {
  await app.close({ timeout: 1000 });
  process.exit(0);
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
`,
    },
    {
      path: "services/api/src/app.test.ts",
      content: `import { expect, test } from "bun:test";
import { createApi } from "./app";

test("health endpoint returns the shared API contract", async () => {
  const response = await createApi().handle(new Request("http://localhost/api/health"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok", service: "api" });
});
`,
    },
    ...library("contracts"),
    {
      path: "packages/contracts/src/index.ts",
      content: `export type ApiError = Readonly<{ code: string; message: string }>;
export type HealthResponse = Readonly<{ status: "ok"; service: "api" }>;
`,
    },
    ...library("modules", { "@crossone-app/contracts": "workspace:*" }),
    {
      path: "packages/modules/src/index.ts",
      content: `import type { HealthResponse } from "@crossone-app/contracts";

export const modules = [] as const;
export function getHealth(): HealthResponse {
  return { status: "ok", service: "api" };
}
`,
    },
    ...library("ui", { transone }),
    {
      path: "packages/ui/src/index.ts",
      content: `import { h, type VNode } from "transone";

export function createHeading(title: string): VNode {
  return h("h1", {}, [title]);
}
`,
    },
    ...library("config"),
    {
      path: "packages/config/src/index.ts",
      content: `export const projectScope = "@crossone-app";
export const devPorts = ${JSON.stringify({ api: 3000, ...Object.fromEntries(clients.map((client) => [client.id, client.port])) })} as const;
`,
    },
  ];
}
