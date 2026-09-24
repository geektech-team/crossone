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

`crossone init` creates a documented project skeleton. It does not install dependencies, initialize Git, create business CRUD modules, parse AI requirements, or enable native-client production support.
