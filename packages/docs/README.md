# CrossOne framework packages

The CrossOne framework repository contains framework artifacts only under `packages/`.

- `@crossone/cli` owns the `crossone` command and creates application projects.
- `@crossone/template-default` owns the deterministic `crossone-app` file template.
- `@crossone/requirement` owns the requirement package model and deterministic validation rules.
- `@crossone/skill-requirement` owns the portable requirement-planning Skill and seed documents.
- `@crossone/docs` owns the framework package map and documentation sources.

CrossOne does not contain framework-level `apps/`, `services/`, or `tooling/` directories. Those are business-application concerns and are created by `crossone init`.

The current workflow provides application scaffolding plus model-independent AI-assisted requirement planning. It creates and validates requirement documents but does not call a model or implement business code. Resource CRUD and native-client production support are separate future milestones.

## AI-assisted requirement workflow

Inside a generated application, run:

```sh
crossone requirement create <name>
crossone requirement validate <name>
```

The first command creates a five-file draft package under `docs/requirements/<slug>/`; validation reports structural issues without editing the package. See the generated application's `docs/README.md` and `.agents/skills/crossone-requirement/SKILL.md` for the lifecycle and AI-assisted planning boundary.
