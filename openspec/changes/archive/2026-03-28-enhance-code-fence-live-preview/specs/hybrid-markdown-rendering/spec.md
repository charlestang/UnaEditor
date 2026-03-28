## MODIFIED Requirements

### Requirement: Blockquote 在首期继续提供保守增强

在 hybrid 模式下，blockquote SHALL 在非激活状态下获得更接近渲染态的视觉增强，以改善阅读体验。隐藏 `>` 等标记符号时，编辑器 MUST 同时隐藏紧随其后的排版空格，以避免出现异常缩进。首期实现 MUST 保持 blockquote 的 Markdown 源码编辑路径直接可用。

#### Scenario: 光标不在 blockquote 内

- **WHEN** hybrid 模式已启用且光标不在某个 blockquote 结构范围内
- **THEN** 编辑器对该 blockquote 应用首期定义的渲染增强样式，同时保持其源码内容可回到直接编辑态
- **AND** 隐藏 `>` 标记以及紧跟在标记后面的空格符

### Requirement: Fenced code block 在 livePreview 下采用 Obsidian-like 的行级状态模型

在 hybrid 模式下，fenced code block SHALL 以 begin/body/end 三类行组成的块级壳子呈现，而不是退回普通 Markdown 段落外观。非激活状态下，opening fence 行 MUST 呈现为代码块内部的 header affordance row，而不是独立工具栏；closing fence 行 MUST 不以 raw fence 源码作为主显示内容出现。active 状态下，编辑器 MUST 按整个 `FencedCode` 结构恢复 opening / closing fence 源码显示，同时 SHOULD 尽量保留代码块壳子、背景与 faux gutter 布局稳定性。

fenced code block 的 `fontFamily` SHALL 引用 CSS 变量 `var(--una-code-font-family, ...)` 而非硬编码 monospace 字体栈。

#### Scenario: 非激活状态下 opening fence 行显示为 header row

- **WHEN** hybrid 模式已启用且光标不在某个 fenced code block 结构范围内
- **THEN** opening fence 行 MUST 作为代码块内部的 header affordance row 呈现
- **AND** 该 row MUST NOT 被实现为独立插入在代码块上方的工具栏
- **AND** 代码主体 MUST 继续保持语法高亮与代码主题样式

#### Scenario: 非激活状态下 closing fence 不显示源码

- **WHEN** hybrid 模式已启用且光标不在某个 fenced code block 结构范围内
- **THEN** closing fence 行 MUST NOT 以 raw closing fence 源码作为主显示内容出现
- **AND** 代码块尾部的壳子语义 SHOULD 继续保留

#### Scenario: 光标进入围栏代码块后恢复 raw fence 源码

- **WHEN** hybrid 模式已启用且光标进入某个 fenced code block 的 opening fence、body lines 或 closing fence 任意位置
- **THEN** 编辑器 MUST 恢复该代码块 opening fence 与 closing fence 的源码显示
- **AND** 代码块壳子与 faux gutter 布局 SHOULD 继续保留
- **AND** 编辑器 MUST NOT 因 active scope 切换而将整个代码块退回为普通段落文本外观
