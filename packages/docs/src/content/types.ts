/** Structured documentation shared by static rendering and the route registry. */
export interface InlineCode { kind: "code"; text: string }
export interface InlineLink { kind: "link"; text: string; href: string }
export interface InlineStrong { kind: "strong"; text: string }
export type InlineNode = string | InlineCode | InlineLink | InlineStrong;

export interface HeadingBlock { type: "heading"; level: 1 | 2 | 3; text: string }
export interface ParagraphBlock { type: "paragraph"; content: InlineNode[] }
export interface CodeBlock { type: "code"; lang: string; code: string }
export interface ListBlock { type: "list"; ordered: boolean; items: Array<InlineNode[] | DocBlock> }
export interface TableBlock { type: "table"; headers: string[]; rows: string[][] }
export interface ApiRow { name: string; type: string; description: string }
export interface ApiTableBlock { type: "api-table"; caption: string; rows: ApiRow[] }
export interface CalloutBlock { type: "callout"; variant: "info" | "tip" | "warn"; title?: string; content: InlineNode[] }
export interface LinkGridItem { title: string; description: string; href: string }
export interface LinkGridBlock { type: "link-grid"; items: LinkGridItem[] }
export interface HeroBlock { type: "hero"; badge: string; title: string; subtitle: string; actions: Array<{ label: string; href: string; primary?: boolean }> }
export interface FeatureGridBlock { type: "feature-grid"; items: Array<{ title: string; description: string }> }
export type DocBlock = HeadingBlock | ParagraphBlock | CodeBlock | ListBlock | TableBlock | ApiTableBlock | CalloutBlock | LinkGridBlock | HeroBlock | FeatureGridBlock;
export type DocSection = "home" | "guide" | "cli" | "template" | "requirement" | "skill" | "docs" | "project";
export interface DocPage {
  /** Site route without deployment prefix or trailing slash, except the root. */
  path: string;
  title: string;
  description: string;
  section: DocSection;
  order: number;
  body: DocBlock[];
}

export function heading(level: 1 | 2 | 3, text: string): HeadingBlock { return { type: "heading", level, text }; }
export function paragraph(...content: InlineNode[]): ParagraphBlock { return { type: "paragraph", content }; }
export function codeBlock(lang: string, code: string): CodeBlock { return { type: "code", lang, code }; }
export function ul(items: Array<InlineNode[] | DocBlock>): ListBlock { return { type: "list", ordered: false, items }; }
export function ol(items: Array<InlineNode[] | DocBlock>): ListBlock { return { type: "list", ordered: true, items }; }
export function table(headers: string[], rows: string[][]): TableBlock { return { type: "table", headers, rows }; }
export function apiTable(caption: string, rows: ApiRow[]): ApiTableBlock { return { type: "api-table", caption, rows }; }
export function callout(variant: CalloutBlock["variant"], content: InlineNode[], title?: string): CalloutBlock { return { type: "callout", variant, content, ...(title ? { title } : {}) }; }
export function linkGrid(items: LinkGridItem[]): LinkGridBlock { return { type: "link-grid", items }; }
export function hero(badge: string, title: string, subtitle: string, actions: HeroBlock["actions"]): HeroBlock { return { type: "hero", badge, title, subtitle, actions }; }
export function featureGrid(items: FeatureGridBlock["items"]): FeatureGridBlock { return { type: "feature-grid", items }; }
export const inlineCode = (text: string): InlineCode => ({ kind: "code", text });
export const link = (text: string, href: string): InlineLink => ({ kind: "link", text, href });
export const strong = (text: string): InlineStrong => ({ kind: "strong", text });
