import { getDefaultTemplate, validateTemplatePath, type TemplateOptions } from "@crossone/template-default";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

export type InitResult =
  | Readonly<{ ok: true; target: string }>
  | Readonly<{ ok: false; message: string }>;

const usage = "Usage: crossone init <directory> [--clients <list|all|none>] [--yes]";

export async function runInit(
  directory: string | undefined,
  cwd: string,
  options: TemplateOptions = {},
): Promise<InitResult> {
  if (!directory?.trim()) return { ok: false, message: usage };

  const target = resolve(cwd, directory);
  try {
    const entries = await readdir(target);
    if (entries.length > 0) {
      return { ok: false, message: `Target directory is not empty: ${target}` };
    }
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      return { ok: false, message: `Unable to inspect target directory: ${target}` };
    }
  }

  try {
    const files = getDefaultTemplate(options);
    for (const file of files) {
      validateTemplatePath(file.path);
      const destination = resolve(target, file.path);
      const fromTarget = relative(target, destination);
      if (fromTarget.startsWith("..") || isAbsolute(fromTarget)) {
        return { ok: false, message: `Template path escapes target: ${file.path}` };
      }
    }

    for (const file of files) {
      const destination = resolve(target, file.path);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, file.content, "utf8");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return { ok: false, message: `Unable to create CrossOne app: ${message}` };
  }

  return { ok: true, target };
}

export { usage };
