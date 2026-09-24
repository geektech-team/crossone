# CrossOne Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a Bun-based CrossOne framework workspace whose CLI creates a safe, documented `crossone-app` monorepo skeleton.

**Architecture:** `@crossone/template-default` provides a pure, validated file map for the generated business application. `@crossone/cli` parses `init <directory>`, validates the target, and materializes that map without installing dependencies or initializing Git. `@crossone/docs` records the framework-package map; it is not a framework-level application.

**Tech Stack:** Bun, TypeScript strict mode, `bun:test`, `@geektech/backone@^0.1.2`, and `transone@^0.4.0` in generated manifests.

**Spec:** `docs/superpowers/specs/2026-09-24-crossone-bootstrap-design.md`

## Global Constraints

- Framework source exists only in root `packages/`; do not add root `apps/`, `services/`, or `tooling/` directories.
- The generated `crossone-app` has `apps/`, `services/`, `packages/`, `tooling/`, and `docs/` directories.
- Web is the sole stable client target; native App targets must be described only as future work.
- Do not overwrite non-empty target directories.
- Do not install dependencies, initialize Git, make network requests, or add AI credentials during `crossone init`.
- Use only Bun and TypeScript runtime APIs; introduce no CLI dependency.

## Review Focus

- A target path that already contains a hidden file must be rejected before any generated file is written.
- An empty existing target directory must be accepted and remain the project root.
- Relative paths such as `../../outside` in future template edits must fail validation instead of escaping the destination.
- `crossone init` without a destination must return usage text and a non-zero status without mutating the current directory.
- Generated workspace manifests must retain all five workspace groups, including `tooling/*`, even though tooling has no runtime package dependency.

---

## Planned file structure

```text
package.json
bunfig.toml
tsconfig.json
packages/
├── cli/
│   ├── package.json
│   └── src/
│       ├── index.ts
│       ├── init.ts
│       └── init.test.ts
├── template-default/
│   ├── package.json
│   └── src/
│       ├── index.ts
│       ├── template.ts
│       └── template.test.ts
└── docs/
    ├── package.json
    ├── README.md
    └── src/index.ts
```

## Task 1: Establish the Bun workspace and framework-package documentation

**Files:**
- Create: `package.json`
- Create: `bunfig.toml`
- Create: `tsconfig.json`
- Create: `packages/docs/package.json`
- Create: `packages/docs/src/index.ts`
- Create: `packages/docs/README.md`

**Interfaces:**
- Produces: root workspace scripts `test` and `typecheck`, and the publishable `@crossone/docs` package consumed as framework documentation.
- Consumes: no earlier package interface.

- [ ] **Step 1: Create root configuration with workspace discovery and strict type checking**

```json
{
  "name": "crossone",
  "private": true,
  "packageManager": "bun@1.3.0",
  "workspaces": ["packages/*"],
  "scripts": {
    "test": "bun test",
    "typecheck": "bunx tsc --noEmit"
  }
}
```

Create `tsconfig.json` with `strict: true`, `target: "ESNext"`, `module: "Preserve"`, `moduleResolution: "bundler"`, `noEmit: true`, and include `packages/**/*.ts`. Create `bunfig.toml` with `[install]` and `exact = true`.

- [ ] **Step 2: Add the framework package-map documentation**

Create `@crossone/docs` with an exported `frameworkPackages` constant:

```ts
export const frameworkPackages = [
  "@crossone/cli",
  "@crossone/template-default",
  "@crossone/docs",
] as const;
```

Document that root `packages/` contains framework artifacts only; identify CLI, template, and docs responsibilities; state that application directories are created only by the CLI.

- [ ] **Step 3: Verify root configuration**

Run: `bun install && bun run typecheck`

Expected: exit code `0` and no framework-level `apps/`, `services/`, or `tooling/` directories.

- [ ] **Step 4: Commit the workspace baseline**

```bash
git add package.json bunfig.toml tsconfig.json packages/docs
git commit -m "chore: establish CrossOne workspace"
```

## Task 2: Implement the deterministic default template

**Files:**
- Create: `packages/template-default/package.json`
- Create: `packages/template-default/src/index.ts`
- Create: `packages/template-default/src/template.ts`
- Create: `packages/template-default/src/template.test.ts`

**Interfaces:**
- Produces: `TemplateFile`, `getDefaultTemplate()`, and `validateTemplatePath(path)` from `@crossone/template-default`.
- Consumes: no filesystem APIs; callers own file creation.

- [ ] **Step 1: Write failing template-contract tests**

```ts
import { expect, test } from "bun:test";
import { getDefaultTemplate, validateTemplatePath } from "./template";

test("default template contains every required application area", () => {
  const paths = new Set(getDefaultTemplate().map((file) => file.path));
  for (const path of [
    "apps/admin-web/package.json",
    "apps/client-web/package.json",
    "services/api/package.json",
    "packages/contracts/package.json",
    "packages/modules/package.json",
    "packages/ui/package.json",
    "packages/config/package.json",
    "tooling/README.md",
    "docs/README.md",
    "AGENTS.md",
  ]) expect(paths.has(path)).toBe(true);
});

test("template paths cannot escape a destination", () => {
  expect(() => validateTemplatePath("../../outside")).toThrow();
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `bun test packages/template-default/src/template.test.ts`

Expected: FAIL because `./template` does not exist.

- [ ] **Step 3: Implement the validated static file map**

Define:

```ts
export type TemplateFile = Readonly<{ path: string; content: string }>;

export function validateTemplatePath(path: string): void {
  if (!path || path.startsWith("/") || path.split("/").includes("..")) {
    throw new Error(`Invalid template path: ${path}`);
  }
}
```

`getDefaultTemplate()` returns complete text content for root workspace configuration, both Web applications, the BackOne API manifest, four shared packages, tooling instructions, outer docs, and `AGENTS.md`. Use `@crossone-app/admin-web`, `@crossone-app/client-web`, and `@crossone-app/api` package names. Root workspace globs are exactly `apps/*`, `services/*`, `packages/*`, and `tooling/*`. Both Web manifests declare `"transone": "^0.4.0"`; the API manifest declares `"@geektech/backone": "^0.1.2"`.

`docs/README.md` lists all generated package areas, dependency directions, and says Web is stable while mini-program and native clients are future additions. `AGENTS.md` repeats the import boundary: clients never import API implementation; contracts are transport-safe; server context and secrets are server-only.

Re-export `TemplateFile`, `getDefaultTemplate`, and `validateTemplatePath` from `src/index.ts`.

- [ ] **Step 4: Expand tests to validate generated manifests and documentation**

Add a helper that selects a template file by exact path and parses its JSON content. Assert root `package.json` has all four workspace globs, API and client manifests have the specified framework dependencies, every `packages/*/package.json` parses, and docs contain `Web` plus `future`.

- [ ] **Step 5: Run package and workspace verification**

Run: `bun test packages/template-default/src/template.test.ts && bun run typecheck`

Expected: all tests pass and TypeScript reports no errors.

- [ ] **Step 6: Commit the template package**

```bash
git add packages/template-default
git commit -m "feat: add default CrossOne app template"
```

## Task 3: Implement safe `crossone init`

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/src/init.ts`
- Create: `packages/cli/src/index.ts`
- Create: `packages/cli/src/init.test.ts`

**Interfaces:**
- Consumes: `getDefaultTemplate(): readonly TemplateFile[]` and `validateTemplatePath(path): void` from `@crossone/template-default`.
- Produces: `runInit(directory: string | undefined, cwd: string): Promise<InitResult>` where `InitResult` is `{ ok: true; target: string } | { ok: false; message: string }`.
- Produces: executable command `crossone init <directory>` via the `bin.crossone` manifest field.

- [ ] **Step 1: Write failing init behavior tests**

```ts
import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "./init";

const roots: string[] = [];
afterEach(async () => Promise.all(roots.map((root) => rm(root, { recursive: true, force: true }))));

test("creates an app in a new destination", async () => {
  const root = await mkdtemp(join(tmpdir(), "crossone-"));
  roots.push(root);
  const result = await runInit("crossone-app", root);
  expect(result).toEqual({ ok: true, target: join(root, "crossone-app") });
});

test("does not overwrite a non-empty destination", async () => {
  const root = await mkdtemp(join(tmpdir(), "crossone-"));
  roots.push(root);
  const target = join(root, "crossone-app");
  await mkdir(target);
  await writeFile(join(target, ".keep"), "existing");
  const result = await runInit("crossone-app", root);
  expect(result.ok).toBe(false);
});
```

- [ ] **Step 2: Run the init tests to verify failure**

Run: `bun test packages/cli/src/init.test.ts`

Expected: FAIL because `./init` does not exist.

- [ ] **Step 3: Implement target inspection and materialization**

`runInit` resolves the requested directory with `resolve(cwd, directory)`. Reject missing or whitespace-only directories with `Usage: crossone init <directory>`. Use `readdir(target)` when it exists; reject every non-empty target, including one containing only dotfiles. Create every parent directory with `mkdir(dirname(destination), { recursive: true })`, then write each validated template file using UTF-8.

Before writing, validate every template path and compute every destination with `resolve(target, file.path)`. Reject any computed destination for which `relative(target, destination)` begins with `..` or is absolute. Return structured expected failures instead of throwing them.

`index.ts` accepts only `init`; writes success guidance exactly as:

```text
Created CrossOne app at <absolute-path>
Next:
  cd <directory>
  bun install
  bun run dev
```

For expected failures, write the message to stderr and set `process.exitCode = 1`; do not print a stack trace. Set the `bin` entry in the CLI manifest to `./src/index.ts`.

- [ ] **Step 4: Complete end-to-end behavior tests**

Extend `init.test.ts` to assert the new target contains `docs/README.md`, `services/api/package.json`, and `apps/admin-web/package.json`; assert `.keep` still contains `existing` after rejection; assert an empty pre-created target succeeds; and invoke `Bun.spawn` with `[process.execPath, "packages/cli/src/index.ts", "init"]` to assert missing arguments produce usage and non-zero exit status.

- [ ] **Step 5: Verify the CLI manually in an isolated temporary directory**

Run:

```bash
project_root="$(mktemp -d)/crossone-app"
bun packages/cli/src/index.ts init "$project_root"
test -f "$project_root/docs/README.md"
test -f "$project_root/services/api/package.json"
rm -rf "$(dirname "$project_root")"
```

Expected: the command succeeds, prints the three next commands, and writes no files outside the temporary directory.

- [ ] **Step 6: Commit the CLI**

```bash
git add packages/cli
git commit -m "feat: scaffold CrossOne applications"
```

## Task 4: Final verification and documentation audit

**Files:**
- Modify: `README.md`
- Modify: `packages/docs/README.md`

**Interfaces:**
- Consumes: final CLI command and the three framework package responsibilities.
- Produces: a root quick-start that documents local development and does not imply unimplemented CRUD, AI generation, or native-client support.

- [ ] **Step 1: Add the root quick start**

Document local installation, `bun run typecheck`, `bun test`, and:

```bash
bun packages/cli/src/index.ts init crossone-app
cd crossone-app
bun install
bun run dev
```

State that the generated result is a project skeleton and that `crossone init` does not install dependencies or initialize Git.

- [ ] **Step 2: Verify every required check**

Run: `bun install && bun run typecheck && bun test && git diff --check`

Expected: all commands exit `0`.

- [ ] **Step 3: Inspect the generated package topology**

Run:

```bash
audit_root="$(mktemp -d)"
bun packages/cli/src/index.ts init "$audit_root/crossone-app"
find "$audit_root/crossone-app" -maxdepth 3 -type f | sort
rm -rf "$audit_root"
```

Expected: the listing includes both Web apps, the API service, four shared packages, tooling, docs, and `AGENTS.md`; no framework-level application directories were added to the CrossOne repository.

- [ ] **Step 4: Commit final documentation**

```bash
git add README.md packages/docs/README.md
git commit -m "docs: add CrossOne bootstrap quick start"
```
