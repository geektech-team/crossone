import { callout, featureGrid, hero, linkGrid, type DocPage } from "./types";

export const homePage: DocPage = {
  path: "/",
  title: "CrossOne 文档",
  description: "面向 AI 协作开发的 Bun + TypeScript 全栈框架：多端客户端、BackOne API、可审阅的需求包。",
  section: "home",
  order: -1,
  body: [
    hero("Bun · TypeScript · AI 协作", "从需求到多端应用", "CrossOne 用统一的项目约定连接 TransOne 客户端、BackOne API 与共享业务包，让开发者和 AI 编码工具在同一份上下文中协作。", [
      { label: "快速开始", href: "/guide/getting-started", primary: true },
      { label: "AI 需求工作流", href: "/guide/ai-workflow" },
      { label: "GitHub", href: "https://github.com/geektech-team/crossone" },
    ]),
    featureGrid([
      { title: "统一的开发起点", description: "Bun 驱动前后端开发、类型检查与构建，应用包各自声明依赖与脚本。" },
      { title: "按需选择客户端", description: "手机 Web、PC Web、四类小程序和三个 App 目标，可自由组合，也可只生成 API。" },
      { title: "让需求可审阅", description: "使用可移植 Skill 把自然语言需求整理成五文件需求包，在编码前明确规则、验收与计划。" },
    ]),
    linkGrid([
      { title: "开发指南", description: "初始化、项目结构、多端矩阵、后端组织和 AI 协作流程。", href: "/guide" },
      { title: "@crossone/cli", description: "项目初始化，以及需求包创建与只读校验命令。", href: "/cli" },
      { title: "@crossone/template-default", description: "确定性的应用模板、客户端配置、运行脚本与文件边界。", href: "/template" },
      { title: "@crossone/requirement", description: "需求数据模型、名称归一化与独立的结构校验规则。", href: "/requirement" },
      { title: "@crossone/skill-requirement", description: "面向 Codex 和其他编码工具的需求规划 Skill 与种子文档。", href: "/skill" },
      { title: "@crossone/docs", description: "本站的内容、路由、静态构建和 GitHub Pages 部署约定。", href: "/docs" },
    ]),
    callout("info", ["当前提供应用骨架、开发与构建脚本、需求规划流程。资源 CRUD 自动生成、CLI 内调用模型，以及小程序和 App 的平台验收都不属于已完成能力。"], "当前能力边界"),
  ],
};
