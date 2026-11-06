# CrossOne 文档站

[在线文档](https://geektech-team.github.io/crossone/) · [文档维护指南](https://geektech-team.github.io/crossone/docs/contributing/)

本站参考 TransOne 文档系统，以 `transone@^0.10.0` 和 `transone-cli@0.11.0` 构建。它是 CrossOne 框架的私有工作区子包，不参与 npm 发布；框架根目录仍只通过 `packages/*` 组织子包。

## 本地使用

在仓库根目录运行，使用 Bun 1.4.0（与 CI 一致）：

```sh
bun install --frozen-lockfile
bun run docs:dev                       # 本地开发，端口 52314
bun run docs:build                     # 生成 packages/docs/dist
bun run docs:verify                    # 校验 SSR 页面、链接、锚点、资源、包 homepage
bun run docs:preview                   # 预览静态产物
```

模拟正式站点的项目子路径：

```sh
bun run docs:build -- --base=/crossone/
bun run docs:verify -- --base=/crossone/
bun run docs:preview
```

预览服务的默认地址见终端输出，`HOST`、`PORT` 可覆盖监听配置；`DOCS_BASE` 可覆盖自动从首页读取的部署前缀。更换 base 后需重新构建。

## 内容与结构

- `src/content/`：类型化文档块、页面正文、统一路由表和分区导航。
- `src/components/`：顶栏、侧栏、正文和目录等页面渲染。
- `src/base.ts`：本地路径与 GitHub Pages 子路径处理。
- `src/main.ts`：客户端入口和按路由导出完整 HTML 的 SSR 入口。
- `src/styles.ts`：桌面和移动端共用样式。
- `transone.config.ts`：由路由表生成多页配置，`directoryPages: true`。
- `scripts/preview.ts`：静态预览，未找到的文件返回 404。
- `scripts/verify.ts`：构建产物与元数据链接检查。

新增页面时，在 `src/content/` 定义 `DocPage` 并登记到 `docsPages`。侧栏和构建路由都从这份列表派生。站内链接使用不含部署前缀的路径，例如 `/guide/getting-started`，由渲染器统一添加 `/crossone`。外链使用完整 HTTPS 地址。

导航包括快速开始、架构与九个客户端、BackOne 后端、AI 需求流程，以及以下五个子包的独立入口：

| 子包 | 文档入口 | 职责 |
| --- | --- | --- |
| `@crossone/cli` | `/cli/` | 应用初始化、需求包创建与只读校验 |
| `@crossone/template-default` | `/template/` | 确定性的应用文件模板 |
| `@crossone/requirement` | `/requirement/` | 需求包数据模型与结构校验 |
| `@crossone/skill-requirement` | `/skill/` | 可供 AI 工具读取的规划 Skill |
| `@crossone/docs` | `/docs/` | 本文档站与框架子包索引 |

文档需反映当前源码：生成应用拥有 `apps/`、`services/`、`tooling/`，框架根目录没有这些目录；小程序和 App 的开发命令提供 Web 预览，平台构建需要进一步在 IDE 和真机验证；需求校验不等于语义或实施验收。

## GitHub Pages

工作流：根目录 `.github/workflows/docs-pages.yml`。

1. 仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。
2. `main` 上文档、框架源码、锁文件及工作流的相关变更触发构建，也可在 Actions 手动运行。
3. CI 安装锁定依赖，运行类型检查和测试，以 `--base=/crossone/` 构建并校验静态页面。
4. 上传 `packages/docs/dist`，通过 `github-pages` 环境部署。

部署后的地址为 <https://geektech-team.github.io/crossone/>。静态站使用目录 `index.html`，嵌套文档 URL 可直接打开和刷新，无需 SPA 回退。构建产物受 Git 忽略，GitHub Actions 发布 artifact。

根 `package.json` 的 `homepage` 指向首页，各子包指向对应分区；`repository.directory` 指向包源码目录，`bugs` 指向仓库 Issues。四个可发布包的发布暂存清单保留这些字段。

参考：[GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
