# CrossOne

CrossOne is a Bun and TypeScript framework workspace. Its packages provide the CLI, the default project template, and framework documentation.

## Local development

Framework npm release instructions: [PUBLISH.md](./PUBLISH.md). `bun run release --version 0.1.0 --dry-run` creates local tarballs only.

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

`crossone init` creates a runnable TransOne/BackOne starter with documented workspace dependencies. The command leaves dependency installation to you.

Interactive initialization displays nine client choices. Enter comma-separated numbers or names, `all` for every client, or `none` for API only; Enter selects mobile Web and PC Web. No administration client is generated.

Generated applications use `transone@^0.9.0` and `transone-cli@0.10.0`. Their configurations select the official `Platform` enum and build scripts pass canonical platform values:

| Client | Platform / build target |
| --- | --- |
| `client-web-phone` | `web-mobile` |
| `client-web-pc` | `web-pc` |
| `client-mini-weixin` | `miniprogram-weixin` |
| `client-mini-alipay` | `miniprogram-alipay` |
| `client-mini-bytedance` | `miniprogram-bytedance` |
| `client-mini-xiaohongshu` | `miniprogram-xiaohongshu` |
| `client-app-ios` | `app-ios` |
| `client-app-android` | `app-android` |
| `client-app-harmony` | `app-harmony` |

Non-interactive use requires an explicit selection or `--yes` to accept the default:

```bash
bun packages/cli/src/index.ts init demo --clients client-web-phone,client-mini-weixin
bun packages/cli/src/index.ts init demo-all --clients all
bun packages/cli/src/index.ts init api-only --clients none
bun packages/cli/src/index.ts init web-demo --yes
```

From the generated project root:

```bash
bun run dev:client-web-phone   # http://127.0.0.1:5173, when selected
bun run dev:client-web-pc      # http://127.0.0.1:5174, when selected
bun run dev:api     # http://127.0.0.1:3000/api/health
bun run debug:api   # API with Bun Inspector
bun run build      # Shared packages, selected client targets, and API bundle
bun run start:api  # Built API
```

Root scripts `dev:<client-id>` and `build:<client-id>` are generated only for selected clients. The API service and its commands remain the same. Web previews proxy `/api` to the API. Platform identities are separate from generator backends: client output remains `apps/<client-id>/dist/web`, `dist/mp-*`, or `dist/app-*`; the API bundle is `services/api/dist/index.js`. Mobile/PC previews select `web-mobile`/`web-pc`; mini-program/native `dev` explicitly selects `web` for preview, overriding the configured native target. Validate generated platform projects in their native development tools. The generated bilingual README lists the selected packages and commands.

To verify dependency installation, builds, and development commands in a disposable generated project from this framework checkout:

```bash
bun packages/template-default/scripts/verify-generated.ts
bun packages/template-default/scripts/verify-generated.ts --all-clients
bun packages/template-default/scripts/verify-generated.ts --api-only
```

## AI-assisted requirement planning

From the generated application root, create a requirement draft and validate it with the deterministic local checker:

```bash
crossone requirement create "Order Management"
crossone requirement validate "Order Management"
```

Run these commands from the generated application root with the CrossOne CLI available. CrossOne includes a portable Skill for Codex and compatible AI coding tools. The workflow does not call a model; it ends after the user reviews and accepts a plan marked `planned`. That acceptance does not authorize implementation, which requires a separate request.
