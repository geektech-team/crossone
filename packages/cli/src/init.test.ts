import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
  expect(await Bun.file(join(target, "services/api/package.json")).exists()).toBe(true);
  expect(await Bun.file(join(target, "apps/admin-web/package.json")).exists()).toBe(true);
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
