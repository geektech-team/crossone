import { expect, test } from "bun:test";
import { normalizeRequirementSlug } from "./model";
import { validateRequirementPackage } from "./validate";

test("normalizes an ASCII requirement name to kebab case", () => {
  expect(normalizeRequirementSlug("  Order Management v2 ")).toBe("order-management-v2");
});

test("rejects names that cannot produce a safe ASCII slug", () => {
  for (const name of ["", "   ", "订单", "../outside", "---"]) {
    expect(() => normalizeRequirementSlug(name)).toThrow();
  }
});

const validDocuments = (status: "draft" | "planned" = "draft", validationSummary: unknown = null) => ({
  brief: "## Problem\nOperators cannot track orders.\n\n## Desired outcome\nTrack every order.\n\n## Scope boundaries\nOrder records only.",
  context: "## Project context\nCrossOne app.\n\n## Affected areas\nAPI and admin UI.\n\n## Assumptions\nPostgres remains the database.\n\n## Open questions\nNone known.",
  acceptance: "## Acceptance criteria\n- [ ] A member can search orders by number.",
  plan: "## Implementation steps\n- Add order search.\n\n## Affected files and packages\n- services/api and apps/admin-web.\n\n## Verification\n- Run focused tests.\n\n## Risks\nNone known.",
  status: JSON.stringify({
    formatVersion: 1,
    slug: "order-management",
    status,
    createdAt: "2026-09-28T00:00:00.000Z",
    updatedAt: "2026-09-28T00:00:00.000Z",
    validationSummary,
  }),
});

test("accepts complete draft and planned packages with either summary state", () => {
  expect(validateRequirementPackage("order-management", validDocuments()).valid).toBe(true);
  const summary = { checkedAt: "2026-09-28T00:00:00Z", valid: true, issueCount: 0 };
  expect(validateRequirementPackage("order-management", validDocuments("planned", summary))).toEqual({
    valid: true,
    status: "planned",
    issues: [],
  });
});

test("reports each missing document in stable package order", () => {
  const result = validateRequirementPackage("order-management", {});
  expect(result.issues.map((issue) => issue.file)).toEqual([
    "brief.md", "context.md", "acceptance.md", "plan.md", "status.json",
  ]);
});

test("reports malformed status JSON and unsupported status metadata", () => {
  expect(validateRequirementPackage("order-management", { status: "{" }).issues.find((issue) => issue.file === "status.json")).toEqual({
    file: "status.json",
    message: "Must contain valid JSON.",
  });
  const docs = validDocuments();
  docs.status = JSON.stringify({ ...JSON.parse(docs.status), formatVersion: 9, status: "done" });
  const issues = validateRequirementPackage("order-management", docs).issues;
  expect(issues.some((issue) => issue.message === "formatVersion must be 1.")).toBe(true);
  expect(issues.some((issue) => issue.message === 'status must be "draft" or "planned".')).toBe(true);
});

test("checks status slug, UTC timestamps, and validation summary fields", () => {
  const docs = validDocuments();
  docs.status = JSON.stringify({
    ...JSON.parse(docs.status),
    slug: "other",
    createdAt: "yesterday",
    validationSummary: { checkedAt: "not-a-date", valid: "yes", issueCount: -1 },
  });
  const issues = validateRequirementPackage("order-management", docs).issues;
  expect(issues.some((issue) => issue.message.includes("slug must match"))).toBe(true);
  expect(issues.some((issue) => issue.message.startsWith("createdAt must"))).toBe(true);
  expect(issues.some((issue) => issue.message.includes("validationSummary.checkedAt"))).toBe(true);
  expect(issues.some((issue) => issue.message.includes("validationSummary.valid"))).toBe(true);
  expect(issues.some((issue) => issue.message.includes("validationSummary.issueCount"))).toBe(true);
});

test("reports missing headings and placeholder-only sections", () => {
  const docs = validDocuments();
  docs.brief = "## Problem\nTODO\n## Desired outcome\nDescribe here\n## Scope boundaries\nTBD";
  const issues = validateRequirementPackage("order-management", docs).issues;
  expect(issues.filter((issue) => issue.file === "brief.md").map((issue) => issue.message)).toEqual([
    'Section "Problem" must contain meaningful content.',
    'Section "Desired outcome" must contain meaningful content.',
    'Section "Scope boundaries" must contain meaningful content.',
  ]);
  docs.brief = "## Problem\nOrders are hard to find.";
  expect(validateRequirementPackage("order-management", docs).issues.some((issue) => issue.message === "Missing required heading: Desired outcome.")).toBe(true);
});

test("requires a non-placeholder acceptance checkbox and plan verification and impact items", () => {
  const docs = validDocuments();
  docs.acceptance = "## Acceptance criteria\n- [ ] TODO";
  docs.plan = "## Implementation steps\n- Make a change.\n\n## Affected files and packages\nTBD\n\n## Verification\n\n## Risks\nNone known.";
  const issues = validateRequirementPackage("order-management", docs).issues;
  expect(issues.some((issue) => issue.message.includes("at least one non-placeholder checkbox"))).toBe(true);
  expect(issues.some((issue) => issue.message.includes('"Affected files and packages" needs'))).toBe(true);
  expect(issues.some((issue) => issue.message.includes('"Verification" needs'))).toBe(true);
});
