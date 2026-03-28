## MODIFIED Requirements

### Requirement: 行内 Markdown 结构在非激活状态下以渲染态显示

在 hybrid 模式下，标题、强调、加粗、链接、行内代码等首期支持的行内或轻量结构 SHALL 在非激活状态下以更接近最终呈现的视觉形式显示，并隐藏对应的 Markdown 标记字符。对于 ATX 标题 (如 `# `)，隐藏 `#` 标记时 MUST 连同后面的排版空格一并隐藏。光标进入当前结构后，编辑器 MUST 恢复该结构的源码显示，以保证用户可以直接编辑原始 Markdown。

与主题无关的基础样式（如代码字体 class）SHALL 通过稳定的 base theme 提供；内容区视觉样式（标题字号/加粗、链接颜色、引用边框色、list marker 颜色等）MUST 从当前 resolved editor theme 读取，不得继续散落为不可配置的硬编码。对于强调、加粗、链接、行内代码和标题源码态，这些关键视觉语义 MUST 由编辑器自己拥有的 decoration class 或行级 selector 承担，不得仅依赖内层语法高亮 token span 的默认样式。

编辑器 MUST 为标题文本行添加 `cm-heading-line-{1-6}` line decoration，该装饰 MUST 始终存在，不受 active scope 状态影响。该 line decoration 作为 CSS 父级选择器锚点，通过后代选择器为 `tok-heading` 和 `tok-meta` 提供级别相关的样式。

该规则同时适用于 ATX heading 与 Setext heading。对于 Setext heading，`cm-heading-line-{level}` MUST 仅应用在标题内容行，不得应用在 `===` / `---` 的下划线分隔行。

#### Scenario: 光标不在已支持的行内结构内

- **WHEN** hybrid 模式已启用且光标不在某个已支持的行内结构范围内
- **THEN** 编辑器隐藏该结构对应的 Markdown 标记，并显示渲染后的视觉效果

#### Scenario: 光标进入已支持的行内结构

- **WHEN** hybrid 模式已启用且光标进入某个已支持的行内结构范围内
- **THEN** 编辑器显示该结构的原始 Markdown 源码，允许用户直接编辑标记和内容
- **AND** 该结构的视觉样式 SHOULD 尽量保持与非激活渲染态一致，而不是完全退回普通源码高亮

#### Scenario: 宿主 reset 不应剥离关键行内语义

- **WHEN** hybrid 模式已启用且宿主应用对编辑器内的 `span` 或常见内联标签施加统一 reset
- **THEN** 强调、加粗、链接与行内代码 MUST 仍保留当前主题定义的核心视觉语义
- **AND** 调用方 SHOULD NOT 需要针对编辑器内部 DOM 结构额外编写补丁 CSS 才能恢复这些样式

#### Scenario: 光标进入图片语法但语法仍然合法

- **WHEN** hybrid 模式已启用且光标进入某个合法 Markdown 图片语法范围内
- **THEN** 编辑器 MUST 显示该图片语法的原始 Markdown 源码
- **AND** 图片预览 SHOULD 继续可见，直到图片语法本身被编辑为非法

#### Scenario: 图片地址失效时显示占位提示

- **WHEN** hybrid 模式已启用且图片语法仍然合法，但图片地址无法加载
- **THEN** 编辑器 SHOULD 保留图片预览占位区域
- **AND** 向用户显示图片无法获取或地址错误的提示，而不是直接移除整个预览区域

#### Scenario: ATX 标题行始终携带行级装饰

- **WHEN** hybrid 模式已启用且文档包含 ATX 标题
- **THEN** 标题所在文本行 MUST 始终携带 `cm-heading-line-{level}` line decoration，无论光标是否在该标题内

#### Scenario: Setext 标题只在内容行携带行级装饰

- **WHEN** hybrid 模式已启用且文档包含 Setext 标题
- **THEN** Setext 标题的内容行 MUST 携带 `cm-heading-line-{level}` line decoration
- **AND** 下划线分隔行 MUST NOT 携带该 class

#### Scenario: 源码模式下标题保持视觉一致性

- **WHEN** 光标进入标题行，编辑器切换为源码显示
- **THEN** 标题文本 MUST 保持与 live preview 状态一致的字号、字重和行高
- **AND** `##` 等标记符号 MUST 以主题定义的 syntax mark 颜色显示

#### Scenario: 标题源码态在宿主 reset 下仍保持主题样式

- **WHEN** 光标进入标题行，且宿主应用对编辑器中的 `span` 施加统一 reset
- **THEN** 标题文本与标记符号 MUST 继续以主题定义的字号、字重、行高和 syntax mark 颜色显示
- **AND** 这些样式 MUST 由稳定的行级或外层 selector 提供，而不是仅依赖单一 `tok-*` span 的默认表现

#### Scenario: 光标进出标题行不产生行高跳变

- **WHEN** 光标进入或离开标题行
- **THEN** 该行的字号、字重和行高 MUST 保持不变，仅内容从渲染态切换为源码态或反之

#### Scenario: 光标不在 ATX 标题内

- **WHEN** hybrid 模式已启用且光标不在某个 ATX 标题范围内
- **THEN** 编辑器隐藏该标题的 `#` 标记符以及紧跟其后的空格，并显示渲染后的视觉效果
