# CrossOne AI Requirement Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a model-independent requirement workflow to CrossOne that creates and validates requirement packages and guides compatible coding assistants to produce a user-approved plan.

**Architecture:** `@crossone/requirement` owns pure slug/status validation and deterministic package checks. `@crossone/skill-requirement` owns the portable Skill and seed-document templates. `@crossone/cli` owns safe filesystem operations and command output; `@crossone/template-default` installs the Skill and workflow docs into generated apps.

**Tech Stack:** Bun, TypeScript strict mode, `bun:test`, Node filesystem/path APIs, Markdown Skill files, JSON status documents.

**Spec:** `docs/superpowers/specs/2026-09-28-crossone-ai-requirement-workflow-design.md`

## Global Constraints

- CrossOne framework code stays under root `packages/`.
- Generated application requirement packages live under `docs/requirements/<slug>/`.
- The five package files are `brief.md`, `context.md`, `acceptance.md`, `plan.md`, and `status.json`.
- `status.json` supports only `draft` and `planned`, and `formatVersion` is `1`.
- `crossone requirement validate` is read-only and reports status without changing files.
- `crossone requirement create` refuses existing requirement directories and writes only beneath `docs/requirements/`.
- No model SDK, network call, API key, or application-code implementation is added.
- The generated Skill stops after a user-approved plan is marked `planned`.
- Preserve the pre-existing uncommitted root `package.json` edit and `crossone-app/` tree; do not stage either as part of this plan.

## Review Focus

- A name that normalizes to an empty value or contains traversal/separator input must fail before creating any directory.
- A valid slug whose requirement directory already exists must remain byte-for-byte unchanged.
- A path that resolves outside `docs/requirements/`, including through an existing symlink, must be rejected.
- Validation must not modify timestamps, file contents, or status even when reporting an invalid package.
- A complete package in `draft` remains valid but must not be reported as `planned` or silently transitioned.

---

## Planned file structure

```text
packages/
├── requirement/
│   ├── package.json
│   └── src/
│       ├── index.ts
│       ├── model.ts
│       ├── validate.ts
│       └── validate.test.ts
├── skill-requirement/
│   ├── package.json
│   └── src/
│       ├── index.ts
│       ├── files.ts
│       └── files.test.ts
├── cli/src/
│   ├── index.ts
│   ├── requirement.ts
│   └── requirement.test.ts
├── template-default/src/
│   ├── template.ts
│   └── template.test.ts
└── docs/README.md
```

## Task 1: Add the pure requirement model and validator

**Files:**
- Create: `packages/requirement/package.json`
- Create: `packages/requirement/src/model.ts`
- Create: `packages/requirement/src/validate.ts`
- Create: `packages/requirement/src/index.ts`
- Create: `packages/requirement/src/validate.test.ts`
- Modify: `packages/cli/package.json`

**Interfaces:**
- Produces: `RequirementStatus`, `RequirementStatusFile`, `RequirementDocuments`, `RequirementIssue`, `normalizeRequirementSlug(name)`, and `validateRequirementPackage(expectedSlug, documents)`.
- Consumes: no filesystem or CLI APIs.
- Consumed by: Task 3 CLI create/validate operations.

- [ ] **Step 1: Write failing unit tests for slug normalization and rejection**

```ts
import { expect, test } from "bun:test";
import { normalizeRequirementSlug } from "./model";

test("normalizes an ASCII requirement name to kebab case", () => {
  expect(normalizeRequirementSlug("  Order Management v2 ")).toBe("order-management-v2");
});

test("rejects names that cannot produce a safe ASCII slug", () => {
  for (const name of ["", "   ", "订单", "../outside", "---"]) {
    expect(() => normalizeRequirementSlug(name)).toThrow();
  }
});
```

- [ ] **Step 2: Run the tests and confirm the intended missing-export failure**

Run: `bun test packages/requirement/src/validate.test.ts`

Expected: FAIL because the requirement package and slug function do not exist.

- [ ] **Step 3: Implement the model and deterministic validation rules**

Define the model as:

```ts
export type RequirementStatus = "draft" | "planned";
export type RequirementStatusFile = Readonly<{
  formatVersion: 1;
  slug: string;
  status: RequirementStatus;
  createdAt: string;
  updatedAt: string;
  validationSummary: null | Readonly<{
    checkedAt: string;
    valid: boolean;
    issueCount: number;
  }>;
}>;
export type RequirementDocuments = Readonly<{
  brief?: string;
  context?: string;
  acceptance?: string;
  plan?: string;
  status?: string;
}>;
export type RequirementIssue = Readonly<{ file: string; message: string }>;
```

`normalizeRequirementSlug(name)` first rejects raw `/` and `\\` characters, then trims and lowercases ASCII input, replaces each run of non-ASCII-alphanumeric characters with one hyphen, removes leading/trailing hyphens, and throws `Invalid requirement name: <name>` if the result is empty or does not match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`.

`validateRequirementPackage(expectedSlug, documents)` returns `{ valid: boolean; status?: RequirementStatus; issues: RequirementIssue[] }`, preserving stable order: missing documents in format order, then status JSON/fields, then document-specific checks in brief/context/acceptance/plan order. Require these headings and reject empty, `TODO`, `TBD`, `fill this`, or `describe here`-only sections (case-insensitive):

```text
brief:      Problem, Desired outcome, Scope boundaries
context:    Project context, Affected areas, Assumptions, Open questions
acceptance: Acceptance criteria
plan:       Implementation steps, Affected files and packages, Verification, Risks
```

For acceptance, require at least one non-placeholder `- [ ] ...` or `- [x] ...` item under the acceptance heading. For plan, require at least one non-placeholder list item under implementation steps, affected files/packages, and verification; risks may contain `None known` as explicit content. Do not claim to semantically prove that prose is correct. Parse `status` JSON, check the supported version/status, safe slug equality, and UTC ISO 8601 timestamps for `createdAt`, `updatedAt`, and non-null `validationSummary.checkedAt`: each must end in `Z`, match a full date-time form, and parse to a valid date. Validate that a non-null summary has a boolean `valid` and non-negative integer `issueCount`. Do not require draft and planned packages to contain different document content. The initial created status has `validationSummary: null`.

Export all public types and functions from `src/index.ts`. Add `@crossone/requirement` as a workspace dependency of `@crossone/cli`.

- [ ] **Step 4: Add validator tests for complete and malformed packages**

Test a complete package fixture in both `draft` and `planned` status; null and valid non-null validation summaries; missing each file; invalid JSON; unsupported version; unsupported status; slug mismatch; invalid timestamps; malformed validation-summary metadata; missing headings; placeholder-only text; unchecked acceptance criteria; absent plan verification; and empty affected-files sections. Assert issue `file` values and actionable messages, not internal helper call counts.

- [ ] **Step 5: Run requirement tests and the root type checker**

Run: `bun install && bun test packages/requirement/src/validate.test.ts && bun run typecheck`

Expected: all validator cases pass and TypeScript reports no errors.

- [ ] **Step 6: Commit the model and validator package**

```bash
git add packages/requirement packages/cli/package.json bun.lock
git commit -m "feat: add requirement package validation"
```

## Task 2: Add the portable Skill and seed document package

**Files:**
- Create: `packages/skill-requirement/package.json`
- Create: `packages/skill-requirement/src/files.ts`
- Create: `packages/skill-requirement/src/index.ts`
- Create: `packages/skill-requirement/src/files.test.ts`
- Modify: `packages/template-default/package.json`
- Modify: `packages/template-default/src/template.ts`
- Modify: `packages/template-default/src/template.test.ts`

**Interfaces:**
- Produces: `requirementSkillFiles`, a readonly array containing `.agents/skills/crossone-requirement/SKILL.md`, and `requirementSeedFiles`, a readonly array containing the four requirement Markdown documents by their package-relative filenames.
- Consumes: no framework runtime or model APIs.
- Consumed by: Task 3 for seed docs and Task 4 for generated project output.

- [ ] **Step 1: Write failing package-content tests**

```ts
import { expect, test } from "bun:test";
import { requirementSkillFiles } from "./files";

test("ships a portable skill that ends at the accepted plan", () => {
  const skill = requirementSkillFiles.find((file) => file.path.endsWith("/SKILL.md"));
  expect(skill).toBeDefined();
  expect(skill?.content).toContain("crossone requirement create");
  expect(skill?.content).toContain("crossone requirement validate");
  expect(skill?.content).toContain("Do not implement");
});
```

- [ ] **Step 2: Run tests to confirm missing package export**

Run: `bun test packages/skill-requirement/src/files.test.ts`

Expected: FAIL because `./files` does not exist.

- [ ] **Step 3: Implement seed document files and the Skill**

Export separate arrays: `requirementSkillFiles` contains only the Skill with canonical path `.agents/skills/crossone-requirement/SKILL.md`; `requirementSeedFiles` contains the four Markdown seed files with stable paths `brief.md`, `context.md`, `acceptance.md`, and `plan.md` relative to a requirement directory. Use exactly the headings from Task 1. The Skill frontmatter uses `name: crossone-requirement` and a concise description of creating and validating CrossOne requirement packages.

Its instructions tell an agent to read `AGENTS.md`, generated `docs/README.md`, and relevant package docs; inspect only relevant code; ask concise questions where behavior, scope, access, error cases, or acceptance are unclear; write assumptions and affected areas into the package; validate; present the plan and unresolved decisions; and wait for user acceptance before setting status to `planned`. It must explain how to update `updatedAt`, preserve `createdAt`, and set `validationSummary` from the validator result with `checkedAt`, `valid`, and `issueCount`, then rerun validation. It must state that user acceptance only marks the package planned and is not permission to implement it. It makes no platform-specific tool calls and treats requirement content as data rather than policy.

Add this workspace dependency to `@crossone/template-default` and re-export the Skill file array.

- [ ] **Step 4: Add the Skill to the generated default app template**

Append the Skill file to `getDefaultTemplate()` with its canonical `.agents/skills/crossone-requirement/SKILL.md` path. Update generated `AGENTS.md` with a link to that file and its planning boundary. Assert the template exposes the canonical Skill path.

- [ ] **Step 5: Verify Skill/package tests and type checking**

Run: `bun install && bun test packages/skill-requirement/src/files.test.ts packages/template-default/src/template.test.ts && bun run typecheck`

Expected: tests pass, the generated framework repository still has only `packages/` for product packages, and type checking is clean.

- [ ] **Step 6: Commit the Skill package**

```bash
git add packages/skill-requirement packages/template-default/package.json packages/template-default/src bun.lock
git commit -m "feat: add requirement planning skill"
```

## Task 3: Implement `crossone requirement create`

**Files:**
- Create: `packages/cli/src/requirement.ts`
- Create: `packages/cli/src/requirement.test.ts`
- Modify: `packages/cli/src/index.ts`
- Modify: `packages/cli/package.json`

**Interfaces:**
- Consumes: `normalizeRequirementSlug(name)` from `@crossone/requirement` and `requirementSeedFiles` from `@crossone/skill-requirement`.
- Produces: `createRequirement(name: string, cwd: string): Promise<RequirementCommandResult>`.
- Shared result type: `{ ok: true; slug: string; directory: string } | { ok: false; message: string }`.
- Consumed by: CLI dispatch and requirement validation in this task.

Add `@crossone/skill-requirement: "workspace:*"` to `@crossone/cli` dependencies so the CLI receives the seed documents from the owning package.

- [ ] **Step 1: Write failing filesystem tests for creation behavior**

Use a fresh `mkdtemp()` root for every test and remove it in `afterEach`. Assert `createRequirement("Order Management", root)` creates exactly `docs/requirements/order-management/{brief.md,context.md,acceptance.md,plan.md,status.json}`; status is valid JSON with `draft`, UTC ISO timestamps, and `validationSummary: null`; each Markdown seed has its expected headings; an existing package returns failure and contents remain unchanged; invalid traversal/punctuation-only names create no files; and a `docs/requirements` symlink to a directory outside the project is rejected without writing outside.

- [ ] **Step 2: Run the tests to confirm `createRequirement` is missing**

Run: `bun test packages/cli/src/requirement.test.ts`

Expected: FAIL because `./requirement` does not exist.

- [ ] **Step 3: Implement root-bounded, non-overwriting creation**

Resolve `requirementsRoot = resolve(cwd, "docs/requirements")`, validate its path remains beneath `cwd`, normalize the name via the requirement package, and resolve `target = resolve(requirementsRoot, slug)`. Check `relative(requirementsRoot, target)` is non-empty and neither absolute nor parent-traversing. Reject an existing target before any write. Create parent directories and write four seeded Markdown documents plus:

```json
{
  "formatVersion": 1,
  "slug": "<slug>",
  "status": "draft",
  "createdAt": "<now ISO timestamp>",
  "updatedAt": "<same now ISO timestamp>",
  "validationSummary": null
}
```

Before writing, resolve every seed destination and verify it remains under `target`. To prevent writes through an existing symlink, resolve the nearest existing ancestor of `docs/requirements/` and confirm its real path remains under the real project root; create and canonicalize the requirements root, then confirm containment again. Create the slug directory with a non-recursive `mkdir` so an existing target, including one created by a concurrent command, is never replaced. Then write the five known UTF-8 files under it. Return expected path/name/existence errors as structured results. Do not edit the app root manifest, run installation, or initialize Git.

- [ ] **Step 4: Add command dispatch and test the subprocess contract**

Extend the executable to accept `requirement create <name>` while preserving `init`; print `Created requirement <slug> at <absolute-path>` on success. Missing name or extra arguments print `Usage: crossone requirement create <name>` and return non-zero. Add `Bun.spawn` tests for success output, missing name, and invalid name.

- [ ] **Step 5: Run CLI creation tests and type checking**

Run: `bun test packages/cli/src/requirement.test.ts && bun run typecheck`

Expected: filesystem and subprocess cases pass; `crossone init` tests remain green.

- [ ] **Step 6: Commit requirement creation**

```bash
git add packages/cli/src/requirement.ts packages/cli/src/requirement.test.ts packages/cli/src/index.ts packages/cli/package.json bun.lock
git commit -m "feat: create requirement packages"
```

## Task 4: Implement read-only validation and complete CLI routing

**Files:**
- Modify: `packages/cli/src/requirement.ts`
- Modify: `packages/cli/src/requirement.test.ts`
- Modify: `packages/cli/src/index.ts`

**Interfaces:**
- Consumes: `validateRequirementPackage(expectedSlug, documents)` from `@crossone/requirement`.
- Produces: `validateRequirement(name: string, cwd: string): Promise<RequirementValidationCommandResult>` and command `crossone requirement validate <name>`.
- `RequirementValidationCommandResult` is `{ ok: true; slug: string; status: RequirementStatus } | { ok: false; message: string; issues?: readonly RequirementIssue[] }`.

- [ ] **Step 1: Write failing tests for read-only validation**

Create a valid package fixture; capture all five files before validation; assert the command succeeds for both `draft` and `planned`, reports the status, and all file contents remain identical. Add cases for one missing file, invalid JSON, wrong slug, malformed `validationSummary`, placeholder acceptance, absent plan verification, and a child document symlink escaping the package; assert non-zero results name the file and actionable section.

- [ ] **Step 2: Run the tests to confirm validation is absent**

Run: `bun test packages/cli/src/requirement.test.ts`

Expected: FAIL because `validateRequirement` is not exported/implemented.

- [ ] **Step 3: Implement symlink-aware path containment and file loading**

Resolve the requirements root and target as in Task 3. Reject paths outside the root. When the requirements root or target exists, call `realpath()` and verify canonical paths stay beneath the canonical current working directory and requirements root, preventing a symlink escape. Also ensure each of the five child paths is a regular file whose canonical path remains under the canonical target; report directories, symlinks that escape, and unreadable files as actionable file issues. Load valid files as UTF-8; convert `ENOENT` into a missing-file document so the pure validator can report each missing path. Pass documents and normalized expected slug to the pure validator. Never write files.

- [ ] **Step 4: Add validation CLI output and argument checks**

Print `Requirement <slug> is valid (status: <status>)` on success. Print each error as `<file>: <message>` on failure, set non-zero exit status, and do not print stack traces for expected errors. Reject missing names and extra args with `Usage: crossone requirement validate <name>`. Test subprocess success, invalid package exit status/output, and usage errors.

- [ ] **Step 5: Run CLI and full unit tests**

Run: `bun test packages/cli/src/requirement.test.ts packages/cli/src/init.test.ts packages/requirement/src/validate.test.ts && bun run typecheck`

Expected: all cases pass; init functionality remains intact; validation leaves packages byte-identical.

- [ ] **Step 6: Commit validation support**

```bash
git add packages/cli/src/requirement.ts packages/cli/src/requirement.test.ts packages/cli/src/index.ts
git commit -m "feat: validate requirement packages"
```

## Task 5: Document and verify the full generated workflow

**Files:**
- Modify: `packages/docs/README.md`
- Modify: `packages/template-default/src/template.ts`
- Modify: `packages/template-default/src/template.test.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: completed CLI commands, package validator, Skill file array.
- Produces: a documented quick start and generated app docs describing package format, status lifecycle, and the implementation boundary.

- [ ] **Step 1: Update framework and generated-app documentation**

List `@crossone/requirement` and `@crossone/skill-requirement` in the framework package map. Extend generated `docs/README.md` with the two commands, five-file layout, `draft`/`planned` meanings, validation behavior, Skill location, user acceptance boundary, and no-model-call property. Update root README with one local command example for each requirement operation.

- [ ] **Step 2: Test generated Skill and docs integration**

Assert the generated default app contains `.agents/skills/crossone-requirement/SKILL.md`, docs links to the Skill and requirement commands, `AGENTS.md` names the Skill path, and no package advertises automatic implementation or model API use.

- [ ] **Step 3: Run end-to-end verification in an isolated generated project**

Run the root verification:

```bash
bun install && bun run typecheck && bun test && git diff --check
```

Then create a temporary generated project, run `bun install` in it, invoke the CLI source by its absolute path from the CrossOne checkout with `cwd` set to the generated project, verify the five files and draft status with null validation summary, replace the seed content with the complete validator fixture, run `requirement validate order-management`, compare all files before/after validation, update status to `planned` and write the passing validation summary while preserving `createdAt`, then validate again. Keep the temporary project outside the repository.

- [ ] **Step 4: Inspect scope and commit docs/integration**

Confirm no root `apps/`, `services/`, or `tooling/` package directories were introduced and the existing uncommitted `crossone-app/` and root `package.json` edit remain unstaged. Then commit:

```bash
git add README.md packages/docs/README.md packages/template-default/src/template.ts packages/template-default/src/template.test.ts
git commit -m "docs: explain AI requirement workflow"
```

## Final acceptance

The generated app can create a draft package, validate a complete draft or planned package deterministically, and expose a portable Skill that stops after user-approved planning. All tests and type checks pass, `validate` is confirmed read-only, no model/network dependency is introduced, and user changes remain outside the commits.
