# crossone-app contributor rules

- Keep API contracts transport-safe.
- Clients must never import service implementation.
- Keep BackOne request context, database access, and secrets server-only.
- Group API features under services/api/src/modules/<feature>; the project-owned Application composes modules and owns initialize/start/stop.
- Import server APIs from @geektech/backone and standard decorators from @geektech/backone/decorators; require Bun >=1.3.10 and keep legacy decorator flags disabled.
- See docs/README.md for selected clients; validate mini-program/native output in platform tools.
- For requirement planning, read [.agents/skills/crossone-requirement/SKILL.md](.agents/skills/crossone-requirement/SKILL.md).
- Planning ends at a user-accepted package marked `planned`; that acceptance is not permission to implement.
