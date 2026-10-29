# crossone-app

## Package map

- `apps/client-web-phone`: 手机 Web / Mobile Web (platform `web-mobile`, backend `web`).
- `apps/client-web-pc`: PC Web (platform `web-pc`, backend `web`).
- `apps/client-mini-weixin`: 微信小程序 / WeChat (platform `miniprogram-weixin`, backend `mp-weixin`).
- `apps/client-mini-alipay`: 支付宝小程序 / Alipay (platform `miniprogram-alipay`, backend `mp-alipay`).
- `apps/client-mini-bytedance`: 抖音小程序 / ByteDance (platform `miniprogram-bytedance`, backend `mp-bytedance`).
- `apps/client-mini-xiaohongshu`: 小红书小程序 / Xiaohongshu (platform `miniprogram-xiaohongshu`, backend `mp-xiaohongshu`).
- `apps/client-app-ios`: iOS App (platform `app-ios`, backend `app-ios`).
- `apps/client-app-android`: Android App (platform `app-android`, backend `app-android`).
- `apps/client-app-harmony`: HarmonyOS App (platform `app-harmony`, backend `app-harmony`).
- `services/api`: BackOne API service.
- `packages/contracts`: transport-safe API contracts.
- `packages/modules`: vertical business modules.
- `packages/ui`: shared TransOne UI primitives.
- `packages/config`: shared project configuration.
- `tooling`: project-local scripts and AI workflow helpers.

## Boundaries

Clients may import contracts, modules, and UI, but never API implementation. The API may import contracts and modules. Secrets and server context stay in `services/api`.

## Targets

Only the selected clients are generated. See the root README for their build targets, Web preview commands, and platform validation steps.

## AI-assisted requirement planning

CrossOne keeps the requirement workflow model-independent: it does not call a model or send project data to an external service. A compatible coding assistant can follow `.agents/skills/crossone-requirement/SKILL.md` to turn a request into a reviewable plan.

```sh
crossone requirement create <name>
crossone requirement validate <name>
```

Each package is stored under `docs/requirements/<slug>/` and contains `brief.md`, `context.md`, `acceptance.md`, `plan.md`, and `status.json`. New packages start as `draft`. Validation checks required headings, non-placeholder content, acceptance checkboxes, plan impact and verification items, and status metadata. It is read-only; a structurally valid package can still be `draft`.

The Skill asks the user to review the plan and unresolved decisions. Only after explicit acceptance does it mark the package `planned` and record validation metadata. Acceptance marks the plan as ready; it is not permission to implement. Implementation requires a separate request.
