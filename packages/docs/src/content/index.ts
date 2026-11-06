import type { DocPage, DocSection } from "./types";
import { homePage } from "./home";
import { guidePages } from "./guide";
import { packagePages } from "./packages";
import { projectPages } from "./project";

export const docsPages: DocPage[] = [homePage, ...guidePages, ...packagePages, ...projectPages];
export const SECTION_ORDER: DocSection[] = ["guide", "cli", "template", "requirement", "skill", "docs", "project"];
export const SECTION_TITLES: Record<DocSection, string> = {
  home: "首页", guide: "指南", cli: "CLI", template: "模板", requirement: "需求模型", skill: "Skill", docs: "文档站", project: "项目",
};
export const SECTION_PATHS: Record<DocSection, string> = {
  home: "/", guide: "/guide", cli: "/cli", template: "/template", requirement: "/requirement", skill: "/skill", docs: "/docs", project: "/project",
};

export function normalizeDocPath(path: string): string {
  return !path || path === "/" ? "/" : path.replace(/\/+$/, "");
}
export function findPage(path: string): DocPage | undefined {
  return docsPages.find((page) => page.path === normalizeDocPath(path));
}
export function pagesOfSection(section: DocSection): DocPage[] {
  return docsPages.filter((page) => page.section === section).sort((a, b) => a.order - b.order);
}
export const docRoutes: string[] = docsPages.map((page) => page.path);
