# crossone-app 提示词指南 / Prompting Guide

本指南帮助你向 Codex 或其他 AI 编码工具清楚地描述需求。你可以使用中文或英文；尽量提供真实业务背景和可验证的结果，而不只是指定要改哪个文件或采用什么实现方式。

## 启动与构建 / Development and builds

```sh
bun install
bun run dev
bun run build
```

初始化时选择的客户端如下。`dev` 同时启动这些客户端的 Web 开发预览和 API；`build` 构建共享包、所选客户端的目标产物和 API。根目录只提供已选择客户端的脚本。进入各应用目录也可以运行 `bun run dev` 和 `bun run build`。
The selected clients are listed below. `dev` starts their Web previews and the API together; `build` builds shared packages, the selected platform targets, and the API. Only selected clients have root scripts. Each application also provides local `dev` and `build` commands.

| 客户端 / Client | Platform | 开发预览 / Preview | 构建 / Build | 端口 / Port | 产物 / Output |
| --- | --- | --- | --- | --- | --- |
| client-web-phone | `web-mobile` | `bun run dev:client-web-phone` | `bun run build:client-web-phone` | 5173 | `apps/client-web-phone/dist/web` |
| client-web-pc | `web-pc` | `bun run dev:client-web-pc` | `bun run build:client-web-pc` | 5174 | `apps/client-web-pc/dist/web` |
| client-mini-weixin | `miniprogram-weixin` | `bun run dev:client-mini-weixin` | `bun run build:client-mini-weixin` | 5175 | `apps/client-mini-weixin/dist/mp-weixin` |
| client-mini-alipay | `miniprogram-alipay` | `bun run dev:client-mini-alipay` | `bun run build:client-mini-alipay` | 5176 | `apps/client-mini-alipay/dist/mp-alipay` |
| client-mini-bytedance | `miniprogram-bytedance` | `bun run dev:client-mini-bytedance` | `bun run build:client-mini-bytedance` | 5177 | `apps/client-mini-bytedance/dist/mp-bytedance` |
| client-mini-xiaohongshu | `miniprogram-xiaohongshu` | `bun run dev:client-mini-xiaohongshu` | `bun run build:client-mini-xiaohongshu` | 5178 | `apps/client-mini-xiaohongshu/dist/mp-xiaohongshu` |
| client-app-ios | `app-ios` | `bun run dev:client-app-ios` | `bun run build:client-app-ios` | 5179 | `apps/client-app-ios/dist/app-ios` |
| client-app-android | `app-android` | `bun run dev:client-app-android` | `bun run build:client-app-android` | 5180 | `apps/client-app-android/dist/app-android` |
| client-app-harmony | `app-harmony` | `bun run dev:client-app-harmony` | `bun run build:client-app-harmony` | 5181 | `apps/client-app-harmony/dist/app-harmony` |

前端依赖为 `transone@^0.9.0` 和 `transone-cli@0.10.0`。各端 `transone.config.ts` 用官方 `Platform` 枚举指定默认目标；手机 Web 和 PC Web 分别使用 `web-mobile`、`web-pc`，小程序使用 `miniprogram-*`。平台身份与底层生成器分开，产物目录保留 `dist/web`、`dist/mp-*`、`dist/app-*`。
Frontend dependencies are `transone@^0.9.0` and `transone-cli@0.10.0`. Each `transone.config.ts` selects its default target with the official `Platform` enum. Mobile/PC Web use `web-mobile`/`web-pc`, and mini-programs use `miniprogram-*`. Platform identity is separate from the backend generator; output directories remain `dist/web`, `dist/mp-*`, and `dist/app-*`.

```sh
bun run dev:api      # http://127.0.0.1:3000/api/health
bun run debug:api    # Bun Inspector
bun run build:api
bun run build:packages
bun run start:api    # services/api/dist/index.js
bun run typecheck
bun test
```

手机 Web 与 PC Web 的开发服务器会将 `/api` 转发到 BackOne，可点击页面的 **Check API** 检查连通性。小程序和 App 的 `dev` 是 Web 预览，`build` 才生成对应平台的工程；这些工程需要在平台开发工具中配置应用 ID、签名并验证设备行为。原生 starter 使用计数器展示静态界面与事件，不自动生成原生 HTTP 业务实现。
Mobile and PC Web previews proxy `/api` to BackOne; click **Check API** to test connectivity. Mini-program and App `dev` commands are Web previews, while `build` generates the selected platform project. Configure application IDs/signing and validate device behavior in the platform tools. The native starter demonstrates static UI and counter events; native HTTP business integration is separate work.

默认端口定义在 `packages/config`。API 可用 `PORT` 覆盖端口；客户端可用 `CLIENT_WEB_PHONE_PORT`, `CLIENT_WEB_PC_PORT`, `CLIENT_MINI_WEIXIN_PORT`, `CLIENT_MINI_ALIPAY_PORT`, `CLIENT_MINI_BYTEDANCE_PORT`, `CLIENT_MINI_XIAOHONGSHU_PORT`, `CLIENT_APP_IOS_PORT`, `CLIENT_APP_ANDROID_PORT`, `CLIENT_APP_HARMONY_PORT` 覆盖预览端口。自定义后端地址用 `API_URL`；小程序 `mp.host` 和 App `app.host` 同样写入 `transone.config.ts`。
Default ports live in `packages/config`. Override API `PORT` or the client port environment variables listed above. Set `API_URL` for a custom backend address; generated `transone.config.ts` also declares mini-program `mp.host` and App `app.host`.

Web 生产部署需托管 `dist/web` 静态产物，并将同源 `/api` 请求转发到 API。各包声明自己的运行时依赖和开发工具，共享包通过 `workspace:*` 与源码入口连接。
Host Web `dist/web` output with same-origin `/api` routing in production. Packages declare their runtime dependencies and development tools and share source through `workspace:*` dependencies.


## 中文版

### 提示词应包含什么

- **背景**：项目要解决什么问题，相关应用、用户或业务流程是什么。
- **目标**：用户最终应该能完成什么；描述期望结果，而不只是要求某种代码改动。
- **范围**：哪些端、角色、页面或模块需要变化；明确不在本次范围内的内容。
- **规则与边界情况**：权限、状态变化、校验、空数据、重复操作、失败和错误提示。
- **验收标准**：写成可以观察和验证的行为；需要时包含正常流程、异常流程和权限场景。
- **约束**：兼容性、性能、安全、现有技术栈、不能改变的行为，以及期望运行的测试或检查。

信息还不确定时，明确标注假设或问题，让 AI 先询问，不要让它自行补全重要业务规则。

### 可复制的需求提示词

```text
请先阅读 AGENTS.md、docs/README.md，以及 .agents/skills/crossone-requirement/SKILL.md，并遵循项目规范。
我想解决的问题：<用户和业务背景>
期望结果：<用户完成什么、看到什么>
涉及的端、角色或模块：<例如手机 Web、PC Web、小程序、App、API>
本次范围：<要做什么>
不在本次范围：<明确排除项>
关键规则和边界情况：<权限、校验、错误、空数据等>
验收标准：<可观察、可验证的结果>
技术或兼容性约束：<必须保留或遵循的约束>
验证要求：<相关测试、检查或手动验证>

如果关键信息缺失，请先问我。请先整理并校验需求方案，展示待确认问题和实施计划；在我明确接受计划前，不要标记为 planned，也不要修改业务代码。接受计划只表示方案通过，不代表授权开始实现。
```

### 建议的协作流程

对于有多个规则或跨模块影响的需求，使用 `crossone-requirement` Skill 创建并整理 `docs/requirements/<slug>/` 中的需求包。AI 应先澄清问题、检查相关代码、给出验收标准和实施计划，再运行 `crossone requirement validate <name>`。你审阅并接受计划后，需求才会标记为 `planned`。如需继续编码，请另行明确要求开始实现。

简单、明确的小改动可以直接描述目标、边界和验证方式；不要为了填满模板而增加无关细节。

## English Version

This guide helps you describe work clearly to Codex or another AI coding tool. Use English or Chinese. Provide real product context and verifiable outcomes instead of only naming files or prescribing an implementation.

### What to include in a prompt

- **Context**: The problem, relevant users, apps, and business workflow.
- **Goal**: What users should be able to do or observe—not merely which code should change.
- **Scope**: The clients, roles, screens, or modules in scope, plus explicit exclusions.
- **Rules and edge cases**: Permissions, state transitions, validation, empty data, repeated actions, failures, and error messages.
- **Acceptance criteria**: Observable behavior that can be checked, including success, failure, and permission cases where relevant.
- **Constraints**: Compatibility, performance, security, existing technologies, behavior that must not change, and expected tests or checks.

If important details are unknown, label them as assumptions or questions and ask the AI to clarify them instead of inventing business rules.

### Copyable requirement prompt

```text
First read AGENTS.md, docs/README.md, and .agents/skills/crossone-requirement/SKILL.md, and follow the project guidance.
Problem and business context: <users and background>
Desired outcome: <what users should be able to do or see>
Affected clients, roles, or modules: <for example mobile Web, PC Web, mini-program, App, API>
In scope: <what should change>
Out of scope: <what must not be included>
Rules and edge cases: <permissions, validation, errors, empty data, etc.>
Acceptance criteria: <observable, verifiable results>
Technical or compatibility constraints: <requirements to preserve>
Verification expectations: <relevant tests, checks, or manual verification>

Ask me about missing critical information. First organize and validate the requirement, then show open questions and the implementation plan. Do not mark it planned or change business code before I explicitly accept the plan. Plan acceptance approves the proposal only; it does not authorize implementation.
```

### Suggested collaboration flow

For requirements with multiple rules or cross-module impact, use the `crossone-requirement` Skill to create and refine a package under `docs/requirements/<slug>/`. The AI should clarify the request, inspect relevant code, define acceptance criteria and an implementation plan, and run `crossone requirement validate <name>`. The requirement becomes `planned` only after you review and accept the plan. If you want code changes, explicitly ask to start implementation in a separate request.

For a small, unambiguous change, state the goal, boundaries, and verification directly; do not add unrelated detail just to fill a template.
