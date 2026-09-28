import type {
  RequirementDocuments,
  RequirementIssue,
  RequirementStatus,
  RequirementStatusFile,
} from "./model";
import { normalizeRequirementSlug } from "./model";

const markdownFiles = ["brief.md", "context.md", "acceptance.md", "plan.md"] as const;
const allFiles = [...markdownFiles, "status.json"] as const;

type Section = Readonly<{ heading: string; placeholder?: boolean }>;

const sectionDefinitions: Readonly<Record<(typeof markdownFiles)[number], readonly Section[]>> = {
  "brief.md": [
    { heading: "Problem" },
    { heading: "Desired outcome" },
    { heading: "Scope boundaries" },
  ],
  "context.md": [
    { heading: "Project context" },
    { heading: "Affected areas" },
    { heading: "Assumptions" },
    { heading: "Open questions" },
  ],
  "acceptance.md": [{ heading: "Acceptance criteria" }],
  "plan.md": [
    { heading: "Implementation steps" },
    { heading: "Affected files and packages" },
    { heading: "Verification" },
    { heading: "Risks" },
  ],
};

const placeholderOnly = /^(?:\s|[-*\d.)]+|todo\b|tbd\b|fill this\b|describe here\b)+$/i;
const placeholderWords = /^(?:todo|tbd|fill this(?: in)?|describe here|n\/a)$/i;

function isPlaceholder(value: string): boolean {
  const normalized = value.trim().replace(/^[-*]\s*/, "");
  return normalized.length === 0 || placeholderWords.test(normalized) || placeholderOnly.test(normalized);
}

function parseStatus(raw: string | undefined, expectedSlug: string, issues: RequirementIssue[]): RequirementStatus | undefined {
  if (raw === undefined) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    issues.push({ file: "status.json", message: "Must contain valid JSON." });
    return undefined;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    issues.push({ file: "status.json", message: "Must be a JSON object." });
    return undefined;
  }
  const status = value as Record<string, unknown>;
  if (status.formatVersion !== 1) issues.push({ file: "status.json", message: "formatVersion must be 1." });
  if (typeof status.slug !== "string") {
    issues.push({ file: "status.json", message: "slug must be a string." });
  } else {
    try {
      if (normalizeRequirementSlug(status.slug) !== status.slug || status.slug !== expectedSlug) {
        issues.push({ file: "status.json", message: `slug must match the requirement directory (${expectedSlug}).` });
      }
    } catch {
      issues.push({ file: "status.json", message: `slug must match the requirement directory (${expectedSlug}).` });
    }
  }
  const lifecycle = status.status;
  if (lifecycle !== "draft" && lifecycle !== "planned") {
    issues.push({ file: "status.json", message: 'status must be "draft" or "planned".' });
  }
  for (const field of ["createdAt", "updatedAt"] as const) {
    if (!isUtcTimestamp(status[field])) issues.push({ file: "status.json", message: `${field} must be a valid UTC ISO 8601 timestamp ending in Z.` });
  }
  if (status.validationSummary !== null) {
    const summary = status.validationSummary;
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      issues.push({ file: "status.json", message: "validationSummary must be null or an object." });
    } else {
      const record = summary as Record<string, unknown>;
      if (!isUtcTimestamp(record.checkedAt)) issues.push({ file: "status.json", message: "validationSummary.checkedAt must be a valid UTC ISO 8601 timestamp ending in Z." });
      if (typeof record.valid !== "boolean") issues.push({ file: "status.json", message: "validationSummary.valid must be a boolean." });
      if (!Number.isInteger(record.issueCount) || (record.issueCount as number) < 0) issues.push({ file: "status.json", message: "validationSummary.issueCount must be a non-negative integer." });
    }
  }
  return lifecycle === "draft" || lifecycle === "planned" ? lifecycle : undefined;
}

function isUtcTimestamp(value: unknown): value is string {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) &&
    Number.isFinite(Date.parse(value));
}

function getSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  let current: string | undefined;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line)?.[1]?.trim().toLowerCase();
    if (heading) {
      current = heading;
      sections.set(current, "");
    } else if (current) {
      sections.set(current, `${sections.get(current)}\n${line}`);
    }
  }
  return sections;
}

function validateMarkdown(file: (typeof markdownFiles)[number], markdown: string, issues: RequirementIssue[]): void {
  const sections = getSections(markdown);
  const required = sectionDefinitions[file];
  for (const { heading } of required) {
    const content = sections.get(heading.toLowerCase());
    if (content === undefined) {
      issues.push({ file, message: `Missing required heading: ${heading}.` });
    } else if (isPlaceholder(content)) {
      issues.push({ file, message: `Section "${heading}" must contain meaningful content.` });
    }
  }

  if (file === "acceptance.md") {
    const criteria = sections.get("acceptance criteria") ?? "";
    const checkboxes = criteria.split(/\r?\n/).filter((line) => /^\s*[-*]\s+\[[ xX]\]\s+\S/.test(line));
    if (!checkboxes.some((line) => !isPlaceholder(line.replace(/^\s*[-*]\s+\[[ xX]\]\s*/, "")))) {
      issues.push({ file, message: 'Section "Acceptance criteria" needs at least one non-placeholder checkbox item.' });
    }
  }

  if (file === "plan.md") {
    for (const heading of ["Implementation steps", "Affected files and packages", "Verification"] as const) {
      const content = sections.get(heading.toLowerCase()) ?? "";
      const items = content.split(/\r?\n/).filter((line) => /^\s*(?:[-*+]\s+|\d+[.)]\s+)\S/.test(line));
      if (!items.some((line) => !isPlaceholder(line.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, "")))) {
        issues.push({ file, message: `Section "${heading}" needs at least one non-placeholder list item.` });
      }
    }
  }
}

export function validateRequirementPackage(
  expectedSlug: string,
  documents: RequirementDocuments,
): { valid: boolean; status?: RequirementStatus; issues: RequirementIssue[] } {
  const issues: RequirementIssue[] = [];
  for (const file of allFiles) {
    const key = file === "status.json" ? "status" : file.replace(".md", "") as keyof RequirementDocuments;
    if (documents[key] === undefined) issues.push({ file, message: "File is required." });
  }

  const status = parseStatus(documents.status, expectedSlug, issues);
  for (const file of markdownFiles) {
    const key = file.replace(".md", "") as keyof RequirementDocuments;
    const content = documents[key];
    if (content !== undefined) validateMarkdown(file, content, issues);
  }

  return { valid: issues.length === 0, ...(status ? { status } : {}), issues };
}

export type { RequirementStatusFile };
