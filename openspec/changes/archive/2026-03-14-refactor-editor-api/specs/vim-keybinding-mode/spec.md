## MODIFIED Requirements

### Requirement: Arrow key navigation remains available in Vim mode

当 Vim 模式启用时，编辑器 SHALL 继续允许使用方向键导航，以便现有的光标移动预期仍可与 Vim 命令并存。方向键的垂直导航行为 SHALL 遵循 Vim 的默认约定（按逻辑行移动）。若开启 `livePreview` 导致方向键行为偏离 Vim 默认约定，编辑器 SHALL 在 `livePreview` 扩展内修复，使其还原为 Vim 的默认导航行为。

#### Scenario: Move with arrow keys in Vim mode

- **WHEN** Vim 模式已启用且用户按下方向键
- **THEN** 编辑器按照 Vim 的默认导航规则移动光标（逻辑行）
- **AND** 该按键 SHALL NOT 被当作文本插入处理

#### Scenario: livePreview 开启时方向键导航不受干扰

- **WHEN** Vim 模式已启用且 `livePreview` 为 `true`，用户按下方向键
- **THEN** 方向键仍按 Vim 默认约定按逻辑行移动光标，与关闭 `livePreview` 时行为一致

## REMOVED Requirements

### Requirement: Vim 模式垂直导航 (j/k) 与 Hybrid 严格逻辑导航对齐

**Reason**: 该 requirement 描述的是"将 j/k 覆盖为 Hybrid 模式的逻辑行跳转"，将导航语义与 hybrid 渲染模式强耦合。正确的约定是：j/k 遵循 Vim 自身的默认行为（逻辑行），`livePreview` 不应改变这一行为，若有干扰则修复还原，而非主动覆盖。

**Migration**: 见上方 MODIFIED 的 "Arrow key navigation remains available in Vim mode"，以及 `hybrid-markdown-rendering` spec 中新增的 "livePreview 不干扰 vim 模式下的导航行为"。
