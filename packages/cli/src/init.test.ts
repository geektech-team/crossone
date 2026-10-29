import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "./init";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
  roots.length = 0;
});

test("creates an app in a new destination", async () => {
  const root = await mkdtemp(join(tmpdir(), "crossone-"));
  roots.push(root);
  const target = join(root, "crossone-app");

  expect(await runInit("crossone-app", root)).toEqual({ ok: true, target });
  expect(await Bun.file(join(target, "docs/README.md")).exists()).toBe(true);
  expect(await Bun.file(join(target, "README.md")).exists()).toBe(true);
  expect(await Bun.file(join(target, "services/api/package.json")).exists()).toBe(true);
  expect(await Bun.file(join(target, "apps/client-web-phone/package.json")).exists()).toBe(true);
});

test("init writes only the chosen clients and rejects invalid client identifiers without writes", async () => {
  const root = await mkdtemp(join(tmpdir(), "crossone-"));
  roots.push(root);
  const target = join(root, "selected");
  const result = await runInit("selected", root, { clients: ["client-mini-alipay", "client-app-android"] });
  expect(result.ok).toBe(true);
  expect((await readdir(join(target, "apps"))).sort()).toEqual(["client-app-android", "client-mini-alipay"]);
  expect(await Bun.file(join(target, "services/api/src/app.ts")).exists()).toBe(true);
  const invalid = await runInit("invalid", root, { clients: ["../outside" as never] });
  expect(invalid.ok).toBe(false);
  expect((await readdir(root)).sort()).toEqual(["selected"]);
});

test("CLI supports explicit client lists, default acceptance, and API-only initialization", async () => {
  const root = await mkdtemp(join(tmpdir(), "crossone-"));
  roots.push(root);
  const cli = join(process.cwd(), "packages/cli/src/index.ts");
  for (const [directory, args, expected] of [
    ["selected", ["--clients", "client-web-phone,client-mini-weixin"], ["client-mini-weixin", "client-web-phone"]],
    ["defaults", ["--yes"], ["client-web-pc", "client-web-phone"]],
    ["api", ["--clients=none"], []],
  ] as const) {
    const child = Bun.spawn([process.execPath, cli, "init", directory, ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
    expect(await child.exited).toBe(0);
    expect(await new Response(child.stdout).text()).toContain("Created CrossOne app");
    const folders = await readdir(join(root, directory, "apps")).catch(() => []);
    expect(folders.sort()).toEqual([...expected]);
  }
});

test("non-interactive CLI requires explicit selection and invalid choices leave no project", async () => {
  const root = await mkdtemp(join(tmpdir(), "crossone-"));
  roots.push(root);
  const cli = join(process.cwd(), "packages/cli/src/index.ts");
  for (const args of [[], ["--clients", "admin"]]) {
    const child = Bun.spawn([process.execPath, cli, "init", "invalid", ...args], { cwd: root, stdin: "ignore", stderr: "pipe" });
    expect(await child.exited).not.toBe(0);
  }
  expect(await readdir(root)).toEqual([]);
});

test("does not overwrite a non-empty destination", async () => {
  const root = await mkdtemp(join(tmpdir(), "crossone-"));
  roots.push(root);
  const target = join(root, "crossone-app");
  await mkdir(target);
  await writeFile(join(target, ".keep"), "existing");

  const result = await runInit("crossone-app", root);
  expect(result.ok).toBe(false);
  expect(await readFile(join(target, ".keep"), "utf8")).toBe("existing");
});

test("accepts an empty existing destination", async () => {
  const root = await mkdtemp(join(tmpdir(), "crossone-"));
  roots.push(root);
  await mkdir(join(root, "crossone-app"));

  expect((await runInit("crossone-app", root)).ok).toBe(true);
});

test("CLI reports usage for a missing directory", async () => {
  const child = Bun.spawn([process.execPath, "packages/cli/src/index.ts", "init"], {
    cwd: process.cwd(),
    stderr: "pipe",
  });
  expect(await child.exited).not.toBe(0);
  expect(await new Response(child.stderr).text()).toContain("Usage: crossone init <directory>");
});
