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

### Requirement: Arrow key navigation remains available in Vim mode

当 Vim 模式启用时，编辑器 SHALL 继续允许使用方向键导航，以便现有的光标移动预期仍可与 Vim 命令并存。

#### Scenario: Move with arrow keys in Vim mode

- **WHEN** Vim 模式已启用且用户按下方向键
- **THEN** 编辑器按照当前编辑器的导航规则移动光标
- **AND** 该按键 SHALL NOT 被当作文本插入处理

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
