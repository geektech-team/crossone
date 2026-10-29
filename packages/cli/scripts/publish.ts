#!/usr/bin/env bun
import { chmod, copyFile, mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const repository = resolve(import.meta.dir, "../../..");
const registry = "https://registry.npmjs.org/";
const packageIds = ["requirement", "skill-requirement", "template-default", "cli"] as const;
const packageNames = new Set(packageIds.map((id) => `@crossone/${id}`));
const usage = "Usage: bun run release --version <x.y.z[-prerelease]> [--tag <tag>] [--dry-run | --publish --yes]";
type Options = { version: string; tag: string; publish: boolean };
type Manifest = {
  name: string; version: string; type?: string; description?: string; license?: string;
  exports?: unknown; bin?: Record<string, string>;
  dependencies?: Record<string, string>; optionalDependencies?: Record<string, string>; peerDependencies?: Record<string, string>;
};

function optionsFor(args: string[]): Options {
  const values = new Map<string, string>();
  const flags = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    const key = args[i]!;
    if (["--publish", "--yes", "--dry-run"].includes(key)) {
      if (flags.has(key)) throw new Error(`Duplicate option: ${key}`);
      flags.add(key);
    } else if (key === "--version" || key === "--tag") {
      const value = args[++i];
      if (!value || value.startsWith("--") || values.has(key)) throw new Error(`Invalid option: ${key}`);
      values.set(key, value);
    } else throw new Error(`Unknown option: ${key}`);
  }
  const version = values.get("--version") ?? "";
  const numeric = "(?:0|[1-9][0-9]*)";
  const prerelease = "(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)";
  if (!new RegExp(`^${numeric}\\.${numeric}\\.${numeric}(?:-${prerelease}(?:\\.${prerelease})*)?$`).test(version)) {
    throw new Error(`Invalid version: ${version || "(missing)"}`);
  }
  const tag = values.get("--tag") ?? (version.includes("-") ? "next" : "latest");
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(tag) || (version.includes("-") && tag === "latest")) {
    throw new Error(`Invalid tag for version ${version}: ${tag}`);
  }
  const publish = flags.has("--publish");
  if (publish !== flags.has("--yes") || (publish && flags.has("--dry-run"))) {
    throw new Error("Real publication requires --publish --yes, without --dry-run; --yes alone is not supported.");
  }
  return { version, tag, publish };
}

async function execute(args: string[], cwd = repository) {
  const child = Bun.spawn(args, { cwd, stdin: "inherit", stdout: "pipe", stderr: "pipe" });
  const [code, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ]);
  return { code, stdout, stderr };
}

async function checked(args: string[], cwd = repository): Promise<string> {
  const result = await execute(args, cwd);
  if (result.code !== 0) throw new Error(`${args[0]} ${args[1] ?? ""} failed (${result.code})\n${result.stderr}\n${result.stdout}`);
  return result.stdout;
}

export async function runInteractiveCommand(args: string[], cwd: string): Promise<void> {
  // npm may ask for an OTP; do not hide its prompt behind captured pipes.
  const child = Bun.spawn(args, { cwd, stdin: "inherit", stdout: "inherit", stderr: "inherit" });
  const code = await child.exited;
  if (code !== 0) throw new Error(`${args[0]} ${args[1] ?? ""} failed (${code})`);
}

function registryDependencies(dependencies: Record<string, string> | undefined, version: string) {
  if (!dependencies) return undefined;
  return Object.fromEntries(Object.entries(dependencies).map(([name, range]) => {
    if (!range.startsWith("workspace:")) return [name, range];
    if (!packageNames.has(name)) throw new Error(`Unreleased workspace dependency: ${name}`);
    return [name, version];
  }));
}

async function copySources(source: string, destination: string): Promise<void> {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`Refusing source symlink: ${join(source, entry.name)}`);
    if (entry.isDirectory()) await copySources(join(source, entry.name), join(destination, entry.name));
    else if (entry.name.endsWith(".ts") && !/\.(test|spec)\.ts$/.test(entry.name)) {
      await copyFile(join(source, entry.name), join(destination, entry.name));
    }
  }
}

async function prepare(options: Options): Promise<string> {
  const base = join(repository, "packages/cli/dist/releases");
  await mkdir(base, { recursive: true });
  // Every attempt owns a new directory; failed runs never erase earlier artifacts.
  const directory = await mkdtemp(join(base, `${options.version}-`));
  console.log(`RELEASE_DIR=${directory}`);
  const tarballs = join(directory, "tarballs");
  await mkdir(tarballs);
  const packages: { name: string; tarball: string }[] = [];
  for (const id of packageIds) {
    const source = join(repository, "packages", id);
    const original = JSON.parse(await readFile(join(source, "package.json"), "utf8")) as Manifest;
    if (original.name !== `@crossone/${id}`) throw new Error(`Unexpected package identity in ${id}: ${original.name}`);
    const staging = join(directory, "packages", id);
    await copySources(join(source, "src"), join(staging, "src"));
    const manifest = {
      name: original.name, version: options.version, type: original.type ?? "module",
      description: original.description ?? `CrossOne ${id} package (Bun runtime required)`,
      ...(original.license ? { license: original.license } : {}),
      ...(original.exports ? { exports: original.exports } : {}),
      ...(original.bin ? { bin: original.bin } : {}),
      dependencies: registryDependencies(original.dependencies, options.version),
      optionalDependencies: registryDependencies(original.optionalDependencies, options.version),
      peerDependencies: registryDependencies(original.peerDependencies, options.version),
      files: ["src"], engines: { bun: ">=1.3.0" },
      publishConfig: { access: "public", registry },
    };
    await writeFile(join(staging, "package.json"), JSON.stringify(manifest, null, 2) + "\n");
    await writeFile(join(staging, "README.md"), `# ${original.name}\n\n${manifest.description}.\n\nThis package ships TypeScript source for Bun >= 1.3.0, not Node.js.\n\n` +
      (id === "cli" ? `\`\`\`sh\nbunx --bun @crossone/cli@${options.version} init my-app --yes\n\`\`\`\n` : "Part of the CrossOne framework. Install the matching @crossone/cli version to create an application.\n"));
    for (const filename of ["LICENSE", "LICENSE.md", "LICENSE.txt"]) {
      const packageLicense = join(source, filename);
      const rootLicense = join(repository, filename);
      if (await Bun.file(packageLicense).exists()) await copyFile(packageLicense, join(staging, filename));
      else if (await Bun.file(rootLicense).exists()) await copyFile(rootLicense, join(staging, filename));
    }
    for (const binary of Object.values(original.bin ?? {})) await chmod(join(staging, binary), 0o755);
    const packed = JSON.parse(await checked([
      "npm", "pack", "--offline", "--ignore-scripts", "--workspaces=false", "--json",
      "--pack-destination", tarballs, "--cache", join(directory, ".npm-cache"),
    ], staging)) as { filename: string; files: { path: string }[] }[];
    const pack = packed[0];
    if (!pack || packed.length !== 1 || !pack.filename.endsWith(".tgz")) throw new Error(`Invalid pack result: ${id}`);
    const paths = pack.files.map((file) => file.path);
    if (!paths.includes("src/index.ts") || paths.some((path) => /\.(test|spec)\.ts$/.test(path))) {
      throw new Error(`Incomplete or unsafe archive for ${id}`);
    }
    packages.push({ name: original.name, tarball: `tarballs/${pack.filename}` });
    console.log(`Packed ${original.name}@${options.version}`);
  }
  await writeFile(join(directory, "release.json"), JSON.stringify({
    version: options.version, tag: options.tag, registry, packages,
  }, null, 2) + "\n");
  return directory;
}

async function publish(options: Options, directory: string): Promise<void> {
  // Complete all read-only preflight checks before the first registry write.
  const dirty = await checked(["git", "status", "--porcelain", "--untracked-files=normal"]);
  if (dirty.trim()) throw new Error("Real publication requires a clean Git checkout. Commit/review or ignore unrelated files first.");
  console.log("Checking types and framework tests...");
  await checked([process.execPath, "run", "typecheck"]);
  await checked([process.execPath, "test", "packages"]);
  await checked(["npm", "whoami", "--registry", registry]);
  const release = JSON.parse(await readFile(join(directory, "release.json"), "utf8")) as {
    packages: { name: string; tarball: string }[];
  };
  for (const pkg of release.packages) {
    const existing = await execute(["npm", "view", `${pkg.name}@${options.version}`, "version", "--json", "--registry", registry]);
    if (existing.code === 0) throw new Error(`Version already exists: ${pkg.name}@${options.version}`);
    if (!/E404/.test(existing.stdout + existing.stderr)) throw new Error(`Cannot check registry version for ${pkg.name}: ${existing.stderr}`);
  }
  for (const pkg of release.packages) {
    console.log(`Publishing ${pkg.name}@${options.version} (${options.tag})...`);
    await runInteractiveCommand(["npm", "publish", join(directory, pkg.tarball), "--ignore-scripts", "--access", "public", "--tag", options.tag, "--registry", registry], directory);
    console.log(`Published ${pkg.name}@${options.version}`);
  }
}

if (import.meta.main) {
  try {
    if (process.argv.slice(2).includes("--help")) console.log(usage);
    else {
      const options = optionsFor(process.argv.slice(2));
      const directory = await prepare(options);
      if (options.publish) await publish(options, directory);
      else console.log("Dry run: local tarballs only. No npm login or registry writes. Use --publish --yes to upload.");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(usage);
    process.exitCode = 1;
  }
}
