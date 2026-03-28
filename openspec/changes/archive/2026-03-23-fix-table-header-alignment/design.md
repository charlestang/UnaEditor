## Context

当前表格模型已经通过 `parseAlignments()` 把 delimiter row 解析成 `table.alignments`，并在新增 / 删除列时持续保留这份对齐信息。但 `StructuredTableWidget.buildDataRow()` 在构造 `th` / `td` 时完全没有使用 `table.alignments`，因此：

- `td` 没有显式对齐样式，浏览器通常会表现为左对齐
- `th` 则会暴露浏览器默认样式，表现为加粗且居中

这导致“表头与数据列不共享同一份列对齐语义”的问题。

## Goals / Non-Goals

**Goals**

- 让 delimiter row 中的对齐规则同时作用于表头和数据行
- 保留表头的语义强调，但不再让 `th` 默认居中覆盖语法定义
- 给表头增加一层极淡的、主题感知的背景色

**Non-Goals**

- 不改变 delimiter row 的解析和序列化规则
- 不引入新的表头专用 Markdown 语法
- 不调整表头的编辑模型或结构操作模型

## Decisions

### 1. 列对齐是“列级语义”，必须同时作用于表头和数据行

**决策**：渲染层直接读取 `table.alignments[cell.col]`，并把结果应用到当前列的 `th` / `td` 上。即使是表头，也不能绕过这份列对齐信息。

**结果**

- `:---` 对应左对齐
- `:---:` 对应居中
- `---:` 对应右对齐
- `---` / `none` 也显式落到左对齐，用来覆盖浏览器对 `th` 的默认居中行为

### 2. 表头强调保留为“加粗 + 极淡背景色”，而不是“统一居中”

**决策**：表头仍保留 `font-weight` 作为语义强调，但视觉区分改为极淡背景色，不再依赖默认 `th` 居中。

**结果**

- light 主题下使用一层接近浅灰蓝的极淡背景
- dark 主题下使用一层接近石板灰的极淡背景
- 背景色必须足够轻，不与 active / selected / overlay 态抢主视觉

### 3. 主题感知优先通过 CodeMirror 主题 class 完成

**决策**：表头背景色继续写在 `STRUCTURED_TABLE_THEME` 中，通过默认样式覆盖 light 主题，再用 `.cm-dark` 选择器覆盖 dark 主题。

**理由**

- 当前编辑器已经通过 `oneDark` 在 dark 主题下给 `.cm-editor` 打主题 class
- 这条路径不需要为表格单独引入新的 prop 或状态传递

## Verification Strategy

- 自动化测试验证：
  - 表头列对齐与对应数据列对齐一致
  - `none` 对齐时表头不会再默认居中
  - light / dark 主题下表头背景色都不是透明
- 手工验证确认：
  - `| :--- | :---: | ---: |` 下三列表头分别左、中、右对齐
  - light / dark 下表头背景只做轻微强调，不压过 active cell 样式
