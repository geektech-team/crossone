# CrossOne

CrossOne is a Bun and TypeScript framework workspace. Its packages provide the CLI, the default project template, and framework documentation.

## Local development

```bash
bun install
bun run typecheck
bun test
```

## Create an application

```bash
bun packages/cli/src/index.ts init crossone-app
cd crossone-app
bun install
bun run dev
```

`crossone init` creates a documented project skeleton. It does not install dependencies, initialize Git, or create business CRUD modules.

## AI-assisted requirement planning

From the generated application root, create a requirement draft and validate it with the deterministic local checker:

```bash
crossone requirement create "Order Management"
crossone requirement validate "Order Management"
```

Run these commands from the generated application root with the CrossOne CLI available. CrossOne includes a portable Skill for Codex and compatible AI coding tools. The workflow does not call a model; it ends after the user reviews and accepts a plan marked `planned`. That acceptance does not authorize implementation, which requires a separate request.
