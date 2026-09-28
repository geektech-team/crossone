import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequirement } from "./requirement";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
  roots.length = 0;
});

async function newRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "crossone-requirement-"));
  roots.push(root);
  return root;
}

test("creates exactly the five seeded files and a draft status", async () => {
  const root = await newRoot();
  const result = await createRequirement("Order Management", root);
  expect(result.ok).toBe(true);
  if (!result.ok) return;

  expect(result.slug).toBe("order-management");
  expect(result.directory).toBe(join(root, "docs/requirements/order-management"));
  expect((await readdir(result.directory)).sort()).toEqual([
    "acceptance.md", "brief.md", "context.md", "plan.md", "status.json",
  ]);
  const status = JSON.parse(await readFile(join(result.directory, "status.json"), "utf8"));
  expect(status).toMatchObject({
    formatVersion: 1,
    slug: "order-management",
    status: "draft",
    validationSummary: null,
  });
  expect(status.createdAt).toMatch(/^\d{4}-\d\d-\d\dT.*Z$/);
  expect(status.updatedAt).toBe(status.createdAt);
  expect(await readFile(join(result.directory, "brief.md"), "utf8")).toContain("## Scope boundaries");
  expect(await readFile(join(result.directory, "context.md"), "utf8")).toContain("## Open questions");
  expect(await readFile(join(result.directory, "acceptance.md"), "utf8")).toContain("## Acceptance criteria");
  expect(await readFile(join(result.directory, "plan.md"), "utf8")).toContain("## Verification");
});

test("does not overwrite an existing requirement directory", async () => {
  const root = await newRoot();
  const directory = join(root, "docs/requirements/order-management");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "keep.txt"), "original bytes");

  const result = await createRequirement("Order Management", root);
  expect(result.ok).toBe(false);
  expect(await readFile(join(directory, "keep.txt"), "utf8")).toBe("original bytes");
  expect(await readdir(directory)).toEqual(["keep.txt"]);
});

test("rejects unsafe names without creating requirement files", async () => {
  const root = await newRoot();
  for (const name of ["../outside", "---"]) {
    expect((await createRequirement(name, root)).ok).toBe(false);
  }
  expect(await Bun.file(join(root, "docs/requirements/order-management/status.json")).exists()).toBe(false);
  expect(await Bun.file(join(root, "outside/status.json")).exists()).toBe(false);
});

test("rejects a requirements-root symlink escaping the project", async () => {
  const root = await newRoot();
  const external = await mkdtemp(join(tmpdir(), "crossone-external-"));
  roots.push(external);
  await mkdir(join(root, "docs"), { recursive: true });
  await symlink(external, join(root, "docs/requirements"));

  const result = await createRequirement("Order Management", root);
  expect(result.ok).toBe(false);
  expect(await readdir(external)).toEqual([]);
});

test("CLI creates a requirement and rejects usage or invalid names", async () => {
  const root = await newRoot();
  const cli = join(process.cwd(), "packages/cli/src/index.ts");
  const success = Bun.spawn([process.execPath, cli, "requirement", "create", "Order Management"], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(await success.exited).toBe(0);
  expect(await new Response(success.stdout).text()).toContain("Created requirement order-management at");

  const missing = Bun.spawn([process.execPath, cli, "requirement", "create"], { cwd: root, stderr: "pipe" });
  expect(await missing.exited).not.toBe(0);
  expect(await new Response(missing.stderr).text()).toContain("Usage: crossone requirement create <name>");

  const invalid = Bun.spawn([process.execPath, cli, "requirement", "create", "---"], { cwd: root, stderr: "pipe" });
  expect(await invalid.exited).not.toBe(0);
  expect(await new Response(invalid.stderr).text()).toContain("Invalid requirement name");
});
