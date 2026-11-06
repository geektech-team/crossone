import { apiTable, callout, codeBlock, heading, inlineCode, link, linkGrid, paragraph, table, ul, type DocPage } from "./types";

export const packagePages: DocPage[] = [
  {
    path: "/cli", title: "@crossone/cli", description: "CrossOne 的文件系统边界：初始化应用、创建需求包、运行校验。", section: "cli", order: -1,
    body: [
      paragraph("CLI 位于 packages/cli，Bun 入口是 src/index.ts，命令名为 crossone。它组合默认模板、需求模型和 Skill 文件，不承担业务代码生成模型或应用服务器的职责。"),
      codeBlock("sh", "# 从 CrossOne 框架根目录运行\nbun packages/cli/src/index.ts init ../my-app --yes\nbun packages/cli/src/index.ts init ../mobile-app --clients client-web-phone,client-mini-weixin"),
      heading(2, "命令职责"),
      table(["命令", "行为"], [["init <directory>", "校验目录与客户端选择，再写出所选应用模板"], ["requirement create <name>", "在当前目录的 docs/requirements 下创建 draft 需求包"], ["requirement validate <name>", "读取需求包并报告问题，不编辑需求文档或状态"]]),
      paragraph("初始化完成后按提示 cd 到应用目录，再自行 bun install。生成应用的 dev/build/start 脚本由相应工具运行，CrossOne CLI 不提供这些命令。"),
      linkGrid([{ title: "命令与参数", description: "交互选择、非交互用法、目录保护、错误退出和需求命名。", href: "/cli/commands" }]),
    ],
  },
  {
    path: "/cli/commands", title: "CLI 命令参考", description: "用显式参数获得可重复的初始化与需求操作。", section: "cli", order: 0,
    body: [
      heading(2, "init"),
      codeBlock("text", "crossone init <directory> [--clients <list|all|none>] [--yes]"),
      apiTable("初始化参数", [
        { name: "directory", type: "string", description: "必填。新目录或已有空目录，支持相对路径。" },
        { name: "--clients", type: "comma-separated IDs | all | none", description: "显式选择客户端，可用 --clients=value；all 全选，none 仅 API。" },
        { name: "--yes / -y", type: "boolean", description: "未提供 --clients 时选择默认手机 Web 与 PC Web；已有显式选择时保留该选择。" },
      ]),
      paragraph("在交互终端省略 --clients 与 --yes 时，提示多选客户端。输入编号或完整 ID，以逗号分隔；回车选择默认 1,2，all/a 全选，none/0 仅后端。非交互环境必须传 --clients 或 --yes。"),
      codeBlock("sh", "# 框架根目录：适用于脚本和 CI\nbun packages/cli/src/index.ts init ../api-only --clients none\nbun packages/cli/src/index.ts init ../all-clients --clients all\nbun packages/cli/src/index.ts init ../web --clients=client-web-pc"),
      heading(2, "初始化保护"),
      ul([["目标目录有任何文件（包含隐藏文件）就拒绝创建，不提供覆盖模式。"], ["先校验客户端和全部模板相对路径，再开始写模板。无效客户端或取消选择不会生成项目。"], ["重复客户端去重，并按官方客户端列表稳定排序。未知参数、多个目标目录、重复 --clients 返回错误。"], ["写入阶段的磁盘故障仍可能留下部分文件；命令会报告错误，检查目录后再重试。"]]),
      heading(2, "requirement create / validate"),
      codeBlock("text", "crossone requirement create <name>\ncrossone requirement validate <name>"),
      paragraph("这两个命令都以当前工作目录为应用根目录，不会自动搜索父目录。name 归一化为小写 ASCII slug，例如 Orders Search 变为 orders-search；使用英文短名最直接。包含斜杠、反斜杠或归一化为空的名称会失败。已有需求目录不会被覆盖。"),
      paragraph("创建成功输出需求路径；校验失败按文件输出问题，退出码为 1。校验成功输出 valid 和当前 draft/planned 状态。CLI 不提供自动把需求改为 planned 的命令。"),
      callout("tip", ["尚未安装 crossone 命令时，在应用根目录用 bun /absolute/path/crossone/packages/cli/src/index.ts requirement validate orders-search 运行，确保输出仍落在业务应用。"], "从源码使用需求命令"),
    ],
  },
  {
    path: "/template", title: "@crossone/template-default", description: "不访问文件系统的确定性模板，把客户端选择转成可审阅的文件集合。", section: "template", order: -1,
    body: [
      paragraph("该包位于 packages/template-default，负责生成内容；真正写入磁盘由 CLI 完成。相同客户端选项产生相同路径和文本，便于测试、审查与复用。"),
      heading(2, "使用模板 API"),
      codeBlock("ts", 'import { getDefaultTemplate, validateTemplatePath } from "@crossone/template-default";\n\nconst files = getDefaultTemplate({\n  clients: ["client-web-phone", "client-web-pc"],\n});\nfor (const file of files) {\n  validateTemplatePath(file.path);\n  // file.path 是项目内相对路径；file.content 是 UTF-8 文本。\n  // 由调用方检查目标根边界、非空目录和实际写入。\n}'),
      apiTable("主要导出", [
        { name: "getDefaultTemplate(options?)", type: "TemplateFile[]", description: "返回应用文件集合。省略 clients 使用默认两个 Web；[] 表示仅 API。" },
        { name: "validateTemplatePath(path)", type: "void", description: "拒绝不安全的模板路径；无效输入抛错。" },
        { name: "CLIENT_OPTIONS / DEFAULT_CLIENTS", type: "client definitions / ClientId[]", description: "客户端元数据与默认选择，Platform 来自 TransOne。" },
        { name: "normalizeClients / selectedClients", type: "selection helpers", description: "校验、去重并以稳定顺序返回客户端选择。" },
      ]),
      heading(2, "模板包含什么"),
      ul([["所选 apps、固定 services/api 和四个共享包，以及 Bun workspaces 与源码 exports。"], ["完整 dependencies/devDependencies、独立端调试、共享包/API/客户端构建和类型检查。"], ["中英文提示词 README、项目边界 AGENTS.md、文档与可移植需求规划 Skill。"], ["Application → HealthModule → HealthController 示例和健康接口测试。"]]),
      paragraph("当前模板依赖组合为 transone@^0.10.0、transone-cli@0.11.0、@geektech/backone@^0.4.0、@geektech/backone-cli@0.5.0，应用要求 Bun >=1.3.10。版本写在模板中，新建应用再由其锁文件固定解析结果。"),
      linkGrid([{ title: "生成应用脚本", description: "运行、调试、分包构建、端口与产物。", href: "/template/scripts" }, { title: "多端矩阵", description: "客户端身份、构建目标与平台验证。", href: "/guide/clients" }]),
    ],
  },
  {
    path: "/template/scripts", title: "生成应用的脚本", description: "在根目录协同开发，也能进入子包独立运行。", section: "template", order: 0,
    body: [
      table(["根脚本", "用途"], [["dev", "同时启动所选客户端 Web 预览与 API；仅 API 项目启动 API"], ["dev:<client-id>", "启动一个已选择客户端的 Web 开发预览"], ["build:<client-id>", "构建该客户端配置的目标平台"], ["dev:api / debug:api", "Bun watch 开发 / Inspector 调试 API"], ["build:packages", "构建 config、contracts、modules、ui 共享包"], ["build:api", "Bun 打包 services/api 到 dist/index.js"], ["build", "顺序构建共享包、所选客户端和 API"], ["start:api", "生产模式运行已构建 API"], ["backone:help", "查看已安装 BackOne CLI 的脚手架帮助"], ["typecheck / test", "TypeScript 检查 / Bun 测试"]]),
      codeBlock("sh", "# 在生成应用根目录\nbun run dev:client-web-pc\nbun run --cwd apps/client-web-pc dev\nbun run --cwd services/api debug\nbun run build:packages\nbun run build:api\nbun run start:api"),
      heading(2, "产物与部署"),
      paragraph("Web 产物位于 apps/<client>/dist/web，API 产物位于 services/api/dist/index.js。当前模板提供分开构建的客户端与 API；生产环境需自行配置静态托管和同源 /api 反向代理。根 build 不会自动部署到服务器。"),
      paragraph("小程序与 App 的 build 输出平台工程，开发预览使用 Web。共享代码可以复用，但平台权限、网络、签名与设备行为需要在对应工具中完成。"),
      heading(2, "修改端口"),
      codeBlock("sh", "PORT=3100 bun run dev:api\nCLIENT_WEB_PC_PORT=5200 API_URL=http://127.0.0.1:3100 bun run dev:client-web-pc"),
      paragraph("当两个终端分别运行时，为客户端提供与 API 端口一致的 API_URL。默认值来自 packages/config，完整客户端变量见", link("多端客户端", "/guide/clients"), "。"),
    ],
  },
  {
    path: "/requirement", title: "@crossone/requirement", description: "独立于 CLI 和文件系统的需求包模型与结构校验器。", section: "requirement", order: -1,
    body: [
      paragraph("该包只处理名称、文档文本和状态模型，不读取磁盘，不调用 AI。CLI 读取五个文件后将内容交给校验器；其他工具也可以复用同一套规则。"),
      codeBlock("ts", 'import { normalizeRequirementSlug, validateRequirementPackage } from "@crossone/requirement";\n\nconst slug = normalizeRequirementSlug("Orders Search"); // orders-search\nconst result = validateRequirementPackage(slug, {\n  brief: briefText,\n  context: contextText,\n  acceptance: acceptanceText,\n  plan: planText,\n  status: statusJsonText,\n});\n// result: { valid, status?, issues: [{ file, message }] }'),
      paragraph("示例中的五个 Text 变量由调用方提供，对应四个 Markdown 文件和 status.json 的原始内容。缺失文件可以省略，校验结果会报告 File is required。"),
      table(["导出", "职责"], [["normalizeRequirementSlug", "归一化名称；无效名称抛错"], ["validateRequirementPackage", "校验必需文件、内容结构与状态元数据"], ["RequirementStatus", "draft | planned"], ["RequirementDocuments", "brief/context/acceptance/plan/status 可选文本集合"], ["RequirementIssue", "文件名与问题信息"], ["RequirementStatusFile", "formatVersion 1 的状态记录类型"]]),
      callout("info", ["结构通过表示文档符合格式，不表示需求正确、代码已实现、验收已通过或用户已授权编码。"], "校验范围"),
      linkGrid([{ title: "校验规则", description: "必需标题、有效条目、时间戳和状态字段。", href: "/requirement/validation" }]),
    ],
  },
  {
    path: "/requirement/validation", title: "需求包校验规则", description: "保留必需英文小节标题，在正文中使用中文或英文描述真实需求。", section: "requirement", order: 0,
    body: [
      heading(2, "五个必需文件"),
      table(["文件", "必需小节标题"], [["brief.md", "Problem · Desired outcome · Scope boundaries"], ["context.md", "Project context · Affected areas · Assumptions · Open questions"], ["acceptance.md", "Acceptance criteria"], ["plan.md", "Implementation steps · Affected files and packages · Verification · Risks"], ["status.json", "合法 JSON 对象及全部元数据字段"]]),
      paragraph("Markdown 标题使用 # 到 ###### 均可，标题匹配不区分大小写。为了让校验器识别，保留上表英文标题；正文可用中文。每个小节必须有真实内容，只有 TODO、TBD、Fill this in、Describe here、N/A 等占位文本不能通过。没有未决问题或风险时可明确写 None known，并说明相关上下文。"),
      heading(2, "验收与计划条目"),
      codeBlock("md", "## Acceptance criteria\n- [ ] PC Web 用户输入订单号后，只看到匹配的订单。\n- [ ] 无权限用户收到明确的拒绝提示，响应不包含订单数据。\n\n## Implementation steps\n1. 核对现有订单契约和访问权限。\n2. 实现 API 过滤与 PC Web 查询交互。\n\n## Affected files and packages\n- services/api/src/modules/orders/\n- packages/contracts/\n- apps/client-web-pc/\n\n## Verification\n- 运行筛选与权限相关测试，检查空结果和请求失败。\n\n## Risks\n现有订单列表可能缺少可用于精确检索的唯一编号，实施前核对契约。"),
      paragraph("Acceptance criteria 至少需要一个非占位的 Markdown checkbox；Implementation steps、Affected files and packages、Verification 各自至少需要一条非占位列表。上面是相关小节示例，完整需求包仍需其他必需小节。"),
      heading(2, "状态元数据"),
      codeBlock("json", '{\n  "formatVersion": 1,\n  "slug": "order-search",\n  "status": "draft",\n  "createdAt": "2026-11-06T00:00:00.000Z",\n  "updatedAt": "2026-11-06T00:00:00.000Z",\n  "validationSummary": null\n}'),
      paragraph("slug 必须与目录名和归一化名称一致。status 仅支持 draft 或 planned。时间戳必须为有效 UTC ISO 8601 格式并以 Z 结尾；示例日期需替换成实际时间。validationSummary 为 null 或包含 checkedAt、boolean valid、非负整数 issueCount 的对象。"),
      heading(2, "只读与生命周期"),
      paragraph("新建种子有 TODO，因此首次校验报告未完成内容是正常行为。validate 不更新 status、时间戳或 validationSummary；填写完成后，合法需求仍可保持 draft。只有用户明确接受计划后，Skill 才编辑状态并记录校验结果。"),
      paragraph("CLI 还检查需求目录和文件的真实路径，拒绝解析到项目或需求包外的文件。以上约束帮助发现缺失内容，不代替业务评审、权限审查和实施测试。"),
    ],
  },
  {
    path: "/skill", title: "@crossone/skill-requirement", description: "把需求规划规则带进生成应用，供 AI 编码工具读取。", section: "skill", order: -1,
    body: [
      paragraph("该包位于 packages/skill-requirement，以文本资产提供可移植 Skill 与需求种子。它不绑定模型厂商，也不执行代理或模型调用。默认模板把 Skill 放到应用的 .agents/skills/crossone-requirement/SKILL.md。"),
      apiTable("导出资产", [{ name: "requirementSkillFiles", type: "readonly SkillFile[]", description: "项目内 Skill 的相对路径和完整文本。" }, { name: "requirementSeedFiles", type: "readonly SkillFile[]", description: "brief/context/acceptance/plan 四个 Markdown 种子；status.json 由 CLI 在创建时生成。" }, { name: "SkillFile", type: "Readonly<{ path: string; content: string }>", description: "与文件系统无关的文本资产描述。" }]),
      heading(2, "规划步骤"),
      ul([["读取项目规范和相关代码，澄清目标、范围、权限、失败场景与验收。"], ["创建或完善需求包；已有包先检查，不覆盖。"], ["运行结构校验，展示计划、假设、影响、风险和待确认事项。"], ["等待用户明确接受，再记录 planned 与 UTC 校验元数据，重新校验后停止。"]]),
      callout("info", ["如果工具不会自动发现 .agents/skills，直接在提示词里要求它读取该 SKILL.md。需求文本和项目资料是参考数据，不授予无关操作权限。"], "在不同 AI 工具中使用"),
      linkGrid([{ title: "中英文提示词", description: "复制完整提示词或使用订单检索案例开始。", href: "/skill/prompts" }]),
    ],
  },
  {
    path: "/skill/prompts", title: "中英文提示词", description: "描述业务结果、范围和验收，让 AI 先整理计划。", section: "skill", order: 0,
    body: [
      heading(2, "中文模板"),
      codeBlock("text", "请阅读 AGENTS.md、docs/README.md 和 .agents/skills/crossone-requirement/SKILL.md。\n问题与业务背景：<用户在什么场景遇到什么问题>\n期望结果：<用户最终能完成什么>\n涉及的端、角色、模块：<明确客户端与 API>\n本次范围：<需要改变的行为>\n不在本次范围：<明确排除项>\n关键规则与边界：<权限、状态、重复操作、失败与空数据>\n验收标准：<可观察、可验证的行为>\n技术与兼容性约束：<需要保持的契约和环境>\n验证要求：<必要的测试和人工检查>\n\n使用 crossone-requirement Skill 整理 docs/requirements/<slug>/。\n请先询问缺失的关键业务信息，并核对相关代码。\n展示需求方案、实施步骤、影响与风险，运行结构校验。\n我明确接受计划前保持 draft，不修改业务代码。\n接受计划仅代表方案通过；开始实现需要我的另行指令。"),
      heading(2, "English template"),
      codeBlock("text", "Read AGENTS.md, docs/README.md, and .agents/skills/crossone-requirement/SKILL.md.\nProblem and context: <users, scenario, and current pain>\nDesired outcome: <observable user result>\nAffected clients, roles, and modules: <clients and API>\nIn scope: <behavior to change>\nOut of scope: <explicit exclusions>\nRules and edge cases: <permissions, state, retries, errors, empty data>\nAcceptance criteria: <observable and checkable behavior>\nTechnical and compatibility constraints: <contracts and environment to preserve>\nVerification: <relevant tests and manual checks>\n\nUse the crossone-requirement Skill to prepare docs/requirements/<slug>/.\nAsk about missing critical product rules and inspect the relevant code first.\nShow the proposal, implementation steps, impact, and risks, then run validation.\nKeep the package draft until I explicitly accept the plan. Do not change business code.\nPlan acceptance approves the proposal only; implementation needs a separate instruction."),
      heading(2, "具体案例：订单检索"),
      paragraph("让请求落到真实行为上，例如：运营人员在 PC Web 按订单号精确检索。只改 PC Web 与订单查询 API，手机 Web 和小程序暂不调整；无权限时不返回订单数据，空结果展示清晰提示，请求失败允许重试。先核对当前订单契约、权限来源和分页规则，缺失的业务规则先询问。"),
      paragraph("需求包准备完成后，用“接受该计划，请将需求标记为 planned”完成规划。若准备编码，再明确说“现在按照已接受的计划开始实现，并完成约定的验证”。"),
      callout("tip", ["简单且明确的小改动可以直接描述目标、边界和验证。不要为了填满模板增加无关步骤；跨端、跨模块和规则较多的任务更适合需求包工作流。"], "按任务规模协作"),
    ],
  },
  {
    path: "/docs", title: "@crossone/docs", description: "框架文档与包地图，使用 TransOne 构建静态多页站点。", section: "docs", order: -1,
    body: [
      paragraph("本站位于 packages/docs，参考 TransOne 文档系统：结构化内容与统一路由表驱动页面，单一入口渲染页面正文，再由 transone-cli 生成可部署的 HTML。每个框架子包都有独立入口。"),
      heading(2, "本地开发与构建"),
      codeBlock("sh", "# CrossOne 框架根目录\nbun install --frozen-lockfile\nbun run docs:dev\nbun run docs:build\nbun run docs:preview"),
      paragraph("开发站点默认端口 52314。GitHub Pages 使用 /crossone/ 项目路径；本地构建部署形态可用 bun run docs:build -- --base=/crossone/。预览部署路径时设置 DOCS_BASE=/crossone/，然后访问预览地址的 /crossone/。"),
      heading(2, "文档与应用文档的区别"),
      paragraph("本站解释框架分包、CLI 与默认约定；生成应用的 README.md、docs/README.md、AGENTS.md 与 Skill 由 template-default 和 skill-requirement 生成。更新本站不会自动更新既有应用，也不会改变需求规划规则。"),
      linkGrid([{ title: "维护文档", description: "新增页面、核对链接、构建和部署。", href: "/docs/contributing" }]),
    ],
  },
  {
    path: "/docs/contributing", title: "维护文档站", description: "让内容、路由、包链接和真实实现同步。", section: "docs", order: 0,
    body: [
      heading(2, "新增页面"),
      olContent(),
      codeBlock("ts", 'import { heading, paragraph, type DocPage } from "./types";\n\nconst page: DocPage = {\n  path: "/guide/example",\n  title: "示例主题",\n  description: "说明该页解决的具体问题。",\n  section: "guide",\n  order: 10,\n  body: [heading(2, "使用方式"), paragraph("根据实际源码补充行为与示例。")],\n};\n// 再将页面加入 content/index.ts 的 docsPages 注册表。'),
      heading(2, "验证内容"),
      ul([["核对 CLI 参数、文件路径、版本、导出和脚本是否存在。"], ["站内链接使用不含 /crossone 的路由，交给 withDocBasePath 统一加部署前缀。"], ["新增子包时同时更新首页、分区导航、包地图和 package homepage。"], ["构建后检查首页与嵌套页面，确认刷新、目录链接和静态资源在 /crossone/ 下可用。"], ["变更应用约定时同时更新模板文案与示例，保留平台 IDE/设备验收边界。"]]),
      heading(2, "GitHub Pages"),
      paragraph(".github/workflows/docs-pages.yml 负责在默认分支相关文件更新时构建并部署，也支持手动运行。部署输出由 workflow 的 Pages artifact 提供，文档源码留在 packages/docs；生成产物不作为源码维护。"),
      paragraph("发布地址为", link("CrossOne 文档", "https://geektech-team.github.io/crossone/"), "。部署使用带目录的静态页面，子页面本身含有服务端生成的正文、标题与描述。"),
    ],
  },
];

function olContent() {
  return ul([
    ["在 src/content 中定义 DocPage，采用现有 block 构造函数组织正文。"],
    ["在 src/content/index.ts 注册页面。路由用于静态 pages 配置，侧边栏按分区与 order 排序。"],
    ["子包入口页使用 order: -1，其他页面在分区内使用稳定顺序。"],
  ]);
}
