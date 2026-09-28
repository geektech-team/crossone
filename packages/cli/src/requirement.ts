import { normalizeRequirementSlug } from "@crossone/requirement";
import { requirementSeedFiles } from "@crossone/skill-requirement";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

export type RequirementCommandResult =
  | Readonly<{ ok: true; slug: string; directory: string }>
  | Readonly<{ ok: false; message: string }>;

function isWithin(parent: string, candidate: string): boolean {
  const rel = relative(parent, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function errorCode(error: unknown): string | undefined {
  return error instanceof Error && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
}

async function nearestExistingPath(path: string): Promise<string> {
  let current = path;
  while (true) {
    try {
      return await realpath(current);
    } catch (error) {
      if (errorCode(error) !== "ENOENT") throw error;
      const parent = dirname(current);
      if (parent === current) throw error;
      current = parent;
    }
  }
}

export async function createRequirement(name: string, cwd: string): Promise<RequirementCommandResult> {
  let slug: string;
  try {
    slug = normalizeRequirementSlug(name);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invalid requirement name." };
  }

  const projectRoot = resolve(cwd);
  const requirementsRoot = resolve(projectRoot, "docs/requirements");
  const directory = resolve(requirementsRoot, slug);
  if (!isWithin(projectRoot, requirementsRoot) || !isWithin(requirementsRoot, directory) || directory === requirementsRoot) {
    return { ok: false, message: "Requirement path escapes docs/requirements/." };
  }

  try {
    const canonicalProjectRoot = await realpath(projectRoot);
    const nearestRoot = await nearestExistingPath(requirementsRoot);
    if (!isWithin(canonicalProjectRoot, nearestRoot)) {
      return { ok: false, message: "Requirements directory resolves outside the project." };
    }

    await mkdir(requirementsRoot, { recursive: true });
    const canonicalRequirementsRoot = await realpath(requirementsRoot);
    if (!isWithin(canonicalProjectRoot, canonicalRequirementsRoot)) {
      return { ok: false, message: "Requirements directory resolves outside the project." };
    }

    const canonicalTarget = resolve(canonicalRequirementsRoot, slug);
    if (!isWithin(canonicalRequirementsRoot, canonicalTarget) || canonicalTarget === canonicalRequirementsRoot) {
      return { ok: false, message: "Requirement path escapes docs/requirements/." };
    }

    const now = new Date().toISOString();
    const status = {
      formatVersion: 1,
      slug,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      validationSummary: null,
    };
    const files = [
      ...requirementSeedFiles,
      { path: "status.json", content: `${JSON.stringify(status, null, 2)}\n` },
    ];
    const destinations = files.map((file) => {
      const destination = resolve(canonicalTarget, file.path);
      if (!isWithin(canonicalTarget, destination) || destination === canonicalTarget) {
        throw new Error(`Requirement file path escapes package: ${file.path}`);
      }
      return { ...file, destination };
    });

    await mkdir(canonicalTarget);
    const createdTarget = await realpath(canonicalTarget);
    if (!isWithin(canonicalRequirementsRoot, createdTarget)) {
      return { ok: false, message: "Requirement directory resolves outside docs/requirements/." };
    }
    for (const file of destinations) {
      await writeFile(file.destination, file.content, { encoding: "utf8", flag: "wx" });
    }
    return { ok: true, slug, directory };
  } catch (error) {
    if (errorCode(error) === "EEXIST") {
      return { ok: false, message: `Requirement already exists: ${directory}` };
    }
    const message = error instanceof Error ? error.message : "unknown error";
    return { ok: false, message: `Unable to create requirement package: ${message}` };
  }
}

export const createRequirementUsage = "Usage: crossone requirement create <name>";
