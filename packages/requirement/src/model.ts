export type RequirementStatus = "draft" | "planned";

export type RequirementStatusFile = Readonly<{
  formatVersion: 1;
  slug: string;
  status: RequirementStatus;
  createdAt: string;
  updatedAt: string;
  validationSummary:
    | null
    | Readonly<{
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

export function normalizeRequirementSlug(name: string): string {
  if (name.includes("/") || name.includes("\\")) {
    throw new Error(`Invalid requirement name: ${name}`);
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Invalid requirement name: ${name}`);
  }

  return slug;
}
