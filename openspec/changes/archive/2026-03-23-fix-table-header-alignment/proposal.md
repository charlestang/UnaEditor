## Why

当前结构化表格已经能解析 delimiter row 中的列对齐语义，但渲染层没有把这份对齐信息真正应用到 `th` / `td`。结果是表头继续暴露浏览器默认的 `th` 样式，表现为统一加粗且居中，与 GFM 表格语法 `| :--- | :---: | ---: |` 的真实语义不一致。

同时，表头行目前与数据行几乎没有视觉层级差异。用户希望保留表头语义的轻微强调，但不要破坏列对齐规则；更合适的方式是保留加粗，并增加一层极淡、主题感知的背景色。

## What Changes

- 修改 `structured-table-editing` 能力：delimiter row 中定义的列对齐规则必须同时作用于表头和数据行，而不能只依赖浏览器默认 `th` 对齐。
- 新增表头视觉规则：表头继续保留 header 语义和适度加粗，但在 light / dark 主题下都增加一层极淡背景色。
- 补充自动化回归，覆盖表头对齐与表头背景色的渲染行为。

## Capabilities

### Modified Capabilities

- `structured-table-editing`: 修改结构化表格表头的渲染规则，使其遵循 delimiter row 的列对齐语义，并增加主题感知的淡背景色。

## Impact

- 受影响代码主要在 [src/extensions/structuredTable.ts](/Users/charles/Projects/una-editor/src/extensions/structuredTable.ts) 的表格 DOM 构建与主题样式。
- 现有 [src/extensions/structuredTableModel.ts](/Users/charles/Projects/una-editor/src/extensions/structuredTableModel.ts) 的 alignment 解析逻辑可以继续复用，不需要改动底层表格模型。
- 需要补充 [test/UnaEditor.test.ts](/Users/charles/Projects/una-editor/test/UnaEditor.test.ts) 中的结构化表格渲染测试。
