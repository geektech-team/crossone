import { callout, codeBlock, heading, link, linkGrid, paragraph, table, ul, type DocPage } from "./types";

export const projectPages: DocPage[] = [
  {
    path: "/project", title: "项目与边界", description: "基于现有前后端框架，把应用开发约定与 AI 协作连起来。", section: "project", order: -1,
    body: [
      paragraph("CrossOne 采用 Bun 和 TypeScript，以 TransOne 承载客户端，以 BackOne 承载 API。价值在于统一应用的包边界、依赖、命令、契约和需求上下文，帮助开发者和 AI 工具稳定地推进同一个业务目标。"),
      heading(2, "当前提供的能力"),
      table(["能力", "当前范围"], [["框架组织", "packages 下的 CLI、模板、需求模型、Skill、文档"], ["应用初始化", "九类客户端多选、仅 API、完整清单和运行脚本"], ["前后端示例", "计数器、健康接口、Web 代理与共享契约"], ["后端组装", "项目拥有的 Application 与显式 Module/Controller 注册"], ["AI 协作", "需求种子、可移植 Skill、只读结构校验与计划评审"], ["发布准备", "白名单包预演、暂存、打包与显式 npm 发布脚本"]]),
      heading(2, "后续扩展遵守的边界"),
      ul([["资源 CRUD、权限、数据库与管理页面需要具体设计和实现，当前骨架不会自动生成这些业务能力。"], ["CLI 不调用模型；AI 编码工具读取项目规范与 Skill，需求包保存可审阅的计划。"], ["多端构建产物需平台工具和真机验证，平台能力差异不能由 Web 预览代替。"], ["框架依赖升级应同步模板、生成示例、清单、锁文件、文档和相关验证。"]]),
      linkGrid([{ title: "发布框架包", description: "预演、权限、正式上传与恢复流程。", href: "/project/publishing" }, { title: "GitHub 源码", description: "查看真实实现、改动与问题记录。", href: "https://github.com/geektech-team/crossone" }]),
    ],
  },
  {
    path: "/project/publishing", title: "框架包发布", description: "先生成可检查产物，再显式发布四个框架 npm 包。", section: "project", order: 0,
    body: [
      paragraph("发布入口是根目录 PUBLISH.md 与 packages/cli/scripts/publish.ts。它发布 CrossOne 框架包，不部署 crossone-app，也不发布文档包。完整操作以", link("PUBLISH.md", "https://github.com/geektech-team/crossone/blob/main/PUBLISH.md"), "为准。"),
      heading(2, "范围和预演"),
      table(["顺序", "发布包"], [["1", "@crossone/requirement"], ["2", "@crossone/skill-requirement"], ["3", "@crossone/template-default"], ["4", "@crossone/cli"]]),
      codeBlock("sh", "bun install --frozen-lockfile\nbun run release:check\nbun run release --version 0.1.0 --dry-run"),
      paragraph("省略 --dry-run 仍是本地预演。每次在 packages/cli/dist/releases/<version>-<随机后缀>/ 下产生 packages、tarballs 和 release.json；输出不会覆盖旧预演。预演通过离线 npm pack 打包，不上传。"),
      paragraph("四包暂存清单使用同一个显式版本，内部 workspace 依赖只在暂存区改为精确版本。仓库清单中的 private/version、锁文件和生成应用自身的 workspace 约定不被全局重写。当前发布产物是 Bun-only 的 TypeScript 源码。"),
      heading(2, "正式上传"),
      codeBlock("sh", "# 该命令会上传 npm，先核对产物、scope 权限和认证\nbun run release --version 0.1.0 --publish --yes"),
      paragraph("正式发布要求干净 checkout、框架检查通过、npm 身份有效及四包版本尚不存在。发布按依赖顺序进行，失败即停止。脚本不创建 npm scope、不重命名包、不提交代码、不打 Git tag，也不自动撤回已经上传的包。"),
      callout("warn", ["@crossone scope 必须已存在，并授权当前账号发布。npm 登录成功不代表拥有 scope；Scope not found 应先核对组织与发布权限，不能把 dry-run 成功当作发布成功。"], "scope 与权限"),
      heading(2, "发布前验证"),
      codeBlock("sh", "bun packages/template-default/scripts/verify-generated.ts --all-clients\nbun packages/template-default/scripts/verify-generated.ts --api-only"),
      paragraph("完整生成验证会安装第三方依赖并启动本地服务；平台构建仍只是工程生成。应额外在仓库外安装四个 tarball 验收 CLI，再依据实际发布结果检查 registry。部分上传成功时，先核对日志和版本，用同次打包的 tarball 补发缺失包；源码发生变化则换新版本。"),
    ],
  },
];
