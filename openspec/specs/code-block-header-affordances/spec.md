# code-block-header-affordances

## Purpose

定义 `livePreview` 下围栏代码块 opening fence 行的 header affordance 行为，包括语言标签、copy affordance 以及它们与源码切换之间的协同约束。

## Requirements

### Requirement: 非激活状态下 opening fence 行必须呈现为代码块内部的 header affordance row

当 fenced code block 在 `livePreview` 下处于非激活状态时，编辑器 MUST 将 opening fence 行渲染为代码块内部的 header affordance row，而不是在代码块上方额外插入独立工具栏。该 row SHALL 属于代码块壳子的一部分，并与代码内容区域共享对齐基准。copy affordance MUST 以右上角的 compact icon-like 按钮呈现，并暴露明确的可访问名称。opening 行的 header affordance MUST 保持紧凑，不得把该行扩展成明显高于普通代码行的空白条。

#### Scenario: 带语言标识符的代码块显示 header row

- **WHEN** `livePreview` 已启用、光标不在某个 fenced code block 内，且 opening fence 声明了语言标识符
- **THEN** opening fence 行 MUST 显示 header affordance row
- **AND** 该 row MUST 在右侧显示语言标签
- **AND** 该 row MUST 提供右侧 copy affordance

#### Scenario: 无语言标识符的代码块不伪造语言标签

- **WHEN** `livePreview` 已启用、光标不在某个 fenced code block 内，且 opening fence 只有围栏标记而没有语言标识符
- **THEN** opening fence 行 MUST 显示 header affordance row
- **AND** 编辑器 MUST NOT 显示伪造的语言标签占位
- **AND** 该 row SHOULD 继续提供 copy affordance

#### Scenario: 未知语言标识符不显示原始字符串

- **WHEN** `livePreview` 已启用、光标不在某个 fenced code block 内，且 opening fence 包含未知语言标识符
- **THEN** opening fence 行 MUST 继续显示 header affordance row
- **AND** 编辑器 MUST NOT 显示该未知标识符的原始字符串
- **AND** 该 row SHOULD 继续提供 copy affordance

### Requirement: copy affordance 必须复制纯代码正文，并保持交互稳定

代码块 header row MUST 提供 copy affordance。触发该 affordance 时，编辑器 MUST 复制 opening fence 与 closing fence 之间的纯代码正文，而不是复制 fence、语言标识符、header label 或行号文本。copy affordance MUST 作为非编辑交互元素存在；在 `readonly` 场景下，该 affordance MUST 继续可用。

#### Scenario: 复制正文而不包含 fence

- **WHEN** 用户触发某个代码块 header row 中的 copy affordance
- **THEN** 系统 MUST 复制该代码块的纯代码正文
- **AND** 复制结果 MUST NOT 包含 opening fence 或 closing fence
- **AND** 复制结果 MUST NOT 包含语言标签或行号文本

#### Scenario: copy affordance 不应要求先切回源码态

- **WHEN** 用户在非激活状态下直接点击或键盘触发 copy affordance
- **THEN** 编辑器 MUST 允许复制行为直接完成
- **AND** 系统 MUST NOT 以“先强制进入源码态再复制”作为唯一交互路径

#### Scenario: readonly 场景仍可复制

- **WHEN** 编辑器处于 `readonly` 状态且代码块处于非激活 header row 展示
- **THEN** 用户 MUST 仍能触发 copy affordance 完成复制
