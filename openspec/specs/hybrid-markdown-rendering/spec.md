# hybrid-markdown-rendering

## Purpose

定义编辑器在 `livePreview` 模式下的混合 Markdown 渲染行为，包括源码态与渲染态之间的切换规则，以及相关导航与块级结构表现。

## Requirements

### Requirement: Hybrid 渲染模式可配置

编辑器 SHALL 提供可开关的 Live Preview 渲染模式，通过 `livePreview` prop 控制。启用该模式时，编辑器 SHALL 在保持 Markdown 源码可编辑的前提下显示渲染态；禁用该模式时，编辑器 MUST 保持传统源码编辑态，不应用渲染装饰行为。

#### Scenario: 启用 livePreview 模式

- **WHEN** 调用方将 `livePreview` prop 设置为 `true`
- **THEN** 编辑器以渲染态展示已支持的 Markdown 结构，并在进入对应结构时仍可切回源码编辑

#### Scenario: 禁用 livePreview 模式

- **WHEN** 调用方将 `livePreview` prop 设置为 `false` 或省略该 prop
- **THEN** 编辑器继续显示原始 Markdown 源码，不隐藏 Markdown 标记，也不显示渲染装饰结果

### Requirement: 行内 Markdown 结构在非激活状态下以渲染态显示

在 hybrid 模式下，标题、强调、加粗、链接、行内代码等首期支持的行内或轻量结构 SHALL 在非激活状态下以更接近最终呈现的视觉形式显示，并隐藏对应的 Markdown 标记字符。光标进入当前结构后，编辑器 MUST 恢复该结构的源码显示，以保证用户可以直接编辑原始 Markdown。

HYBRID_THEME 中的字体相关样式 SHALL 引用 CSS 变量而非硬编码值：inline code 使用 `var(--una-code-font-family, ...)` 作为 `fontFamily`，fenced code block 同理。标题字号 SHALL 使用 `em` 单位以跟随正文字号自动缩放。

#### Scenario: 光标不在已支持的行内结构内

- **WHEN** hybrid 模式已启用且光标不在某个已支持的行内结构范围内
- **THEN** 编辑器隐藏该结构对应的 Markdown 标记，并显示渲染后的视觉效果

#### Scenario: 光标进入已支持的行内结构

- **WHEN** hybrid 模式已启用且光标进入某个已支持的行内结构范围内
- **THEN** 编辑器显示该结构的原始 Markdown 源码，允许用户直接编辑标记和内容

### Requirement: 图片语法在非激活状态下显示为图片内容

在 hybrid 模式下，标准 Markdown 图片语法 SHALL 在非激活状态下显示为实际图片内容，而不是仅显示 `![alt](url)` 源码。光标进入图片语法范围后，编辑器 MUST 恢复该图片语法的源码显示，以便用户修改 alt 文本或图片地址。

#### Scenario: 光标不在图片语法内

- **WHEN** hybrid 模式已启用且光标不在某个 Markdown 图片语法范围内
- **THEN** 编辑器显示该图片的渲染结果，而不是原始 Markdown 图片源码

#### Scenario: 光标进入图片语法

- **WHEN** hybrid 模式已启用且光标进入某个 Markdown 图片语法范围内
- **THEN** 编辑器显示该图片的原始 Markdown 图片源码，并允许用户直接编辑

### Requirement: Blockquote 和围栏代码块在首期提供保守增强

在 hybrid 模式下，blockquote 和 fenced code block SHALL 在非激活状态下获得更接近渲染态的视觉增强，以改善阅读体验。隐藏 `>` 等标记符号时，编辑器 MUST 同时隐藏紧随其后的排版空格，以避免出现异常缩进。首期实现 MUST 保持这些结构的 Markdown 源码编辑路径直接可用，不要求通过整块替换 widget 的方式提供完全渲染态。

fenced code block 的 `fontFamily` SHALL 引用 CSS 变量 `var(--una-code-font-family, ...)` 而非硬编码 monospace 字体栈。

#### Scenario: 光标不在 blockquote 内

- **WHEN** hybrid 模式已启用且光标不在某个 blockquote 结构范围内
- **THEN** 编辑器对该 blockquote 应用首期定义的渲染增强样式，同时保持其源码内容可回到直接编辑态
- **AND** 隐藏 `>` 标记以及紧跟在标记后面的空格符

#### Scenario: 光标不在围栏代码块内

- **WHEN** hybrid 模式已启用且光标不在某个 fenced code block 结构范围内
- **THEN** 编辑器对该代码块应用首期定义的渲染增强样式，同时保持其源码内容可回到直接编辑态

### Requirement: 行内 Markdown 结构在非激活状态下以渲染态显示

在 hybrid 模式下，标题、强调、加粗、链接、行内代码等首期支持的行内或轻量结构 SHALL 在非激活状态下以更接近最终呈现的视觉形式显示，并隐藏对应的 Markdown 标记字符。对于 ATX 标题 (如 `# `)，隐藏 `#` 标记时 MUST 连同后面的排版空格一并隐藏。光标进入当前结构后，编辑器 MUST 恢复该结构的源码显示，以保证用户可以直接编辑原始 Markdown。

HYBRID_THEME 中的字体相关样式 SHALL 引用 CSS 变量而非硬编码值：inline code 使用 `var(--una-code-font-family, ...)` 作为 `fontFamily`，fenced code block 同理。标题字号 SHALL 使用 `em` 单位以跟随正文字号自动缩放。

#### Scenario: 光标不在 ATX 标题内

- **WHEN** hybrid 模式已启用且光标不在某个 ATX 标题范围内
- **THEN** 编辑器隐藏该标题的 `#` 标记符以及紧跟其后的空格，并显示渲染后的视觉效果

#### Scenario: 光标不在已支持的行内结构内

- **WHEN** hybrid 模式已启用且光标不在某个已支持的行内结构（非 ATX 标题）范围内
- **THEN** 编辑器隐藏该结构对应的 Markdown 标记，并显示渲染后的视觉效果

#### Scenario: 光标进入已支持的行内结构

- **WHEN** hybrid 模式已启用且光标进入某个已支持的行内结构范围内
- **THEN** 编辑器显示该结构的原始 Markdown 源码，允许用户直接编辑标记和内容

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

### Requirement: livePreview 不干扰非 vim 模式下的导航行为

在非 vim 模式下，`livePreview` 的 decoration（`Decoration.replace({})`）会导致 CodeMirror 的坐标映射将光标放在替换范围之后，而非保持原始文档列位置。编辑器 SHALL 在 `livePreview` 扩展内通过自定义 ArrowUp/Down handler 修复此问题，按逻辑行移动并保持文档列位置。

期望行为：光标在某行 col N，按 ArrowDown 后 SHALL 落在下一逻辑行的 col N（clamp 到行尾），而非被 decoration 偏移到替换范围之后。这确保光标进入含隐藏标记的行（如 "## " 被隐藏的标题行）时，光标落在行首（"#" 之前），scope 激活后无视觉跳变。

#### Scenario: livePreview 关闭时非 vim 模式导航

- **WHEN** `livePreview` 为 `false` 且 `vimMode` 为 `false`
- **THEN** `ArrowUp` / `ArrowDown` 按 CodeMirror 默认行为移动光标（开启 lineWrapping 时为视觉行）

#### Scenario: livePreview 开启时非 vim 模式导航保持文档列位置

- **WHEN** `livePreview` 为 `true` 且 `vimMode` 为 `false`
- **THEN** `ArrowUp` / `ArrowDown` 按逻辑行移动光标，保持文档列位置不变
- **AND** 光标进入含隐藏 decoration 的行时，SHALL 落在行首（隐藏标记之前），而非替换范围之后

### Requirement: livePreview 不干扰 vim 模式下的导航行为

在 vim 模式下，`ArrowUp` / `ArrowDown` / `j` / `k` 的默认行为由 Vim 约定决定（按逻辑行移动）。`livePreview` 的 decoration 不得破坏该默认行为。若 decoration 导致导航偏离 Vim 约定，编辑器 SHALL 在 `livePreview` 扩展内修复，使其还原为 Vim 的默认导航行为。

#### Scenario: livePreview 关闭时 vim 模式导航

- **WHEN** `livePreview` 为 `false` 且 `vimMode` 为 `true`
- **THEN** `ArrowUp` / `ArrowDown` / `j` / `k` 按 Vim 约定按逻辑行移动光标

#### Scenario: livePreview 开启时 vim 模式导航不受干扰

- **WHEN** `livePreview` 为 `true` 且 `vimMode` 为 `true`
- **THEN** `ArrowUp` / `ArrowDown` / `j` / `k` 仍按 Vim 约定按逻辑行移动光标，与关闭 livePreview 时行为一致

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
