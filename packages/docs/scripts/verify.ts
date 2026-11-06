import { readFile, stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { docsPages, docRoutes } from "../src/content";

// Verify the actual static build, including project subpaths and package links.
const args = process.argv.slice(2).filter((arg) => arg !== "--");
const baseArg = args.find((arg) => arg.startsWith("--base="))?.slice(7) ?? "";
if (args.some((arg) => !arg.startsWith("--base="))) throw new Error("Usage: bun run docs:verify [--base=/crossone/]");
const base = baseArg.replace(/\/+$/, "");
const origin = "https://geektech-team.github.io";
const site = `${origin}${base}/`;
const root = resolve(import.meta.dir, "../dist");
const repository = resolve(import.meta.dir, "../../..");
const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const decode = (text: string) => text.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
let links = 0;

async function fileFor(url: URL): Promise<string> {
  const pathname = decodeURIComponent(url.pathname);
  if (base && pathname !== base && !pathname.startsWith(`${base}/`)) throw new Error(`Missing deployment base: ${url.href}`);
  const local = resolve(root, `.${pathname.slice(base.length) || "/"}`);
  if (local !== root && !local.startsWith(root + sep)) throw new Error(`Path escapes build: ${url.href}`);
  const info = await stat(local).catch(() => { throw new Error(`Broken link or asset: ${url.href}`); });
  return info.isDirectory() ? join(local, "index.html") : local;
}

if (new Set(docRoutes).size !== docRoutes.length) throw new Error("Duplicate documentation routes");
for (const page of docsPages) {
  const url = new URL(`${base}${page.path === "/" ? "/" : `${page.path}/`}`, origin);
  const html = await readFile(await fileFor(url), "utf8");
  if (!html.includes("<title>") || !html.includes(escape(page.title)) || !html.includes("CrossOne")) {
    throw new Error(`Missing prerendered content/title: ${page.path}`);
  }
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    const href = decode(match[1]);
    if (/^(mailto:|data:|tel:)/.test(href)) continue;
    const target = new URL(href, url);
    if (target.origin !== origin) continue;
    // Absolute public-site URLs must also work during a local root build.
    if (/^https?:/.test(href) && (target.pathname === "/crossone" || target.pathname.startsWith("/crossone/"))) {
      target.pathname = base + target.pathname.slice("/crossone".length);
    }
    const file = await fileFor(target);
    if (target.hash && file.endsWith(".html")) {
      const targetHtml = await readFile(file, "utf8");
      const anchor = escape(decodeURIComponent(target.hash.slice(1)));
      if (!targetHtml.includes(`id="${anchor}"`) && !targetHtml.includes(`id='${anchor}'`)) {
        throw new Error(`Missing anchor ${href} on ${page.path}`);
      }
    }
    links++;
  }
}

// Public metadata must point to pages that are actually built.
for (const id of ["cli", "template-default", "requirement", "skill-requirement", "docs"]) {
  const manifest = JSON.parse(await readFile(join(repository, "packages", id, "package.json"), "utf8"));
  const publicUrl = new URL(manifest.homepage);
  if (publicUrl.origin !== origin || !publicUrl.pathname.startsWith("/crossone/")) {
    throw new Error(`Package ${id} has an unexpected documentation origin/base: ${manifest.homepage}`);
  }
  const route = publicUrl.pathname.replace(/^\/crossone/, "").replace(/\/+$/, "") || "/";
  if (!docRoutes.includes(route)) throw new Error(`Package ${id} points to an unknown docs route: ${manifest.homepage}`);
  await fileFor(new URL(`${base}${route}/`, origin));
}
console.log(`PASS ${docsPages.length} prerendered pages, ${links} internal links/assets, and 5 package homepages (${site})`);
