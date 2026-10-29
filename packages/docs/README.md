# CrossOne framework packages

The CrossOne framework repository contains framework artifacts only under `packages/`.

- `@crossone/cli` owns the `crossone` command and creates application projects.
- `@crossone/template-default` owns the deterministic `crossone-app` file template.
- `@crossone/requirement` owns the requirement package model and deterministic validation rules.
- `@crossone/skill-requirement` owns the portable requirement-planning Skill and seed documents.
- `@crossone/docs` owns the framework package map and documentation sources.

CrossOne does not contain framework-level `apps/`, `services/`, or `tooling/` directories. Those are business-application concerns and are created by `crossone init`.

Initialization supports multi-select clients: mobile Web, PC Web, four mini-program platforms, and iOS/Android/Harmony App targets. Only selected client packages and root development/build commands are generated; no administration client is included. The BackOne API starter remains unchanged. Generated packages declare runtime dependencies, development tools, workspace source exports, type checks, and builds. Mini-program/native development commands provide Web previews; platform builds generate projects for validation in the platform tools. Model-independent requirement planning is included. Resource CRUD and native HTTP business integration remain separate work.

Client identities use the official `transone@^0.9.0` `Platform` enum. `transone-cli@0.10.0` receives canonical `web-mobile`, `web-pc`, `miniprogram-*`, and `app-*` values in build scripts and generated configurations. Backend generator/output names remain `web`, `mp-*`, and `app-*`. Mini-program/App development explicitly overrides the configured target with `web` for preview.

## AI-assisted requirement workflow

Inside a generated application, run:

```sh
crossone requirement create <name>
crossone requirement validate <name>
```

The first command creates a five-file draft package under `docs/requirements/<slug>/`; validation reports structural issues without editing the package. See the generated application's `docs/README.md` and `.agents/skills/crossone-requirement/SKILL.md` for the lifecycle and AI-assisted planning boundary.
