import { expect, test } from "bun:test";
import { requirementSeedFiles, requirementSkillFiles } from "./files";

test("ships a portable skill that ends at the accepted plan", () => {
  const skill = requirementSkillFiles.find((file) => file.path === ".agents/skills/crossone-requirement/SKILL.md");
  expect(skill).toBeDefined();
  expect(skill?.content).toContain("crossone requirement create");
  expect(skill?.content).toContain("crossone requirement validate");
  expect(skill?.content).toContain("not permission to implement");
  expect(skill?.content).toContain("AGENTS.md");
  expect(skill?.content).toContain("docs/README.md");
  expect(skill?.content).toContain("validationSummary");
  expect(skill?.content).toContain("createdAt");
  expect(skill?.content).toContain("not permission to implement");
  expect(skill?.content).not.toContain("::");
});

test("provides the four deterministic requirement seed documents", () => {
  expect(requirementSeedFiles.map((file) => file.path)).toEqual([
    "brief.md", "context.md", "acceptance.md", "plan.md",
  ]);
  const content = Object.fromEntries(requirementSeedFiles.map((file) => [file.path, file.content]));
  expect(content["brief.md"]).toContain("## Scope boundaries");
  expect(content["context.md"]).toContain("## Open questions");
  expect(content["acceptance.md"]).toContain("## Acceptance criteria");
  expect(content["plan.md"]).toContain("## Affected files and packages");
});
