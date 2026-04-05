# vim-keybinding-mode

## Purpose

定义编辑器的 Vim 模态键位行为，包括普通文档导航、结构化表格内的局部覆盖规则，以及保存快捷键等兼容性要求。

## Requirements

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

当 Vim 模式启用时，编辑器 SHALL 继续允许使用方向键导航，以便现有的光标移动预期仍可与 Vim 命令并存。对于普通文档区域，方向键的垂直导航行为 SHALL 继续遵循 Vim 的默认约定（按逻辑行移动）。当 `livePreview` 开启且用户位于结构化表格内时，方向键 MUST 改为遵循结构化表格的文本光标导航规则，而不是普通文本的逻辑行规则。

#### Scenario: 普通文档区域内方向键仍按逻辑行移动

- **WHEN** Vim 模式已启用且用户位于非表格区域按下方向键
- **THEN** 编辑器 SHALL 按 Vim 的默认导航规则移动光标（逻辑行）
- **AND** 该按键 SHALL NOT 被当作文本插入处理

#### Scenario: livePreview 表格内方向键遵循表格文本光标规则

- **WHEN** Vim 模式已启用、`livePreview` 为 `true`，且用户位于结构化表格内按下方向键
- **THEN** 编辑器 SHALL 按结构化表格定义的文本光标导航规则处理方向键
- **AND** 方向键行为 MUST 与同场景下非 Vim 模式的表格方向键语义保持一致

### Requirement: Vim 模式进入表格时保持当前 mode，并落入 cell 内文本光标语境

在结构化表格内，Vim 模式 SHALL 采用“当前 cell + cell 内文本光标 + 当前 Vim mode”的局部覆盖规则。用户从普通文本进入表格时，编辑器 MUST 保留其进入前的 Vim mode：原本处于 normal mode 时继续保持 normal mode；原本处于 insert mode 时继续保持 insert mode。无论哪种 mode，进入结果都 MUST 是落到目标 cell 内容中的文本光标位置，而不是单个 cell 的整格选中态。

#### Scenario: normal mode 下进入表格后仍保持 normal mode

- **WHEN** Vim 模式已启用且用户在 normal mode 下从相邻普通文本进入表格
- **THEN** 编辑器 SHALL 保持 Vim normal mode
- **AND** 光标 SHALL 落在目标 cell 内容中的文本光标位置

#### Scenario: insert mode 下进入表格后仍保持 insert mode

- **WHEN** Vim 模式已启用且用户在 insert mode 下从相邻普通文本进入表格
- **THEN** 编辑器 SHALL 保持 Vim insert mode
- **AND** 目标 cell SHALL 立即进入可输入的编辑会话

### Requirement: Vim 模式在表格内采用 cell 内文本光标优先的移动语义

在结构化表格内，Vim 模式 SHALL 采用“活动 cell + cell 内文本光标”的局部覆盖规则，而不是把 normal mode 简化成纯二维格子跳转。`j` / `k` 从相邻普通文本行进入表格时 SHALL 命中边界行的第一列 cell，并将光标落在该 cell 内容起始处。进入表格后，`h` / `l` SHALL 优先在当前 cell 内容范围内逐字符移动；仅当光标位于 cell 边界时，才允许跨入左/右相邻 cell。`j` / `k` 在表格内按列移动时 SHALL 尽量保留当前 cell 内的相对字符偏移；若目标 cell 更短，则光标位置 SHALL 被夹紧到目标 cell 尾部。`w` / `b` SHALL 保持在当前 cell 内移动，不得跨入相邻 cell。

#### Scenario: j 从普通文本向下进入表格时落在首个 cell 起始处

- **WHEN** Vim 模式已启用且用户位于表格上一行普通文本，在 normal mode 下按下 `j`
- **THEN** 编辑器 SHALL 激活该表格第一行第一列的 cell
- **AND** 光标 SHALL 落在该 cell 内容的第一个位置

#### Scenario: k 从普通文本向上进入表格时落在边界 cell 起始处

- **WHEN** Vim 模式已启用且用户位于表格下一行普通文本，在 normal mode 下按下 `k`
- **THEN** 编辑器 SHALL 激活该表格最后一行第一列的 cell
- **AND** 光标 SHALL 落在该 cell 内容的第一个位置

#### Scenario: h 和 l 优先在当前 cell 内逐字符移动

- **WHEN** Vim 模式已启用且用户在结构化表格内按下 `h` 或 `l`，且当前光标尚未到达 cell 边界
- **THEN** 编辑器 SHALL 仅在当前 cell 内容范围内移动一个字符位置
- **AND** 当前活动 cell SHALL 保持不变

#### Scenario: h 和 l 仅在 cell 边界处跨单元格移动

- **WHEN** Vim 模式已启用且用户在结构化表格内按下 `h` 或 `l`，且当前光标已经位于 cell 边界
- **THEN** 编辑器 SHALL 按左/右单元格导航规则处理该命令
- **AND** 跨入相邻 cell 后的光标 SHALL 落在目标 cell 的对应边界位置

#### Scenario: j 和 k 在表格内按列移动并保留相对偏移

- **WHEN** Vim 模式已启用且用户在结构化表格内按下 `j` 或 `k`
- **THEN** 编辑器 SHALL 按上一行或下一行的对应列 cell 进行移动
- **AND** 编辑器 SHALL 尽量保留当前 cell 内的相对字符偏移；若目标 cell 更短，则将其夹紧到目标 cell 尾部

#### Scenario: w 和 b 不跨越单元格边界

- **WHEN** Vim 模式已启用且用户在结构化表格内按下 `w` 或 `b`
- **THEN** 编辑器 SHALL 仅在当前 cell 内容范围内移动光标
- **AND** 该命令 MUST NOT 直接跨入相邻 cell

### Requirement: Vim 的插入态入口命令必须在当前 cell 文本光标位置生效

当用户在结构化表格内处于 Vim normal mode 时，`i` / `a` 等进入插入态的命令 SHALL 在当前 cell 的文本光标位置生效。进入插入态后，目标 cell MUST 打开可输入的编辑会话，并与该位置的文本光标对齐。

#### Scenario: i 在当前文本光标位置进入插入态

- **WHEN** Vim 模式已启用且用户在结构化表格内的 normal mode 下执行 `i`
- **THEN** 编辑器 SHALL 进入 Vim insert mode
- **AND** 当前 cell SHALL 从当前文本光标位置开始接收输入

#### Scenario: a 在当前文本光标后进入插入态

- **WHEN** Vim 模式已启用且用户在结构化表格内的 normal mode 下执行 `a`
- **THEN** 编辑器 SHALL 进入 Vim insert mode
- **AND** 当前 cell SHALL 从当前文本光标后的合理插入位置开始接收输入

#### Scenario: Esc 从 insert mode 返回当前 cell 的 normal mode 文本光标

- **WHEN** Vim 模式已启用且用户在结构化表格内的 insert mode 下按下 `Esc`
- **THEN** 编辑器 SHALL 退出 Vim insert mode
- **AND** 当前 cell 的文本光标位置 SHALL 保持为后续 normal mode 导航锚点
- **AND** 该按键 SHALL 继续遵循 Vim 的标准语义，而不是额外表示“退出表格”

### Requirement: Vim 模式在表格内的 dd 遵循保守删行规则

在结构化表格内，Vim normal mode 的 `dd` SHALL 删除当前数据行，但 MUST 保护表头行不被普通删行操作误删。只有当该表格仅剩表头行时，编辑器才允许 `dd` 删除表头行。

#### Scenario: dd 删除数据行

- **WHEN** Vim 模式已启用且用户在结构化表格的数据行内执行 `dd`
- **THEN** 编辑器 SHALL 删除当前数据行
- **AND** 表格的表头行与分隔结构 SHALL 保持有效

#### Scenario: 存在数据行时保护表头行

- **WHEN** Vim 模式已启用且表格仍包含至少一行数据行，用户在表头行执行 `dd`
- **THEN** 编辑器 MUST NOT 删除该表头行
- **AND** 编辑器 SHALL 保持当前表格结构有效

#### Scenario: 仅剩表头行时允许删除表头

- **WHEN** Vim 模式已启用且该表格仅剩表头行，用户在表头行执行 `dd`
- **THEN** 编辑器 SHALL 允许删除该表头行
- **AND** 该表格区域 SHALL 被移除出文档

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

### Requirement: Vim 的全局配置在多实例与重复启停下必须保持幂等

实现 Vim 模式所需的全局命令、motion 与结构化表格相关覆盖逻辑 MUST 以幂等方式注册。单个编辑器实例启用或关闭 Vim 模式 MUST NOT 造成重复注册，也 MUST NOT 破坏其他已挂载实例的 Vim 行为。

#### Scenario: 多个 Vim 实例并存

- **WHEN** 同一页面中存在多个启用了 Vim 模式的编辑器实例
- **THEN** 共享的 Vim 全局配置 SHALL 安全复用
- **AND** 每个获得焦点的实例 SHALL 保持正确的保存与导航行为

#### Scenario: 同一实例重复启停 Vim 模式

- **WHEN** 调用方在同一编辑器实例上重复切换 `vimMode`
- **THEN** 编辑器 SHALL NOT 因重复启停产生额外的重复注册或行为漂移
- **AND** Vim 相关命令与表格覆盖逻辑 SHALL 保持一致
