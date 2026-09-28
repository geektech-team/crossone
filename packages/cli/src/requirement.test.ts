import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "./init";
import { createRequirement, validateRequirement } from "./requirement";

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

async function writeValidPackage(root: string, statusName: "draft" | "planned" = "draft"): Promise<string> {
  const result = await createRequirement("Order Management", root);
  if (!result.ok) throw new Error(result.message);
  const content: Record<string, string> = {
    "brief.md": "## Problem\nOrders are hard to track.\n\n## Desired outcome\nTrack orders.\n\n## Scope boundaries\nOrder workflow only.\n",
    "context.md": "## Project context\nCrossOne application.\n\n## Affected areas\nAPI and admin.\n\n## Assumptions\nPostgres stays in use.\n\n## Open questions\nNone known.\n",
    "acceptance.md": "## Acceptance criteria\n- [ ] Members can search by order number.\n",
    "plan.md": "## Implementation steps\n- Add order search.\n\n## Affected files and packages\n- services/api and apps/admin-web.\n\n## Verification\n- Run focused tests.\n\n## Risks\nNone known.\n",
    "status.json": JSON.stringify({
      formatVersion: 1,
      slug: "order-management",
      status: statusName,
      createdAt: "2026-09-28T00:00:00.000Z",
      updatedAt: "2026-09-28T00:00:00.000Z",
      validationSummary: null,
    }, null, 2) + "\n",
  };
  await Promise.all(Object.entries(content).map(([file, value]) => writeFile(join(result.directory, file), value)));
  return result.directory;
}

async function readPackage(directory: string): Promise<Record<string, string>> {
  const names = (await readdir(directory)).sort();
  return Object.fromEntries(await Promise.all(names.map(async (name) => [name, await readFile(join(directory, name), "utf8")])));
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

test("validates complete draft and planned packages without modifying any files", async () => {
  const root = await newRoot();
  for (const status of ["draft", "planned"] as const) {
    const project = join(root, status);
    await mkdir(project);
    const directory = await writeValidPackage(project, status);
    const before = await readPackage(directory);
    expect(await validateRequirement("Order Management", join(root, status))).toEqual({
      ok: true,
      slug: "order-management",
      status,
    });
    expect(await readPackage(directory)).toEqual(before);
  }
});

test("reports missing documents, malformed status, wrong slug, and invalid summary", async () => {
  const root = await newRoot();
  const directory = await writeValidPackage(root);
  await rm(join(directory, "context.md"));
  let result = await validateRequirement("Order Management", root);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.issues?.some((issue) => issue.file === "context.md" && issue.message === "File is required.")).toBe(true);

  const statusPath = join(directory, "status.json");
  await writeFile(statusPath, "{");
  result = await validateRequirement("Order Management", root);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.issues?.some((issue) => issue.file === "status.json" && issue.message.includes("valid JSON"))).toBe(true);

  await writeFile(statusPath, JSON.stringify({
    formatVersion: 1,
    slug: "wrong-slug",
    status: "draft",
    createdAt: "2026-09-28T00:00:00.000Z",
    updatedAt: "2026-09-28T00:00:00.000Z",
    validationSummary: { checkedAt: "bad", valid: "yes", issueCount: -1 },
  }));
  result = await validateRequirement("Order Management", root);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.issues?.some((issue) => issue.message.includes("slug must match"))).toBe(true);
    expect(result.issues?.some((issue) => issue.message.includes("validationSummary"))).toBe(true);
  }
});

test("reports placeholder acceptance, missing plan verification, and affected-file details", async () => {
  const root = await newRoot();
  const directory = await writeValidPackage(root);
  await writeFile(join(directory, "acceptance.md"), "## Acceptance criteria\n- [ ] TODO\n");
  await writeFile(join(directory, "plan.md"), "## Implementation steps\n- Make a change.\n\n## Affected files and packages\nTBD\n\n## Verification\n\n## Risks\nNone known.\n");
  const result = await validateRequirement("Order Management", root);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.issues?.some((issue) => issue.file === "acceptance.md" && issue.message.includes("checkbox"))).toBe(true);
    expect(result.issues?.some((issue) => issue.file === "plan.md" && issue.message.includes("Verification"))).toBe(true);
    expect(result.issues?.some((issue) => issue.file === "plan.md" && issue.message.includes("Affected files and packages"))).toBe(true);
  }
});

test("rejects a requirement document symlink that escapes the package", async () => {
  const root = await newRoot();
  const external = join(root, "outside.md");
  await writeFile(external, "## Project context\nExternal content.\n");
  const directory = await writeValidPackage(root);
  await rm(join(directory, "context.md"));
  await symlink(external, join(directory, "context.md"));

  const result = await validateRequirement("Order Management", root);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.issues?.some((issue) => issue.file === "context.md" && issue.message.includes("outside"))).toBe(true);
});

test("CLI reports validation status, failures, and usage errors", async () => {
  const root = await newRoot();
  await writeValidPackage(root, "planned");
  const cli = join(process.cwd(), "packages/cli/src/index.ts");
  const success = Bun.spawn([process.execPath, cli, "requirement", "validate", "Order Management"], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(await success.exited).toBe(0);
  expect(await new Response(success.stdout).text()).toContain("Requirement order-management is valid (status: planned)");

  await writeFile(join(root, "docs/requirements/order-management/acceptance.md"), "## Acceptance criteria\n- [ ] TODO\n");
  const invalid = Bun.spawn([process.execPath, cli, "requirement", "validate", "Order Management"], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(await invalid.exited).not.toBe(0);
  expect(await new Response(invalid.stderr).text()).toContain("acceptance.md:");

  const usage = Bun.spawn([process.execPath, cli, "requirement", "validate"], { cwd: root, stderr: "pipe" });
  expect(await usage.exited).not.toBe(0);
  expect(await new Response(usage.stderr).text()).toContain("Usage: crossone requirement validate <name>");
});

test("generated app can create, validate, and preserve a user-approved planned package", async () => {
  const root = await newRoot();
  const initialized = await runInit("crossone-app", root);
  expect(initialized.ok).toBe(true);
  if (!initialized.ok) return;

  const skill = await readFile(join(initialized.target, ".agents/skills/crossone-requirement/SKILL.md"), "utf8");
  expect(skill).toContain("not permission to implement");
  expect(await readFile(join(initialized.target, "docs/README.md"), "utf8")).toContain("crossone requirement validate <name>");

  const cli = join(process.cwd(), "packages/cli/src/index.ts");
  const create = Bun.spawn([process.execPath, cli, "requirement", "create", "Order Management"], {
    cwd: initialized.target,
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(await create.exited).toBe(0);
  const directory = join(initialized.target, "docs/requirements/order-management");
  const initial = JSON.parse(await readFile(join(directory, "status.json"), "utf8"));
  expect(initial.status).toBe("draft");
  expect(initial.validationSummary).toBeNull();

  const acceptedDocs: Record<string, string> = {
    "brief.md": "## Problem\nOrders are hard to track.\n\n## Desired outcome\nTrack orders.\n\n## Scope boundaries\nOrder workflow only.\n",
    "context.md": "## Project context\nCrossOne application.\n\n## Affected areas\nAPI and admin.\n\n## Assumptions\nPostgres stays in use.\n\n## Open questions\nNone known.\n",
    "acceptance.md": "## Acceptance criteria\n- [ ] Members can search by order number.\n",
    "plan.md": "## Implementation steps\n- Add order search.\n\n## Affected files and packages\n- services/api and apps/admin-web.\n\n## Verification\n- Run focused tests.\n\n## Risks\nNone known.\n",
  };
  await Promise.all(Object.entries(acceptedDocs).map(([file, content]) => writeFile(join(directory, file), content)));

  const validateDraft = Bun.spawn([process.execPath, cli, "requirement", "validate", "Order Management"], {
    cwd: initialized.target,
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(await validateDraft.exited).toBe(0);
  expect(await new Response(validateDraft.stdout).text()).toContain("status: draft");

  const now = new Date().toISOString();
  await writeFile(join(directory, "status.json"), `${JSON.stringify({
    ...initial,
    status: "planned",
    updatedAt: now,
    validationSummary: { checkedAt: now, valid: true, issueCount: 0 },
  }, null, 2)}\n`);
  const beforeFinalValidation = await readPackage(directory);
  const validatePlanned = Bun.spawn([process.execPath, cli, "requirement", "validate", "Order Management"], {
    cwd: initialized.target,
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(await validatePlanned.exited).toBe(0);
  expect(await new Response(validatePlanned.stdout).text()).toContain("status: planned");
  expect(await readPackage(directory)).toEqual(beforeFinalValidation);
});
