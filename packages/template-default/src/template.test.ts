import { expect, test } from "bun:test";
import { getDefaultTemplate, validateTemplatePath } from "./template";

function contentFor(path: string): string {
  const file = getDefaultTemplate().find((candidate) => candidate.path === path);
  if (!file) throw new Error(`Missing template file: ${path}`);
  return file.content;
}

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
  ]) {
    expect(paths.has(path)).toBe(true);
  }
});

test("template paths cannot escape a destination", () => {
  expect(() => validateTemplatePath("../../outside")).toThrow();
});

test("generated workspace and packages declare their boundaries", () => {
  const root = JSON.parse(contentFor("package.json")) as {
    workspaces: string[];
  };
  expect(root.workspaces).toEqual([
    "apps/*",
    "services/*",
    "packages/*",
    "tooling/*",
  ]);

  const admin = JSON.parse(contentFor("apps/admin-web/package.json")) as {
    dependencies: Record<string, string>;
  };
  const api = JSON.parse(contentFor("services/api/package.json")) as {
    dependencies: Record<string, string>;
  };
  expect(admin.dependencies.transone).toBe("^0.4.0");
  expect(api.dependencies["@geektech/backone"]).toBe("^0.1.2");

  for (const file of getDefaultTemplate().filter((file) =>
    /^packages\/[^/]+\/package\.json$/.test(file.path),
  )) {
    expect(() => JSON.parse(file.content)).not.toThrow();
  }

  const docs = contentFor("docs/README.md");
  expect(docs).toContain("Web");
  expect(docs).toContain("future");
});
