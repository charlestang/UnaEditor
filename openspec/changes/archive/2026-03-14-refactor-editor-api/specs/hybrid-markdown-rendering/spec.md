## MODIFIED Requirements

### Requirement: Hybrid 渲染模式可配置

编辑器 SHALL 提供可开关的 Live Preview 渲染模式，通过 `livePreview` prop 控制。启用该模式时，编辑器 SHALL 在保持 Markdown 源码可编辑的前提下显示渲染态；禁用该模式时，编辑器 MUST 保持传统源码编辑态，不应用渲染装饰行为。

#### Scenario: 启用 livePreview 模式

- **WHEN** 调用方将 `livePreview` prop 设置为 `true`
- **THEN** 编辑器以渲染态展示已支持的 Markdown 结构，并在进入对应结构时仍可切回源码编辑

#### Scenario: 禁用 livePreview 模式

- **WHEN** 调用方将 `livePreview` prop 设置为 `false` 或省略该 prop
- **THEN** 编辑器继续显示原始 Markdown 源码，不隐藏 Markdown 标记，也不显示渲染装饰结果

## REMOVED Requirements

### Requirement: 混合模式下的严格逻辑导航 (Strict Logical Navigation)

**Reason**: 该 requirement 描述的是"始终按逻辑行导航"，但这不是编辑器的期望行为。正确的约定是：导航键应遵循各自模式的默认行为（非 vim 模式按视觉行，vim 模式按逻辑行），livePreview 不应改变这一默认行为，若有干扰则在 livePreview 扩展内修复还原。

**Migration**: 见下方新增的 Requirement: livePreview 不干扰导航默认行为。

### Requirement: 垂直导航的虚拟目标列记忆 (Goal Column Memory)

**Reason**: 该 requirement 描述的是"始终生效的 goal column 记忆"，但 goal column 记忆是各模式导航修复的实现细节，应归属于对应模式的修复范畴，不作为独立的始终生效行为约定。

**Migration**: goal column 记忆行为保留在 livePreview 的导航修复实现中。

## ADDED Requirements

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
