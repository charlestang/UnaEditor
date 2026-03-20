## ADDED Requirements

### Requirement: 标准 Markdown 列表在非激活状态下以保守渲染态显示

在 hybrid 模式下，编辑器 SHALL 为 CommonMark 标准无序列表和有序列表提供保守渲染增强。对于无序列表，`-`、`*`、`+` 等合法 marker SHALL 显示为正常 bullet 列表效果；对于有序列表，数字加 `.` 或 `)` 的合法 marker SHALL 显示为正常 ordered list 效果。光标或选区进入当前列表项后，编辑器 MUST 恢复该列表项的 Markdown 源码显示，以保证用户可以直接编辑原始 marker。

#### Scenario: 无序列表项处于非激活状态

- **WHEN** hybrid 模式已启用，文档包含使用 `-`、`*` 或 `+` 的合法无序列表项，且光标不在该列表项内
- **THEN** 编辑器 SHALL 将该列表项显示为正常 bullet 列表效果
- **AND** 原始 Markdown marker SHALL 不以源码形式直接显示

#### Scenario: 有序列表项处于非激活状态

- **WHEN** hybrid 模式已启用，文档包含使用 `.` 或 `)` delimiter 的合法有序列表项，且光标不在该列表项内
- **THEN** 编辑器 SHALL 将该列表项显示为正常 ordered list 效果
- **AND** 原始 Markdown marker SHALL 不以源码形式直接显示

#### Scenario: 光标进入当前列表项

- **WHEN** hybrid 模式已启用且光标或选区进入某个列表项范围内
- **THEN** 编辑器 MUST 恢复该列表项的 Markdown 源码显示
- **AND** 其他未激活的列表项 MAY 继续保持渲染态

#### Scenario: 嵌套和混合列表保持可读

- **WHEN** hybrid 模式已启用且文档包含嵌套列表或混合使用无序与有序 marker 的合法列表结构
- **THEN** 编辑器 SHALL 保持正确的层级关系与列表项可读性
- **AND** 不得因为父级或兄弟列表项处于非激活状态而破坏当前列表项的源码编辑路径

### Requirement: GFM task list 在非激活状态下显示为只读 checkbox

在 hybrid 模式下，编辑器 SHALL 支持 GFM task list 语法。对于以合法列表 marker 开头、并在列表项首段使用 `[ ]`、`[x]` 或 `[X]` task marker 的列表项，编辑器 SHALL 在非激活状态下将该 task marker 渲染为只读 checkbox 视觉效果。checkbox MUST NOT 直接切换勾选状态；用户进入该列表项后，编辑器 MUST 恢复源码显示，由用户通过编辑源码修改任务状态。checked 与 unchecked 两种 checkbox 视觉状态 SHALL 使用一致的对齐基准，并与任务文本保持自然的垂直和水平对齐。

#### Scenario: 未完成任务项处于非激活状态

- **WHEN** hybrid 模式已启用且某个合法 task list 项使用 `[ ]` 标记，且光标不在该列表项内
- **THEN** 编辑器 SHALL 将该 task list 项显示为未勾选的 checkbox 效果
- **AND** `[ ]` 源码标记 SHALL 不直接显示

#### Scenario: 已完成任务项处于非激活状态

- **WHEN** hybrid 模式已启用且某个合法 task list 项使用 `[x]` 或 `[X]` 标记，且光标不在该列表项内
- **THEN** 编辑器 SHALL 将该 task list 项显示为已勾选的 checkbox 效果
- **AND** task 内容 SHALL 保持可读

#### Scenario: 勾选与未勾选状态保持一致对齐

- **WHEN** hybrid 模式已启用且文档同时包含未完成和已完成的 task list 项
- **THEN** 两种 checkbox 状态 SHALL 与任务文本保持一致的视觉对齐
- **AND** 不得因为 checked 与 unchecked 状态不同而出现明显的基线跳动或异常间距

#### Scenario: 点击 checkbox 不直接切换状态

- **WHEN** hybrid 模式已启用且用户点击某个 task list 项的 checkbox 渲染区域
- **THEN** 编辑器 MUST NOT 直接修改该任务项的勾选状态
- **AND** 编辑器 SHALL 继续通过源码编辑路径处理该任务项

#### Scenario: 光标进入任务项后恢复源码

- **WHEN** hybrid 模式已启用且光标或选区进入某个 task list 项范围内
- **THEN** 编辑器 MUST 恢复该任务项的 Markdown 源码显示
- **AND** 用户 SHALL 能直接编辑 `[ ]`、`[x]` 或 `[X]` 标记
