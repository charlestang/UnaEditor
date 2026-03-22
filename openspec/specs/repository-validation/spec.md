# repository-validation

## Purpose

定义仓库级验证基线，确保源码入口可以通过 TypeScript 类型检查，且主 OpenSpec 规范文档可以被当前 CLI 稳定校验。

## Requirements

### Requirement: 仓库源码入口必须通过 TypeScript 无输出检查

仓库 SHALL 支持在当前源码状态下运行 `tsc --noEmit`，且主包入口不得因 Vue SFC 模块解析失败而中断类型检查。

#### Scenario: 主包入口导出 Vue 组件

- **WHEN** TypeScript 检查 `src/index.ts` 中对 `./components/UnaEditor.vue` 的导出
- **THEN** 编译器 SHALL 将该文件识别为合法模块
- **AND** `tsc --noEmit` MUST NOT 因缺失 `.vue` 类型声明而失败

### Requirement: 主 OpenSpec specs 必须通过 CLI 校验

仓库主 `openspec/specs/` 下的规范文档 SHALL 满足当前 OpenSpec CLI 的结构要求，包括 `Purpose`、`Requirements`、`Requirement`、`Scenario` 以及规范性关键字要求。

#### Scenario: 校验主 specs

- **WHEN** 在仓库根目录运行 `openspec validate --specs`
- **THEN** CLI SHALL 成功通过所有主 spec 校验
- **AND** 输出 MUST NOT 包含 ERROR 级别的问题
