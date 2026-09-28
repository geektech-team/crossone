import { requirementSkillFiles } from "@crossone/skill-requirement";

export type TemplateFile = Readonly<{ path: string; content: string }>;

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export function validateTemplatePath(path: string): void {
  if (
    !path ||
    path.startsWith("/") ||
    path.startsWith("\\") ||
    path.split("/").includes("..") ||
    path.includes("\\")
  ) {
    throw new Error(`Invalid template path: ${path}`);
  }
}

export function getDefaultTemplate(): readonly TemplateFile[] {
  const files: TemplateFile[] = [
    {
      path: "package.json",
      content: json({
        name: "crossone-app",
        private: true,
        packageManager: "bun@1.3.0",
        workspaces: ["apps/*", "services/*", "packages/*", "tooling/*"],
        scripts: {
          dev: "bun --filter @crossone-app/admin-web --filter @crossone-app/client-web --filter @crossone-app/api run dev",
          typecheck: "bun --filter '*' run typecheck",
          test: "bun --filter '*' run test",
        },
      }),
    },
    { path: "bunfig.toml", content: "[install]\nexact = true\n" },
    {
      path: "tsconfig.json",
      content: json({
        compilerOptions: {
          strict: true,
          target: "ESNext",
          module: "Preserve",
          moduleResolution: "bundler",
          noEmit: true,
        },
      }),
    },
    {
      path: "apps/admin-web/package.json",
      content: json({
        name: "@crossone-app/admin-web",
        version: "0.0.0",
        private: true,
        type: "module",
        dependencies: { transone: "^0.4.0" },
        scripts: {
          dev: "echo 'Admin Web is ready for TransOne development.'",
          typecheck: "bunx tsc --noEmit",
          test: "bun test",
        },
      }),
    },
    {
      path: "apps/admin-web/src/index.ts",
      content: "export const clientKind = \"admin-web\";\n",
    },
    {
      path: "apps/client-web/package.json",
      content: json({
        name: "@crossone-app/client-web",
        version: "0.0.0",
        private: true,
        type: "module",
        dependencies: { transone: "^0.4.0" },
        scripts: {
          dev: "echo 'Client Web is ready for TransOne development.'",
          typecheck: "bunx tsc --noEmit",
          test: "bun test",
        },
      }),
    },
    {
      path: "apps/client-web/src/index.ts",
      content: "export const clientKind = \"client-web\";\n",
    },
    {
      path: "services/api/package.json",
      content: json({
        name: "@crossone-app/api",
        version: "0.0.0",
        private: true,
        type: "module",
        dependencies: { "@geektech/backone": "^0.1.2" },
        scripts: {
          dev: "echo 'API is ready for BackOne development.'",
          typecheck: "bunx tsc --noEmit",
          test: "bun test",
        },
      }),
    },
    {
      path: "services/api/src/index.ts",
      content: "export const serviceKind = \"api\";\n",
    },
    {
      path: "packages/contracts/package.json",
      content: json({
        name: "@crossone-app/contracts",
        version: "0.0.0",
        private: true,
        type: "module",
        scripts: { typecheck: "bunx tsc --noEmit", test: "bun test" },
      }),
    },
    {
      path: "packages/contracts/src/index.ts",
      content: "export type ApiError = Readonly<{ code: string; message: string }> ;\n",
    },
    {
      path: "packages/modules/package.json",
      content: json({
        name: "@crossone-app/modules",
        version: "0.0.0",
        private: true,
        type: "module",
        scripts: { typecheck: "bunx tsc --noEmit", test: "bun test" },
      }),
    },
    {
      path: "packages/modules/src/index.ts",
      content: "export const modules = [] as const;\n",
    },
    {
      path: "packages/ui/package.json",
      content: json({
        name: "@crossone-app/ui",
        version: "0.0.0",
        private: true,
        type: "module",
        dependencies: { transone: "^0.4.0" },
        scripts: { typecheck: "bunx tsc --noEmit", test: "bun test" },
      }),
    },
    {
      path: "packages/ui/src/index.ts",
      content: "export const uiPackage = \"@crossone-app/ui\";\n",
    },
    {
      path: "packages/config/package.json",
      content: json({
        name: "@crossone-app/config",
        version: "0.0.0",
        private: true,
        type: "module",
        scripts: { typecheck: "bunx tsc --noEmit", test: "bun test" },
      }),
    },
    {
      path: "packages/config/src/index.ts",
      content: "export const projectScope = \"@crossone-app\";\n",
    },
    {
      path: "tooling/README.md",
      content: "# Tooling\n\nPut project-local scripts and AI workflow helpers here.\n",
    },
    {
      path: "docs/README.md",
      content:
        "# crossone-app\n\n## Package map\n\n- `apps/admin-web`: Web administration client.\n- `apps/client-web`: Web consumer client.\n- `services/api`: BackOne API service.\n- `packages/contracts`: transport-safe API contracts.\n- `packages/modules`: vertical business modules.\n- `packages/ui`: shared TransOne UI primitives.\n- `packages/config`: shared project configuration.\n- `tooling`: project-local scripts and AI guidance.\n\n## Boundaries\n\nClients may import contracts, modules, and UI, but never API implementation. The API may import contracts and modules. Secrets and server context stay in `services/api`.\n\n## Targets\n\nWeb is the stable client target. Mini-program and native clients are future additions.\n",
    },
    {
      path: "AGENTS.md",
      content:
        "# crossone-app contributor rules\n\n- Keep API contracts transport-safe.\n- Clients must never import service implementation.\n- Keep BackOne request context, database access, and secrets server-only.\n- Treat Web as the stable target; mini-program and native support are future work.\n- For requirement planning, read [.agents/skills/crossone-requirement/SKILL.md](.agents/skills/crossone-requirement/SKILL.md).\n- Planning ends at a user-accepted package marked `planned`; that acceptance is not permission to implement.\n",
    },
  ];

  files.push(...requirementSkillFiles);
  for (const file of files) validateTemplatePath(file.path);
  return files;
}
