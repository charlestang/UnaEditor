## MODIFIED Requirements

### Requirement: 表格在 livePreview 下结构化渲染，并在必要时回退源码态

在本次变更后，hybrid 模式下的合法 GFM Markdown 表格 SHALL 不再保持整块源码编辑态。启用 `livePreview` 时，编辑器 SHALL 将合法表格渲染为结构化 table 视图，并允许用户直接在 cell 级别编辑内容；关闭 `livePreview` 时，编辑器 MUST 将该表格完全退回 Markdown 源码态，仅保留语法高亮和普通文本编辑路径。若表格语法不完整，编辑器 MUST 保持源码态，而不是渲染半结构化表格。

#### Scenario: livePreview 开启时结构化渲染表格

- **WHEN** hybrid 模式已启用且文档中包含合法 GFM Markdown 表格
- **THEN** 编辑器 SHALL 将该区域渲染为结构化 table 视图
- **AND** 编辑器 MUST NOT 因光标进入表格而将整表回退为 Markdown 源码

#### Scenario: livePreview 关闭时退回源码态

- **WHEN** `livePreview` 为 `false` 且文档中包含 Markdown 表格
- **THEN** 编辑器 MUST 保持该表格为原始 Markdown 源码视图
- **AND** 编辑器 SHALL NOT 启用结构化 table widget 或单元格级交互

#### Scenario: 表格语法不完整时保持源码态

- **WHEN** `livePreview` 为 `true` 但用户输入的表格尚未形成合法 GFM 表格
- **THEN** 编辑器 MUST 保持该区域为 Markdown 源码态
- **AND** 编辑器 SHALL NOT 渲染不完整的结构化表格
