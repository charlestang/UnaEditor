## MODIFIED Requirements

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
