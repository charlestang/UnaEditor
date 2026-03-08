## ADDED Requirements

### Requirement: Hybrid 渲染模式可配置

编辑器 SHALL 提供可开关的 hybrid Markdown 渲染模式。启用该模式时，编辑器 SHALL 在保持 Markdown 源码可编辑的前提下显示渲染态；禁用该模式时，编辑器 MUST 保持传统源码编辑态，不应用 hybrid 渲染行为。

#### Scenario: 启用 hybrid 模式

- **WHEN** 调用方启用 hybrid Markdown 渲染模式
- **THEN** 编辑器以渲染态展示已支持的 Markdown 结构，并在进入对应结构时仍可切回源码编辑

#### Scenario: 禁用 hybrid 模式

- **WHEN** 调用方禁用 hybrid Markdown 渲染模式
- **THEN** 编辑器继续显示原始 Markdown 源码，不隐藏 Markdown 标记，也不显示 hybrid 渲染结果

### Requirement: 行内 Markdown 结构在非激活状态下以渲染态显示

在 hybrid 模式下，标题、强调、加粗、链接、行内代码等首期支持的行内或轻量结构 SHALL 在非激活状态下以更接近最终呈现的视觉形式显示，并隐藏对应的 Markdown 标记字符。光标进入当前结构后，编辑器 MUST 恢复该结构的源码显示，以保证用户可以直接编辑原始 Markdown。

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

在 hybrid 模式下，blockquote 和 fenced code block SHALL 在非激活状态下获得更接近渲染态的视觉增强，以改善阅读体验。首期实现 MUST 保持这些结构的 Markdown 源码编辑路径直接可用，不要求通过整块替换 widget 的方式提供完全渲染态。

#### Scenario: 光标不在 blockquote 内

- **WHEN** hybrid 模式已启用且光标不在某个 blockquote 结构范围内
- **THEN** 编辑器对该 blockquote 应用首期定义的渲染增强样式，同时保持其源码内容可回到直接编辑态

#### Scenario: 光标不在围栏代码块内

- **WHEN** hybrid 模式已启用且光标不在某个 fenced code block 结构范围内
- **THEN** 编辑器对该代码块应用首期定义的渲染增强样式，同时保持其源码内容可回到直接编辑态

### Requirement: 表格在首期保持源码编辑态

在首期 hybrid 模式中，Markdown 表格 SHALL 保持源码编辑态，不提供完整的表格渲染替换行为。启用 hybrid 模式不得将 Markdown 表格转换为不可直接编辑的表格 widget。

#### Scenario: 文档包含 Markdown 表格

- **WHEN** hybrid 模式已启用且文档中包含 Markdown 表格语法
- **THEN** 编辑器保持该表格以 Markdown 源码形式显示和编辑，而不是替换为渲染后的表格视图
