## MODIFIED Requirements

### Requirement: 表头需要主题感知的淡背景色

结构化表格的表头行 SHALL 保留轻微视觉强调，但这种强调 MUST 通过 resolved editor theme 中的表格 token 提供，而不是仅按 light / dark 字符串分支写死。该背景色 MUST 低于 active cell / selected cell 的视觉优先级。

#### Scenario: 预置主题下表头背景色正常工作

- **WHEN** 编辑器使用 `'light'` 或 `'dark'` 预置主题渲染结构化表格
- **THEN** 表头 cell SHALL 使用对应预置主题中的表头背景色

#### Scenario: 自定义主题覆盖表头背景色

- **WHEN** 编辑器使用 `{ type: 'dark', table: { headerBackground: 'rgba(99, 102, 241, 0.12)' } }` 渲染结构化表格
- **THEN** 表头 cell SHALL 使用 `rgba(99, 102, 241, 0.12)` 作为背景色
- **AND** 该背景色 SHALL 不覆盖活动单元格的高亮边框与高亮底色
