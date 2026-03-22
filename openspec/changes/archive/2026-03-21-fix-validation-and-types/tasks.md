## 1. TypeScript Validation

- [x] 1.1 修复 Vue SFC 的全局类型声明，使 `src/index.ts` 在 `tsc --noEmit` 下可被正确解析
- [x] 1.2 运行 `tsc --noEmit`，确认主包源码入口类型检查通过

## 2. OpenSpec Validation

- [x] 2.1 整理失败的主 spec 文档结构，补齐 `Purpose` / `Requirements` 顶层 section，并统一 requirement/scenario 关键字格式
- [x] 2.2 修复 `playground-sandbox` 等主 spec 中不满足 `SHALL` / `MUST` 约束的 requirement 文案
- [x] 2.3 运行 `openspec validate --specs`，确认主 specs 全量通过
