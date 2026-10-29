import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repository = resolve(import.meta.dir, "../../..");
const script = join(import.meta.dir, "publish.ts");
const cleanup: string[] = [];
afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function run(args: string[]) {
  const child = Bun.spawn([process.execPath, script, ...args], {
    cwd: repository, stdout: "pipe", stderr: "pipe",
  });
  const [code, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ]);
  return { code, stdout, stderr };
}

test("release preview packs only framework packages with installable dependencies and executable CLI", async () => {
  const before = await readFile(join(repository, "packages/cli/package.json"), "utf8");
  const result = await run(["--version", "0.1.0-test.1", "--dry-run"]);
  expect(result.code).toBe(0);
  const directory = /RELEASE_DIR=(.+)/.exec(result.stdout)?.[1];
  expect(directory).toBeDefined();
  cleanup.push(directory!);
  const release = JSON.parse(await readFile(join(directory!, "release.json"), "utf8"));
  expect(release.tag).toBe("next");
  expect(release.packages.map((pkg: { name: string }) => pkg.name)).toEqual([
    "@crossone/requirement", "@crossone/skill-requirement", "@crossone/template-default", "@crossone/cli",
  ]);
  expect((await readdir(join(directory!, "tarballs"))).filter((name) => name.endsWith(".tgz"))).toHaveLength(4);
  for (const pkg of release.packages) {
    const staging = join(directory!, "packages", pkg.name.split("/")[1]);
    const manifest = JSON.parse(await readFile(join(staging, "package.json"), "utf8"));
    expect(manifest.version).toBe("0.1.0-test.1");
    expect(manifest.private).not.toBe(true);
    expect(manifest.engines.bun).toBe(">=1.3.0");
    for (const [name, version] of Object.entries(manifest.dependencies ?? {})) {
      expect(version).not.toMatch(/^workspace:/);
      if (name.startsWith("@crossone/")) expect(version).toBe("0.1.0-test.1");
    }
    expect(manifest.scripts).toBeUndefined();
    expect((await readdir(join(staging, "src"))).some((name) => name.endsWith(".test.ts"))).toBe(false);
  }
  // Execute the actual packed bin outside this checkout. Internal dependencies
  // must come from tarballs; only the published external core is reused offline.
  const consumer = await mkdtemp(join(tmpdir(), "crossone-publish-smoke-"));
  cleanup.push(consumer);
  const { mkdir, symlink } = await import("node:fs/promises");
  for (const pkg of release.packages) {
    const destination = join(consumer, "node_modules", pkg.name);
    await mkdir(destination, { recursive: true });
    const extracted = Bun.spawnSync(["tar", "-xzf", join(directory!, pkg.tarball), "--strip-components=1", "-C", destination]);
    expect(extracted.exitCode).toBe(0);
  }
  const coreEntry = Bun.resolveSync("transone/platform", join(repository, "packages/template-default"));
  await symlink(resolve(coreEntry, "../../.."), join(consumer, "node_modules/transone"), "dir");
  const binary = join(consumer, "node_modules/@crossone/cli/src/index.ts");
  const initialized = Bun.spawnSync([binary, "init", "app", "--clients", "client-web-phone,client-mini-weixin"], { cwd: consumer });
  expect(initialized.exitCode).toBe(0);
  const app = JSON.parse(await readFile(join(consumer, "app/apps/client-mini-weixin/package.json"), "utf8"));
  expect(app.scripts.build).toContain("--target miniprogram-weixin");
  const requirement = Bun.spawnSync([binary, "requirement", "create", "Orders"], { cwd: join(consumer, "app") });
  expect(requirement.exitCode).toBe(0);
  const draft = JSON.parse(await readFile(join(consumer, "app/docs/requirements/orders/status.json"), "utf8"));
  expect(draft.status).toBe("draft");
  expect(await readFile(join(repository, "packages/cli/package.json"), "utf8")).toBe(before);
  const typecheck = Bun.spawnSync([process.execPath, "run", "typecheck"], { cwd: repository });
  expect(typecheck.exitCode).toBe(0);
}, 30_000);

test("unsafe versions, tags and ambiguous publication options fail before creating artifacts", async () => {
  for (const args of [
    [], ["--version", "../outside"], ["--version", "01.2.3"],
    ["--version", "1.0.0-01"], ["--version", "1.0.0", "--unknown"],
    ["--version", "1.0.0", "--publish"], ["--version", "1.0.0", "--yes"],
    ["--version", "1.0.0", "--publish", "--yes", "--dry-run"],
    ["--version", "1.0.0-beta.1", "--tag", "latest"],
    ["--version", "1.0.0", "--tag", "../tag"],
  ]) {
    const result = await run(args);
    expect(result.code).not.toBe(0);
    expect(result.stdout).not.toContain("RELEASE_DIR=");
    expect(result.stderr).toMatch(/version|tag|option|publish|Usage/i);
  }
});

test("interactive upload commands expose prompts and propagate process failures", async () => {
  const child = Bun.spawn([process.execPath, "--eval", `
    import { runInteractiveCommand } from ${JSON.stringify(script)};
    await runInteractiveCommand([process.execPath, "--eval", 'console.log("visible prompt"); console.error("visible challenge"); process.exit(7)'], process.cwd());
  `], { stdout: "pipe", stderr: "pipe", stdin: "ignore" });
  const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
  expect(code).not.toBe(0);
  expect(stdout).toContain("visible prompt");
  expect(stderr).toContain("visible challenge");
  expect(stderr).toContain("7");
});
