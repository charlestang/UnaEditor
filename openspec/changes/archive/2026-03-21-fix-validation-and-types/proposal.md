## Why

当前仓库存在两个会打断维护流程的基础问题：`tsc --noEmit` 无法通过，且 `openspec validate --specs` 会因为主 spec 文档格式不符合 CLI 约定而整体失败。这两个问题会让类型回归检查和 OpenSpec 工作流校验失去可信度，应该先恢复到稳定可用状态。

## What Changes

- 修复 TypeScript 对 `src/components/UnaEditor.vue` 的模块解析问题，使源码入口在 `tsc --noEmit` 下可被正确检查。
- 整理主 `openspec/specs/` 下的 spec 文档结构，使其满足当前 OpenSpec CLI 对 `Purpose`、`Requirements`、`Requirement`、`Scenario` 的格式要求。
- 修复 `playground-sandbox` 等主 spec 中不满足 `SHALL` / `MUST` 约束的 requirement 文案。
- 补充验证，确保 `tsc --noEmit` 与 `openspec validate --specs` 都能通过。

## Capabilities

### New Capabilities

- `repository-validation`: 定义仓库级验证基线，包括 TypeScript 源码类型检查通过，以及主 OpenSpec specs 可被 CLI 成功校验。

### Modified Capabilities
<!-- None. This change restores repository validation guarantees without changing product-facing capability behavior. -->

## Impact

- 受影响代码包括 `src/vite-env.d.ts`、可能的 TypeScript 配置文件，以及 `openspec/specs/` 下多份主 spec 文档。
- 不引入新的运行时 API，但会恢复仓库级校验命令的稳定性。
