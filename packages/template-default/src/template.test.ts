import { expect, test } from "bun:test";
import { getDefaultTemplate, validateTemplatePath } from "./template";
import { selectedClients } from "./clients";

test("client choices generate only selected applications while preserving the API", () => {
  const selected = getDefaultTemplate({ clients: ["client-mini-weixin", "client-app-ios"] });
  const paths = selected.map((file) => file.path);
  expect(paths).toContain("apps/client-mini-weixin/package.json");
  expect(paths).toContain("apps/client-app-ios/package.json");
  expect(paths.some((path) => path.startsWith("apps/admin"))).toBe(false);
  expect(paths.some((path) => path.startsWith("apps/client-web"))).toBe(false);
  const api = (files: ReturnType<typeof getDefaultTemplate>) => files.filter((file) => file.path.startsWith("services/api/"));
  expect(api(selected)).toEqual(api(getDefaultTemplate()));
  const root = JSON.parse(selected.find((file) => file.path === "package.json")!.content);
  expect(root.scripts["build:client-mini-weixin"]).toBeDefined();
  expect(root.scripts["build:client-app-ios"]).toBeDefined();
  expect(root.scripts["dev:client-web-phone"]).toBeUndefined();
  const onlyApi = getDefaultTemplate({ clients: [] });
  expect(onlyApi.some((file) => file.path.startsWith("apps/"))).toBe(false);
});

function contentFor(path: string): string {
  const file = getDefaultTemplate().find((candidate) => candidate.path === path);
  if (!file) throw new Error(`Missing template file: ${path}`);
  return file.content;
}

test("default template contains every required application area", () => {
  const paths = new Set(getDefaultTemplate().map((file) => file.path));

  for (const path of [
    "apps/client-web-phone/package.json",
    "apps/client-web-pc/package.json",
    "services/api/package.json",
    "packages/contracts/package.json",
    "packages/modules/package.json",
    "packages/ui/package.json",
    "packages/config/package.json",
    "tooling/README.md",
    "docs/README.md",
    "AGENTS.md",
  ]) {
    expect(paths.has(path)).toBe(true);
  }
});

test("initializes the app with a root README prompt guide", () => {
  const readme = getDefaultTemplate().find((file) => file.path === "README.md");
  expect(readme).toBeDefined();
  expect(readme?.content.length).toBeGreaterThan(0);
});

test("template paths cannot escape a destination", () => {
  expect(() => validateTemplatePath("../../outside")).toThrow();
});

test("generated workspace and packages declare their boundaries", () => {
  const root = JSON.parse(contentFor("package.json")) as {
    workspaces: string[];
    scripts: Record<string, string>;
  };
  expect(root.workspaces).toEqual([
    "apps/*",
    "services/*",
    "packages/*",
    "tooling/*",
  ]);
  expect(root.scripts.dev).toBe(
    "bun run --filter @crossone-app/client-web-phone --filter @crossone-app/client-web-pc --filter @crossone-app/api dev",
  );

  const phone = JSON.parse(contentFor("apps/client-web-phone/package.json")) as {
    dependencies: Record<string, string>;
  };
  const api = JSON.parse(contentFor("services/api/package.json")) as {
    dependencies: Record<string, string>;
  };
  expect(phone.dependencies.transone).toBe("^0.9.0");
  expect(api.dependencies["@geektech/backone"]).toBe("^0.1.2");

  for (const file of getDefaultTemplate().filter((file) =>
    /^packages\/[^/]+\/package\.json$/.test(file.path),
  )) {
    expect(() => JSON.parse(file.content)).not.toThrow();
  }

  const docs = contentFor("docs/README.md");
  expect(docs).toContain("Web");
  expect(docs).toContain("selected clients");
});

test("generated project exposes independent development and production build commands", () => {
  const root = JSON.parse(contentFor("package.json"));
  for (const command of ["dev:client-web-phone", "dev:client-web-pc", "dev:api", "debug:api", "build", "build:client-web-phone", "build:client-web-pc", "build:api", "build:packages", "start:api"]) {
    expect(typeof root.scripts[command]).toBe("string");
  }
  expect(root.devDependencies.typescript).toBe("5.9.3");
  expect(root.devDependencies["bun-types"]).toBeDefined();

  for (const path of ["apps/client-web-phone/package.json", "apps/client-web-pc/package.json", "services/api/package.json"]) {
    const manifest = JSON.parse(contentFor(path));
    expect(manifest.dependencies).toBeDefined();
    expect(manifest.devDependencies.typescript).toBe("5.9.3");
    expect(manifest.scripts.dev).not.toContain("echo");
    expect(manifest.scripts.build).toBeDefined();
  }
});

test("every supported client maps to its requested TransOne target", () => {
  const targets = {
    "client-web-phone": "web-mobile",
    "client-web-pc": "web-pc",
    "client-mini-weixin": "miniprogram-weixin",
    "client-mini-alipay": "miniprogram-alipay",
    "client-mini-bytedance": "miniprogram-bytedance",
    "client-mini-xiaohongshu": "miniprogram-xiaohongshu",
    "client-app-ios": "app-ios",
    "client-app-android": "app-android",
    "client-app-harmony": "app-harmony",
  } as const;
  const files = getDefaultTemplate({ clients: Object.keys(targets) as (keyof typeof targets)[] });
  for (const [id, target] of Object.entries(targets)) {
    const manifest = JSON.parse(files.find((file) => file.path === `apps/${id}/package.json`)!.content);
    expect(manifest.scripts.build).toContain(`--target ${target}`);
    expect(manifest.devDependencies["transone-cli"]).toBe("0.10.0");
    const previewTarget = target.startsWith("web-") ? target : "web";
    expect(manifest.scripts.dev).toBe(`transone dev --target ${previewTarget}`);
    expect(manifest.scripts["build:web"]).toBe(`transone build --target ${previewTarget} --out-dir dist/web`);
  }
  expect(files.filter((file) => /^apps\/[^/]+\/package.json$/.test(file.path))).toHaveLength(9);
});

test("client platforms distinguish Web variants and map canonical mini-program platforms to compatible build targets", () => {
  const ids = [
    "client-web-phone", "client-web-pc", "client-mini-weixin", "client-mini-alipay",
    "client-mini-bytedance", "client-mini-xiaohongshu", "client-app-ios", "client-app-android", "client-app-harmony",
  ] as const;
  const clients = selectedClients({ clients: ids });
  expect(clients.map((client) => ({ platform: String(client.platform), target: client.target }))).toEqual([
    { platform: "web-mobile", target: "web" },
    { platform: "web-pc", target: "web" },
    { platform: "miniprogram-weixin", target: "mp-weixin" },
    { platform: "miniprogram-alipay", target: "mp-alipay" },
    { platform: "miniprogram-bytedance", target: "mp-bytedance" },
    { platform: "miniprogram-xiaohongshu", target: "mp-xiaohongshu" },
    { platform: "app-ios", target: "app-ios" },
    { platform: "app-android", target: "app-android" },
    { platform: "app-harmony", target: "app-harmony" },
  ]);
});

test("shared packages expose source entrypoints and declare workspace dependencies", () => {
  const files = getDefaultTemplate();
  const manifests = files.filter((file) => /^(?:apps|services|packages)\/[^/]+\/package\.json$/.test(file.path));
  const names = new Set(manifests.map((file) => JSON.parse(file.content).name));
  for (const file of manifests) {
    const manifest = JSON.parse(file.content);
    for (const [dependency, version] of Object.entries(manifest.dependencies ?? {})) {
      if (version === "workspace:*") expect(names.has(dependency)).toBe(true);
    }
    if (!file.path.startsWith("packages/")) continue;
    expect(manifest.exports).toBe("./src/index.ts");
    expect(manifest.scripts.build).toBeDefined();
    expect(manifest.devDependencies.typescript).toBe("5.9.3");
    expect(contentFor(file.path.replace("package.json", "src/index.ts"))).toBeTruthy();
  }
});

test("generated app installs the requirement Skill and points contributors to its boundary", () => {
  const skill = contentFor(".agents/skills/crossone-requirement/SKILL.md");
  expect(skill).toContain("name: crossone-requirement");

  const agents = contentFor("AGENTS.md");
  expect(agents).toContain(".agents/skills/crossone-requirement/SKILL.md");
  expect(agents).toContain("not permission to implement");
});

test("generated docs explain the requirement package lifecycle and commands", () => {
  const docs = contentFor("docs/README.md");
  expect(docs).toContain("crossone requirement create <name>");
  expect(docs).toContain("crossone requirement validate <name>");
  expect(docs).toContain("brief.md");
  expect(docs).toContain("status.json");
  expect(docs).toContain("draft");
  expect(docs).toContain("planned");
  expect(docs).toContain("does not call a model");
  expect(docs).toContain("not permission to implement");
});
