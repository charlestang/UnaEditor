## ADDED Requirements

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

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: 表格在首期保持源码编辑态

在首期 hybrid 模式中，Markdown 表格 SHALL 保持源码编辑态，不提供完整的表格渲染替换行为。启用 hybrid 模式不得将 Markdown 表格转换为不可直接编辑的表格 widget。

#### Scenario: 文档包含 Markdown 表格

- **WHEN** hybrid 模式已启用且文档中包含 Markdown 表格语法
- **THEN** 编辑器保持该表格以 Markdown 源码形式显示和编辑，而不是替换为渲染后的表格视图

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
