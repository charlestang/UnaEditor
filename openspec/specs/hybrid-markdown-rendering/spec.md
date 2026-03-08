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

## MODIFIED Requirements

### Requirement: Blockquote 和围栏代码块在首期提供保守增强

在 hybrid 模式下，blockquote 和 fenced code block SHALL 在非激活状态下获得更接近渲染态的视觉增强，以改善阅读体验。隐藏 `>` 等标记符号时，编辑器 MUST 同时隐藏紧随其后的排版空格，以避免出现异常缩进。首期实现 MUST 保持这些结构的 Markdown 源码编辑路径直接可用，不要求通过整块替换 widget 的方式提供完全渲染态。

#### Scenario: 光标不在 blockquote 内

- **WHEN** hybrid 模式已启用且光标不在某个 blockquote 结构范围内
- **THEN** 编辑器对该 blockquote 应用首期定义的渲染增强样式，同时保持其源码内容可回到直接编辑态
- **AND** 隐藏 `>` 标记以及紧跟在标记后面的空格符

#### Scenario: 光标不在围栏代码块内

- **WHEN** hybrid 模式已启用且光标不在某个 fenced code block 结构范围内
- **THEN** 编辑器对该代码块应用首期定义的渲染增强样式，同时保持其源码内容可回到直接编辑态

### Requirement: 行内 Markdown 结构在非激活状态下以渲染态显示

在 hybrid 模式下，标题、强调、加粗、链接、行内代码等首期支持的行内或轻量结构 SHALL 在非激活状态下以更接近最终呈现的视觉形式显示，并隐藏对应的 Markdown 标记字符。对于 ATX 标题 (如 `# `)，隐藏 `#` 标记时 MUST 连同后面的排版空格一并隐藏。光标进入当前结构后，编辑器 MUST 恢复该结构的源码显示，以保证用户可以直接编辑原始 Markdown。

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

### Requirement: 混合模式下的严格逻辑导航 (Strict Logical Navigation)

在 hybrid 模式下，由于动态隐藏标记和插入 Widget（如图片）会导致视觉行和物理行的剧烈脱节，编辑器 SHALL 使用纯源码的物理行（Logical Lines）来计算垂直方向（`ArrowUp` / `ArrowDown`）的光标跳转，以提供高度一致且有规律的导航体验。

#### Scenario: 跨越带隐藏标记的视觉折行

- **WHEN** 用户在一段由长文本组成的普通段落中按下方向下键，而当前光标或目标行触发了逻辑导航接管
- **THEN** 光标直接跳到下一个纯文本物理行 (Document Line)，而不是进入同一段落的下一个视觉折行 (Visual Line)

#### Scenario: 跨越大尺寸替换型 Widget (如图片)

- **WHEN** 用户通过方向键使光标跨越包含图片的物理行
- **THEN** 编辑器按源码物理结构精确跳转，不会被图片在屏幕上的高度阻碍或干扰光标的列偏移量

### Requirement: 垂直导航的虚拟目标列记忆 (Goal Column Memory)

编辑器在进行基于物理行的垂直跳转时，SHALL 记录用户最初的列位置意图 (Goal Column)，确保在跨越短行或空行后，光标能够准确恢复到原先指定的列偏移量。

#### Scenario: 跨越空行保持列偏移量

- **WHEN** 用户在第 1 行的第 15 列按下方向下键，第 2 行为空行，用户继续按下方向下键到达第 3 行
- **THEN** 光标在第 2 行时停留在第 0 列
- **AND** 光标到达第 3 行时恢复到第 15 列 (若第 3 行长度足够)

#### Scenario: 取消虚拟列记忆

- **WHEN** 用户进行非垂直导航操作 (如左右移动光标、点击鼠标、或输入字符)
- **THEN** 编辑器清空当前记忆的目标列 (Goal Column)，并在下一次垂直跳转时重新建立记忆

### Requirement: 表格在首期保持源码编辑态

在首期 hybrid 模式中，Markdown 表格 SHALL 保持源码编辑态，不提供完整的表格渲染替换行为。启用 hybrid 模式不得将 Markdown 表格转换为不可直接编辑的表格 widget。

#### Scenario: 文档包含 Markdown 表格

- **WHEN** hybrid 模式已启用且文档中包含 Markdown 表格语法
- **THEN** 编辑器保持该表格以 Markdown 源码形式显示和编辑，而不是替换为渲染后的表格视图
