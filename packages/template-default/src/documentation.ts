import { clientPortVariable, type ClientDefinition } from "./clients";

export function clientGuide(clients: readonly ClientDefinition[]): string {
  const rows = clients.map((client) =>
    "| " + client.id + " | `" + client.platform + "` | `bun run dev:" + client.id + "` | `bun run build:" + client.id + "` | " + client.port + " | `apps/" + client.id + "/dist/" + client.target + "` |",
  ).join("\n");
  const ports = clients.map((client) => "`" + clientPortVariable(client) + "`").join(", ");
  return `## 启动与构建 / Development and builds

\`\`\`sh
bun install
bun run dev
bun run build
\`\`\`

初始化时选择的客户端如下。\`dev\` 同时启动这些客户端的 Web 开发预览和 API；\`build\` 构建共享包、所选客户端的目标产物和 API。根目录只提供已选择客户端的脚本。进入各应用目录也可以运行 \`bun run dev\` 和 \`bun run build\`。
The selected clients are listed below. \`dev\` starts their Web previews and the API together; \`build\` builds shared packages, the selected platform targets, and the API. Only selected clients have root scripts. Each application also provides local \`dev\` and \`build\` commands.

${clients.length ? "| 客户端 / Client | Platform | 开发预览 / Preview | 构建 / Build | 端口 / Port | 产物 / Output |\n| --- | --- | --- | --- | --- | --- |\n" + rows : "此项目只生成后端 / This project contains the API only."}

前端依赖为 \`transone@^0.9.0\` 和 \`transone-cli@0.10.0\`。各端 \`transone.config.ts\` 用官方 \`Platform\` 枚举指定默认目标；手机 Web 和 PC Web 分别使用 \`web-mobile\`、\`web-pc\`，小程序使用 \`miniprogram-*\`。平台身份与底层生成器分开，产物目录保留 \`dist/web\`、\`dist/mp-*\`、\`dist/app-*\`。
Frontend dependencies are \`transone@^0.9.0\` and \`transone-cli@0.10.0\`. Each \`transone.config.ts\` selects its default target with the official \`Platform\` enum. Mobile/PC Web use \`web-mobile\`/\`web-pc\`, and mini-programs use \`miniprogram-*\`. Platform identity is separate from the backend generator; output directories remain \`dist/web\`, \`dist/mp-*\`, and \`dist/app-*\`.

\`\`\`sh
bun run dev:api      # http://127.0.0.1:3000/api/health
bun run debug:api    # Bun Inspector
bun run build:api
bun run build:packages
bun run start:api    # services/api/dist/index.js
bun run typecheck
bun test
\`\`\`

手机 Web 与 PC Web 的开发服务器会将 \`/api\` 转发到 BackOne，可点击页面的 **Check API** 检查连通性。小程序和 App 的 \`dev\` 是 Web 预览，\`build\` 才生成对应平台的工程；这些工程需要在平台开发工具中配置应用 ID、签名并验证设备行为。原生 starter 使用计数器展示静态界面与事件，不自动生成原生 HTTP 业务实现。
Mobile and PC Web previews proxy \`/api\` to BackOne; click **Check API** to test connectivity. Mini-program and App \`dev\` commands are Web previews, while \`build\` generates the selected platform project. Configure application IDs/signing and validate device behavior in the platform tools. The native starter demonstrates static UI and counter events; native HTTP business integration is separate work.

默认端口定义在 \`packages/config\`。API 可用 \`PORT\` 覆盖端口；客户端可用 ${ports || "对应的端口环境变量"} 覆盖预览端口。自定义后端地址用 \`API_URL\`；小程序 \`mp.host\` 和 App \`app.host\` 同样写入 \`transone.config.ts\`。
Default ports live in \`packages/config\`. Override API \`PORT\` or the client port environment variables listed above. Set \`API_URL\` for a custom backend address; generated \`transone.config.ts\` also declares mini-program \`mp.host\` and App \`app.host\`.

Web 生产部署需托管 \`dist/web\` 静态产物，并将同源 \`/api\` 请求转发到 API。各包声明自己的运行时依赖和开发工具，共享包通过 \`workspace:*\` 与源码入口连接。
Host Web \`dist/web\` output with same-origin \`/api\` routing in production. Packages declare their runtime dependencies and development tools and share source through \`workspace:*\` dependencies.
`;
}

export function projectDocs(clients: readonly ClientDefinition[]): string {
  const map = clients.map((client) => "- `apps/" + client.id + "`: " + client.label + " (platform `" + client.platform + "`, backend `" + client.target + "`).").join("\n");
  return `# crossone-app

## Package map

${map}
- \`services/api\`: BackOne API service.
- \`packages/contracts\`: transport-safe API contracts.
- \`packages/modules\`: vertical business modules.
- \`packages/ui\`: shared TransOne UI primitives.
- \`packages/config\`: shared project configuration.
- \`tooling\`: project-local scripts and AI workflow helpers.

## Boundaries

Clients may import contracts, modules, and UI, but never API implementation. The API may import contracts and modules. Secrets and server context stay in \`services/api\`.

## Targets

Only the selected clients are generated. See the root README for their build targets, Web preview commands, and platform validation steps.

## AI-assisted requirement planning

CrossOne keeps the requirement workflow model-independent: it does not call a model or send project data to an external service. A compatible coding assistant can follow \`.agents/skills/crossone-requirement/SKILL.md\` to turn a request into a reviewable plan.

\`\`\`sh
crossone requirement create <name>
crossone requirement validate <name>
\`\`\`

Each package is stored under \`docs/requirements/<slug>/\` and contains \`brief.md\`, \`context.md\`, \`acceptance.md\`, \`plan.md\`, and \`status.json\`. New packages start as \`draft\`. Validation checks required headings, non-placeholder content, acceptance checkboxes, plan impact and verification items, and status metadata. It is read-only; a structurally valid package can still be \`draft\`.

The Skill asks the user to review the plan and unresolved decisions. Only after explicit acceptance does it mark the package \`planned\` and record validation metadata. Acceptance marks the plan as ready; it is not permission to implement. Implementation requires a separate request.
`;
}
