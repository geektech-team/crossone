# crossone-app contributor rules

- Keep API contracts transport-safe.
- Clients must never import service implementation.
- Keep BackOne request context, database access, and secrets server-only.
- See docs/README.md for selected clients; validate mini-program/native output in platform tools.
- For requirement planning, read [.agents/skills/crossone-requirement/SKILL.md](.agents/skills/crossone-requirement/SKILL.md).
- Planning ends at a user-accepted package marked `planned`; that acceptance is not permission to implement.
