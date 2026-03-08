## ADDED Requirements

### Requirement: Editor supports switching between standard and Vim keybinding modes

编辑器 SHALL 支持两种键位模式：standard 和 Vim。当 Vim 模式未启用或未配置时，编辑器 MUST 保持现有的标准编辑行为。当 Vim 模式启用时，编辑器 MUST 为当前获得焦点的编辑器实例启用 Vim 键位行为。

#### Scenario: Standard mode by default

- **WHEN** 调用方未启用 Vim 模式
- **THEN** 编辑器保持现有的标准编辑行为
- **AND** 编辑器不启用 Vim 键位

#### Scenario: Enable Vim mode

- **WHEN** 调用方启用 Vim 模式
- **THEN** 编辑器为该实例启用 Vim 键位行为
- **AND** 编辑器不再以标准文本输入行为作为当前活动编辑模式

### Requirement: Vim mode starts in non-insert modal editing behavior

当 Vim 模式启用时，编辑器 SHALL 使用经典的 Vim 模态编辑行为。编辑器 MUST 将 normal mode 视为默认交互状态，因此在用户显式进入 insert mode 之前，移动命令可以执行而不会直接插入文本。

#### Scenario: Typing in normal mode

- **WHEN** Vim 模式已启用且用户尚未进入 insert mode
- **THEN** 普通字符按键 SHALL 按照 Vim normal mode 的规则被解释
- **AND** 编辑器 SHALL NOT 默认把这些输入直接插入为普通文本

#### Scenario: Enter insert mode

- **WHEN** Vim 模式已启用且用户发出 `i` 或 `a` 等插入命令
- **THEN** 编辑器进入 insert mode
- **AND** 后续文本输入 SHALL 持续插入内容，直到用户退出 insert mode

## MODIFIED Requirements

### Requirement: Arrow key navigation remains available in Vim mode

当 Vim 模式启用时，编辑器 SHALL 继续允许使用方向键导航，以便现有的光标移动预期仍可与 Vim 命令并存。在开启 hybrid 渲染模式时，方向键的垂直导航行为 SHALL 与普通模式一样，采用一致的严格逻辑导航和虚拟目标列记忆规则。

#### Scenario: Move with arrow keys in Vim mode

- **WHEN** Vim 模式已启用且用户按下方向键
- **THEN** 编辑器按照当前编辑器的导航规则移动光标
- **AND** 该按键 SHALL NOT 被当作文本插入处理

## ADDED Requirements

### Requirement: Vim 模式垂直导航 (j/k) 与 Hybrid 严格逻辑导航对齐

当 Vim 模式与 Hybrid 渲染模式同时开启时，Vim 的垂直导航指令 (`j` / `k` 以及带有次数的诸如 `5j`) SHALL 被覆盖为与 Hybrid 模式一致的基于纯源码物理行的绝对逻辑跳转，以克服大体积 Widget（如图片）和隐藏标记带来的视觉换行断层。

#### Scenario: 使用 j/k 在包含图片的 Hybrid 文本中导航

- **WHEN** Vim 模式和 Hybrid 模式同时启用，用户在包含图片的相邻行按下 `j` 或 `k`
- **THEN** 光标准确按照纯文本物理行进行跨越，不会因图片的高度产生跳跃失败或列偏移错误
- **AND** Vim 内部的原生 Goal Column (`lastHPos`) SHALL 被正确传递和用于目标位置计算

#### Scenario: 垂直跳转指令携带次数前缀

- **WHEN** 用户在 normal mode 输入类似 `5j` 或 `3k` 的带次数的垂直跳转指令
- **THEN** 编辑器在物理文本行层面准确计算偏移，一次性完成对应次数的逻辑行跨越

### Requirement: Save shortcut remains available when Vim mode is active

当 Vim 模式启用时，编辑器 SHALL 保留现有的 `Mod-s` 保存快捷键。只要编辑器处于聚焦状态，Vim 模式 MUST NOT 阻止编辑器在用户触发保存快捷键时发出保存事件。

#### Scenario: Save shortcut in Vim insert mode

- **WHEN** Vim 模式已启用、编辑器处于聚焦状态，且用户在 insert mode 中按下 `Mod-s`
- **THEN** 编辑器 SHALL 发出保存事件
- **AND** 浏览器默认保存行为 SHALL 继续被阻止

#### Scenario: Save shortcut in Vim normal mode

- **WHEN** Vim 模式已启用、编辑器处于聚焦状态，且用户在 normal mode 中按下 `Mod-s`
- **THEN** 编辑器 SHALL 发出保存事件
- **AND** 浏览器默认保存行为 SHALL 继续被阻止
