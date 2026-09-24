# CrossOne framework packages

The CrossOne framework repository contains framework artifacts only under `packages/`.

- `@crossone/cli` owns the `crossone` command and creates application projects.
- `@crossone/template-default` owns the deterministic `crossone-app` file template.
- `@crossone/docs` owns the framework package map and documentation sources.

CrossOne does not contain framework-level `apps/`, `services/`, or `tooling/` directories. Those are business-application concerns and are created by `crossone init`.
