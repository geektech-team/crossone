import { requirementSkillFiles } from "@crossone/skill-requirement";
import { getRuntimeTemplate } from "./runtime";
import { selectedClients, type TemplateOptions } from "./clients";
import { clientGuide, projectDocs } from "./documentation";

export type TemplateFile = Readonly<{ path: string; content: string }>;

export function validateTemplatePath(path: string): void {
  if (
    !path ||
    path.startsWith("/") ||
    path.startsWith("\\") ||
    path.split("/").includes("..") ||
    path.includes("\\")
  ) {
    throw new Error(`Invalid template path: ${path}`);
  }
}

export function getDefaultTemplate(options: TemplateOptions = {}): readonly TemplateFile[] {
  const clients = selectedClients(options);
  const files: TemplateFile[] = [
    ...getRuntimeTemplate(options),
    {
      path: "tooling/README.md",
      content: "# Tooling\n\nPut project-local scripts and AI workflow helpers here.\n",
    },
    {
      path: "README.md",
      content: `# crossone-app 提示词指南 / Prompting Guide

本指南帮助你向 Codex 或其他 AI 编码工具清楚地描述需求。你可以使用中文或英文；尽量提供真实业务背景和可验证的结果，而不只是指定要改哪个文件或采用什么实现方式。

${clientGuide(clients)}

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

\`\`\`text
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
\`\`\`

### 建议的协作流程

对于有多个规则或跨模块影响的需求，使用 \`crossone-requirement\` Skill 创建并整理 \`docs/requirements/<slug>/\` 中的需求包。AI 应先澄清问题、检查相关代码、给出验收标准和实施计划，再运行 \`crossone requirement validate <name>\`。你审阅并接受计划后，需求才会标记为 \`planned\`。如需继续编码，请另行明确要求开始实现。

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

\`\`\`text
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
\`\`\`

### Suggested collaboration flow

For requirements with multiple rules or cross-module impact, use the \`crossone-requirement\` Skill to create and refine a package under \`docs/requirements/<slug>/\`. The AI should clarify the request, inspect relevant code, define acceptance criteria and an implementation plan, and run \`crossone requirement validate <name>\`. The requirement becomes \`planned\` only after you review and accept the plan. If you want code changes, explicitly ask to start implementation in a separate request.

For a small, unambiguous change, state the goal, boundaries, and verification directly; do not add unrelated detail just to fill a template.
`,
    },
    {
      path: "docs/README.md",
      content: projectDocs(clients),
    },
    {
      path: "AGENTS.md",
      content:
        "# crossone-app contributor rules\n\n- Keep API contracts transport-safe.\n- Clients must never import service implementation.\n- Keep BackOne request context, database access, and secrets server-only.\n- See docs/README.md for selected clients; validate mini-program/native output in platform tools.\n- For requirement planning, read [.agents/skills/crossone-requirement/SKILL.md](.agents/skills/crossone-requirement/SKILL.md).\n- Planning ends at a user-accepted package marked `planned`; that acceptance is not permission to implement.\n",
    },
  ];

  files.push(...requirementSkillFiles);
  for (const file of files) validateTemplatePath(file.path);
  return files;
}
