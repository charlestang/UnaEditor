## ADDED Requirements

### Requirement: 主题消费者必须共享同一份解析后的主题结果

对于每个已挂载的编辑器实例，组件壳层中的表面样式消费者、结构化表格相关主题消费者、CodeMirror chrome theme、内容主题以及任何依赖主题基线的派生默认值（例如 `codeTheme='auto'`）MUST 共享同一份解析后的主题结果。运行时主题更新 MUST NOT 依赖多个层次分别重复解析原始 `theme` 输入。

#### Scenario: 自定义主题与自动代码主题共享同一基线

- **WHEN** `theme` prop 设置为自定义 dark 主题对象，且 `codeTheme` 为 `'auto'`
- **THEN** 壳层与运行时的所有主题消费者 SHALL 基于同一份 dark 解析结果工作
- **AND** 自动代码主题 SHALL 跟随这同一份解析结果的明暗基线

#### Scenario: 运行时主题切换保持跨消费者同步

- **WHEN** `theme` prop 在运行时发生变化
- **THEN** 组件壳层与编辑器运行时中的所有受影响主题消费者 SHALL 在同一已挂载实例内完成更新
- **AND** 不得出现部分消费者仍停留在旧主题解析结果上的状态分裂
