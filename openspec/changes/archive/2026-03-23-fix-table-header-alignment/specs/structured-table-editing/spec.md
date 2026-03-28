## ADDED Requirements

### Requirement: 表头渲染必须遵循 delimiter row 的列对齐语义

在结构化表格内，delimiter row 中定义的列对齐规则 SHALL 同时作用于表头和数据行。表头可以保留 header 语义和加粗样式，但 MUST NOT 再依赖浏览器默认 `th` 居中行为覆盖列对齐语义。

#### Scenario: delimiter row 控制表头对齐

- **WHEN** 结构化表格的 delimiter row 分别使用 `:---`、`:---:`、`---:` 或 `---`
- **THEN** 对应列的表头与数据 cell SHALL 使用同一份列对齐规则
- **AND** `---` 对应的表头 SHALL 显式按左对齐渲染，而不是暴露默认居中样式

### Requirement: 表头需要主题感知的淡背景色

结构化表格的表头行 SHALL 保留轻微视觉强调，但这种强调 MUST 通过极淡背景色实现，并在 light / dark 主题下分别使用合适的弱对比色。该背景色 MUST 低于 active cell / selected cell 的视觉优先级。

#### Scenario: light 主题下表头具有淡背景色

- **WHEN** 编辑器使用 light 主题渲染结构化表格
- **THEN** 表头 cell SHALL 显示极淡背景色
- **AND** 该背景色 SHALL 不覆盖活动单元格的高亮边框与高亮底色

#### Scenario: dark 主题下表头具有淡背景色

- **WHEN** 编辑器使用 dark 主题渲染结构化表格
- **THEN** 表头 cell SHALL 显示适配 dark 背景的极淡背景色
- **AND** 该背景色 SHALL 不覆盖活动单元格的高亮边框与高亮底色
