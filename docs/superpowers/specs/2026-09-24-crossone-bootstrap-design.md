# CrossOne Bootstrap Design

## Status and scope

This specification defines CrossOne's first deliverable: a Bun workspace monorepo whose CLI can create a working `crossone-app` project skeleton. It deliberately does not implement resource CRUD, AI requirement parsing, authentication, database access, or native-client generation.

The purpose is to validate the product boundary:

> CrossOne is a framework composed of packages. `crossone init` creates a separately structured business application.

Success means a developer can install the local or published CLI, execute `crossone init crossone-app`, and immediately receive a deterministic, installable Bun monorepo with documented Web admin, Web client, API, shared-contract, module, UI, configuration, tooling, and documentation locations.

## Constraints

- CrossOne itself is a Bun monorepo and contains framework code only under `packages/`.
- CrossOne must not contain framework-level `apps/`, `services/`, or `tooling/` directories.
- The generated `crossone-app` is a business-project monorepo and does contain `apps/`, `services/`, `packages/`, `tooling/`, and `docs/`.
- The generated API depends on `@geektech/backone`; generated Web clients depend on `transone`.
- The first stable CrossOne client target is Web. The scaffold must not claim native App support; its docs may name mini-program and native clients only as future additions.
- The command must never overwrite a non-empty target directory.
- Generated source must be plain TypeScript and Markdown, without AI credentials, hidden network calls, or code generation at install time.

## Framework workspace

The initial CrossOne repository has this layout:

```text
crossone/
├── packages/
│   ├── cli/                 # `crossone` executable and command parsing
│   ├── template-default/    # deterministic files for `crossone-app`
│   └── docs/                # framework package map and documentation sources
├── docs/superpowers/specs/
├── package.json
├── bunfig.toml
└── tsconfig.json
```

`@crossone/cli` owns the public command surface. `@crossone/template-default` owns the generated file map and has no filesystem side effects. `@crossone/docs` documents the responsibilities and public relationships of the framework packages. This keeps package responsibilities explicit before later packages such as `@crossone/core`, `@crossone/contract`, and AI generators are introduced.

## CLI contract

The only first-milestone command is:

```bash
crossone init <directory>
```

Rules:

- `<directory>` is required and is resolved relative to the current working directory.
- A missing argument prints command usage and exits non-zero.
- If the resolved directory exists and contains any entry, the command reports the path and exits non-zero without modifying it.
- If the directory does not exist, or exists and is empty, the command writes the default template.
- Completion prints the absolute created directory and the exact next commands: `cd <directory>`, `bun install`, and `bun run dev`.

No automatic package installation or Git initialization is performed. Those operations change user state and remain explicit follow-up commands.

## Generated application contract

`crossone init crossone-app` produces:

```text
crossone-app/
├── apps/
│   ├── admin-web/           # TransOne-based administrative Web client
│   └── client-web/          # TransOne-based consumer Web client
├── services/
│   └── api/                 # BackOne-based HTTP service
├── packages/
│   ├── config/              # shared TypeScript and workspace settings
│   ├── contracts/           # shared API contracts and error types
│   ├── modules/             # future vertical business modules
│   └── ui/                  # shared TransOne UI primitives
├── tooling/                 # project-local scripts and AI guidance entrypoints
├── docs/                    # package map and project-development guide
├── AGENTS.md                # concise instructions for AI contributors
├── package.json
├── bunfig.toml
└── tsconfig.json
```

The generated root workspace declares all five package groups. Its root scripts provide `dev`, `typecheck`, and `test` orchestration, even when the initial packages only provide placeholder-safe commands. Every generated package has a valid `package.json`, a clear package name under the `@crossone-app/` scope, and a small README or source entry that explains its boundary.

The generated `docs/README.md` is the outer documentation entry point. It links to every application and shared package, states allowed dependency directions, and distinguishes stable Web support from future targets.

## Dependency boundaries

```text
apps/admin-web, apps/client-web ─┬─> packages/contracts
                                 ├─> packages/ui
                                 └─> packages/modules
services/api ────────────────────┬─> packages/contracts
                                 └─> packages/modules
packages/modules ────────────────> packages/contracts
packages/ui ─────────────────────> transone
services/api ────────────────────> @geektech/backone
```

No application package may import service implementation code. Database connections, secrets, and BackOne request context stay server-side. Contracts contain only transport-safe types and schemas. The skeleton records these rules in both `docs/README.md` and `AGENTS.md` so human and AI contributors receive the same constraints.

## Error handling

The CLI exposes typed, user-readable failures for invalid arguments, non-empty destinations, permission failures while writing, and unexpected template inconsistencies. Expected command failures do not print a stack trace; unexpected failures do include a concise error message and non-zero exit status.

Template construction validates that every emitted relative path is non-empty, relative, and remains inside the selected target directory. This prevents a future template edit from writing outside a user-selected project.

## Verification

The implementation must include Bun tests that:

1. Assert the default template file map contains every required root, app, service, shared-package, tooling, and documentation file.
2. Run the CLI against a temporary empty destination and assert the created workspace structure and completion guidance.
3. Run the CLI against a non-empty destination and assert the existing file remains unchanged.
4. Run the CLI without a directory and assert non-zero usage failure.
5. Validate each generated `package.json` parses and that generated workspace globs include all required groups.
6. Run root type checking and tests after dependency installation.

The initial generated app is a scaffold, not proof that TransOne or BackOne production applications have been fully integrated. That integration is a subsequent, separately specified milestone.
