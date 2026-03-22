## Context

当前仓库的两条基础验证链路处于失效状态：

- `tsc --noEmit` 在 `src/index.ts` 处无法解析 `./components/UnaEditor.vue`
- `openspec validate --specs` 因多份主 spec 仍使用旧格式或非标准 requirement 文案而失败

这两个问题都不属于运行时功能 bug，但会直接降低维护质量：前者让源码入口缺少稳定的类型检查，后者让主 spec 无法作为当前 OpenSpec CLI 可消费的事实来源。

## Goals / Non-Goals

**Goals:**

- 恢复 `tsc --noEmit` 的通过能力
- 让主 `openspec/specs/` 全量通过 `openspec validate --specs`
- 在不改变既有产品行为语义的前提下，把主 spec 统一整理到当前 CLI 认可的格式

**Non-Goals:**

- 不修改运行时产品功能
- 不重写所有 spec 的内容表达，只做验证所需的结构化整理
- 不处理与本次失败无关的 lint、build 或发布流程问题

## Decisions

### 1. 通过统一的 `.vue` module declaration 修复 TypeScript 入口解析

在 `src/vite-env.d.ts` 中补充 `declare module '*.vue'`，让 TypeScript 能把 `src/index.ts` 中的 Vue SFC 导出识别为合法模块。

**Why:**

- 问题根因是仓库缺少 Vue SFC 的全局类型声明，而不是 `src/index.ts` 的导出方式本身有误
- 这是 Vue + TypeScript 工程的标准修复方式，影响面最小

### 2. 主 spec 统一采用 `Purpose` + `Requirements` 顶层结构

对主 `openspec/specs/` 中失败的文档统一整理为：

- `## Purpose`
- `## Requirements`
- `### Requirement: ...`
- `#### Scenario: ...`

同时保留原有 requirement 语义，不把主 spec 继续保留为 delta 风格的 `ADDED/MODIFIED Requirements` 结构。

**Why:**

- `openspec validate --specs` 直接要求主 spec 具备固定顶层 section
- 主 spec 是归档后的长期事实来源，应该是“合并后状态”，不是 change delta

### 3. 仅修补 validator 明确指出的问题，不扩大为 spec 内容重写

对 `playground-sandbox` 等 validator 指出的 requirement 文案问题做最小修正，例如把不满足要求的 `SHOULD` 改为 `SHALL`，并为过短或缺失的 `Purpose` 补足说明。

**Why:**

- 本次目标是恢复校验基线，不是进行文档风格统一运动
- 最小改动更容易验证，也不会无谓放大 review 面

## Risks / Trade-offs

- [Risk] 主 spec 整理时误改 requirement 语义
  → Mitigation: 优先做结构性调整，避免改动 requirement 的核心断言

- [Risk] 某些旧 spec 使用中文标题格式，转换后遗漏 validator 所需关键字
  → Mitigation: 统一改成 `Requirement` / `Scenario` / `WHEN` / `THEN` 标准关键词后再跑全量校验

- [Risk] `tsc --noEmit` 通过后暴露新的类型错误
  → Mitigation: 在补齐 `.vue` 声明后立即重跑命令，按真实错误继续收敛
