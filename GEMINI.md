# UnaEditor - Gemini CLI 协作指南

## 项目概述与上下文

本项目 (Una Editor) 是一个基于 CodeMirror 6 开发的 Vue 3 编辑器组件库，最终将被封装并发布为独立的 npm 包。

**此 `GEMINI.md` 文件中的指令是基础和强制性的，具有绝对优先权。**

## 技术栈与环境约束

- **框架**: Vue 3.5.25+ (Composition API)
- **语言**: TypeScript 5.9.3+ (必须启用严格模式)
- **构建工具**: Vite 7.3.1+ (Library Mode)
- **包管理器**: pnpm 10.30.3+ (使用 Workspace 机制管理主包与 playground)
- **测试框架**: Vitest + @vue/test-utils (jsdom 环境)
- **代码质量**: ESLint + Prettier

## 项目结构

```text
una-editor/
├── src/                    # 组件源码 (入口: index.ts)
├── playground/             # 本地调试与演示环境 (独立的 Vite 应用)
├── test/                   # 测试用例目录
├── dist/                   # 构建输出目录 (ESM + CommonJS, 请勿手动修改)
└── openspec/               # OpenSpec 变更管理目录
```

## Gemini CLI 工作流与技能 (Skills)

本项目强制使用 **OpenSpec** 进行结构化的变更管理。作为 Gemini CLI，你需要使用内置的 `activate_skill` 工具来调用对应的 OpenSpec 技能，替代传统的直接编码模式：

1. **探索/讨论需求**: 使用 `openspec-explore` 技能 (`activate_skill` -> `openspec-explore`)
2. **开启新变更**: 使用 `openspec-new-change` 技能 (`activate_skill` -> `openspec-new-change`)
3. **继续推进变更**: 使用 `openspec-continue-change` 技能生成下一个规范文档
4. **实现变更 (编码)**: 使用 `openspec-apply-change` 技能读取任务清单并执行
5. **验证变更**: 使用 `openspec-verify-change` 技能验证实现是否符合预期
6. **归档变更**: 使用 `openspec-archive-change` 技能完成并归档

*当用户提出例如“开始一个新功能”、“实现当前的变更”或“帮我探索一下这个 bug”时，请主动激活对应的 OpenSpec 技能进入专家工作流。*

## 语言与沟通规范

- **与用户沟通**: 必须使用**中文**。
- **项目文档** (README, 架构图等): 使用**中文**。
- **OpenSpec 产物 (Artifacts)**: 正文使用**中文**。规范和结构关键字（如 `SHALL`, `MUST`, `Requirement` 等）保留英文。同一个 change 内必须保持语言风格一致。
- **代码层面** (变量名、函数名、代码注释): 必须使用**英文**。
- **Git 提交信息**: 必须使用**英文**，并遵循 Conventional Commits 规范。

### Git 提交规范示例

必须是英文，格式为 `<type>: <subject>`，结尾无句号：
- `feat`: add Editor component with basic functionality
- `fix`: resolve TypeScript compilation error in index.ts
- `chore`: update vite to 7.3.1
- `refactor`: simplify component props interface

**Gemini 需注意**: 在准备 Git 提交前，必须运行 `git status`、`git diff HEAD` 等命令确认变更，并提供 Draft 提交信息给用户确认，不要自动提交（除非用户明确发出 commit 指令）。

## 编码规范与最佳实践

### TypeScript & Vue 组件
- **严格模式**: 不妥协的类型安全。优先使用 `interface`，尽量避免使用隐式的 `any`。
- **Vue 3**: 强制使用 Composition API (`<script setup lang="ts">`)。
- **Props**: 所有组件的 Props 必须有严谨的类型定义。
- **单一职责**: 保持函数和组件简短、单一职责，逻辑复杂时抽离到 `composables/` 或单独的文件中。

### 构建与测试
- **依赖管理**: `vue` 在主包中作为 `peerDependency`（外部依赖）。不要在主库中把 vue 锁定在 `dependencies` 中。
- **验证原则**: “未经验证的变更是不完整的”。在修改代码后，必须使用 `pnpm lint`、`pnpm test` 或通过 `playground` (本地开发服务器) 验证变更的有效性。
- **Playground 开发**: Playground 是一个独立的 Vite 应用 (`workspace:*` 引用主包)。开发新功能时，需确保能在 Playground 中正确演示与测试。

## 代理协作原则 (Gemini 专属)

1. **谋定而后动 (Research -> Strategy -> Execution)**: 在修改前充分使用 `grep_search` 和 `glob` 工具了解代码库结构和引用关系。
2. **委托子代理 (Sub-Agents)**: 对于大范围的重构、批量修改或高输出的任务，优先考虑使用 `generalist` 代理；对于复杂的全局架构分析，调用 `codebase_investigator` 代理。
3. **遵循 OpenSpec 流程**: 尽量不要越过 OpenSpec 直接修改大量业务逻辑代码，如果是较大的需求，引导用户走 OpenSpec 流程创建设计与任务单。
4. **解释你的意图**: 在运行修改文件系统、状态或执行高风险的 Shell 命令前，用简洁的一句话向用户解释你的目的。
