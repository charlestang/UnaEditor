## Context

`UnaEditor` 当前的结构化表格实现已经具备 GFM 表格映射、源码改写、行列 handle 和右键结构操作，但它把“单元格编辑”建立在共享 overlay `textarea` 上，导致表格内的 normal-mode 光标系统和 CodeMirror / Vim 原生光标系统分裂成了两套。

这在非 Vim 模式下还能勉强提供输入能力，但在 Vim normal mode 下会暴露根本矛盾：

- 表格 cell 本身是 widget，不是可编辑源码 DOM
- `@replit/codemirror-vim` 的 normal-mode caret 由 CodeMirror 的 `.cm-vimCursorLayer` / `.cm-fat-cursor` 绘制
- overlay `textarea` 的原生 caret 不是 Vim normal caret，也不在 CodeMirror selection 体系里

用户实际要的交互更接近 Obsidian：表格视觉上是 widget，但表格内的文本位置、normal-mode caret、方向键/Vim motion，仍然由 CodeMirror 主编辑器的 selection 驱动。行列 handle 只是结构 affordance，不参与单个 cell 的文本光标语义。

## Goals / Non-Goals

**Goals:**

- 在 `livePreview=true` 时继续把合法 GFM 表格渲染为结构化 table widget，而不是直接显示 Markdown 源码
- 让表格内的 normal-mode caret 与普通文本区域一样，由 CodeMirror 主 selection 和 Vim cursor layer 表达
- 让单个 cell 只承载“文本位置”语义，不再依赖 overlay 承担 normal-mode 的光标显示
- 让非 Vim 模式与 Vim 模式都能从表格外平滑进入表格，并把光标落到 cell 内容中的具体字符位置
- 保留共享 overlay 作为插入态原生输入桥接层，但把它收窄为 insert/editing 专用能力，而不是表格内统一的光标承载层
- 保留行列 handle、右键菜单、末尾追加按钮等结构 affordance，并把结构选中严格限制在这些入口上

**Non-Goals:**

- 不实现每个 cell 一个独立 EditorView 的嵌套编辑器
- 不在本次引入多 cell 框选、矩形编辑、拖拽调整列宽
- 不要求 `livePreview=false` 时提供结构化表格交互
- 不追求一比一复刻 Obsidian 的闭源实现细节；目标是采用同类架构原则

## Decisions

### 1. 表格内文本位置的唯一真相源是 CodeMirror selection

**决策**：单元格内的“当前在第几行第几列、第几个字符位置”必须由 CodeMirror 主编辑器的 selection 表达，而不是由 overlay 的 `selectionStart/selectionEnd` 单独维护。

**结果**：

- `focusCell` 只缓存当前解析出的 cell 身份，不再单独代表用户可见光标
- normal mode 下光标位置必须能完全从 `view.state.selection` 推导
- 非 Vim 标准模式下的光标位置也同样由 `view.state.selection` 推导
- overlay 如存在，必须把它的选区同步回主 selection，而不能反客为主

**理由**：

- 只有这样，CodeMirror 的原生 cursor layer 和 Vim 的 `.cm-vimCursorLayer` 才能继续正常工作
- 方向键、Vim motion、撤销、事务过滤都已经以主 selection 为核心
- 如果表格内另起一套光标系统，normal / insert / 鼠标 / 键盘之间会持续失配

### 2. 单个 cell 的默认状态是“cell 内文本光标”，不是“整格选中”

**决策**：单个 cell 绝不再拥有独立的整格选中态。用户进入 cell 的结果总是“cell 内容中的文本位置”，而不是“这个格子高亮了但里面没有真实光标”。

**结果**：

- `cm-structured-table-cell-active` 只是一种基于当前位置的视觉强调，不代表独立状态
- 单个 cell 的 active 外观必须从当前 selection 映射而来
- 单个 cell 被点击、通过方向键进入、或通过 Vim motion 进入时，都必须立刻得到文本位置

**理由**：

- 单个 cell 的整格选中态没有文本编辑价值
- 用户真正关心的是“我现在在这个 cell 的哪一个字符上”

### 3. 结构选中只属于 handle 入口，且与文本光标态并列

**决策**：整行/整列结构选中继续保留，但只由行 handle、列 handle 和相关菜单入口触发。单个 cell 内容区域永远不再进入结构选中。

**结果**：

- `structureSelection` 仍然存在，但只用于行列操作
- 点击 cell 内容时必须清掉 `structureSelection`
- 点击 handle 时可以清掉当前 cell 文本态高亮，但不需要发明“单 cell 结构选中”

**理由**：

- 结构操作和文本编辑是两类不同的意图
- 把结构选中限定在 handle 上，能消除状态歧义

### 4. 表格 widget 必须为隐藏源码位置提供坐标映射

**决策**：结构化 table widget 必须实现“源码隐藏位置 -> 屏幕坐标”的映射能力，使 CodeMirror 能把普通光标和 Vim block cursor 画到表格 cell 内部。实现上优先使用 `WidgetType.coordsAt(...)` 及相关 widget 定位能力。

**结果**：

- 表格虽然以 `Decoration.replace({ block: true, widget })` 的形式替换源码，但 selection 仍可以停在表格对应的源码范围内
- 当 selection 落在某个 cell 的隐藏源码范围时，CodeMirror / Vim 的光标层必须能落到该 cell 中对应的视觉字符位置
- 正常光标与 `.cm-fat-cursor` 都不再依赖 overlay 才能显示

**理由**：

- 这是让表格表现“像普通文本一样”的关键
- Obsidian 的 DOM 也显示它把 `.cm-vimCursorLayer` 继续放在 CodeMirror 主编辑器里，而表格 widget 本身是 `contenteditable="false"`

### 5. overlay 降级为 insert/editing 的输入桥接层

**决策**：共享 overlay 不再承担 normal-mode caret 显示，不再负责“进入表格”的默认表现。它只在确实需要原生文本输入桥接时出现，例如：

- 非 Vim 模式下的显式 cell 编辑会话
- Vim insert mode 下的 cell 输入会话
- 需要 IME / 原生粘贴 / 原生选区时

**结果**：

- normal mode 下，overlay 默认隐藏
- 非 Vim 模式下，若继续使用 overlay，主 selection 仍需保持在 cell 对应源码位置，overlay 只是输入桥
- Vim insert mode 下，overlay 可以继续作为输入桥，但退出到 normal mode 后必须立刻让控制权回到 CodeMirror selection + cursor layer

**理由**：

- overlay 擅长承载原生输入，但不适合承载 Vim normal caret
- 只把它留在 insert/editing 场景，可以减少系统冲突

### 6. 从表格外进入表格，本质上是“把 CodeMirror 光标移动到表格源码中的某个 cell 位置”

**决策**：无论是标准模式的 `ArrowUp/ArrowDown`，还是 Vim normal mode 的 `j/k`，从表格外进入表格时，真正发生的动作都应该是：

1. 识别相邻表格 widget
2. 计算目标 cell 的源码位置
3. 把主 selection 移到该位置
4. 由 widget 的坐标映射和 cursor layer 自然显示出 cell 内光标

**结果**：

- `j` 从表格上方进入时，selection 落到第一行第一列 cell 的 `contentFrom`
- `k` 从表格下方进入时，selection 落到最后一行第一列 cell 的 `contentFrom`
- 非 Vim 标准模式按方向键进入表格时，也走同一条主 selection 路线

**理由**：

- 这样进入表格的行为和普通文本区域保持同一种“移动主光标”的心智模型
- 也避免为“进入表格”单独制造 cell focused / cell selected 中间态

### 7. 表格内 normal-mode 导航以源码位置 + cell 边界裁剪来定义

**决策**：表格内的 normal-mode 导航不再通过 overlay 的 DOM 选区来计算，而是通过当前源码位置和当前 cell 边界来计算。

**结果**：

- `h/l` 先在当前 cell 的源码内容范围内逐字符移动；仅当到达边界时才跳到相邻 cell
- `j/k` 按列在相邻行之间移动，并尽量保留当前在 cell 内的相对 offset
- `w/b` 只在当前 cell 的源码内容内移动
- 非 Vim 模式的左右上下规则也可以复用同一套 cell 边界与 offset 计算

**理由**：

- 这条规则与 CodeMirror / Vim 的选择移动天然兼容
- 它不要求 overlay 必须处于可见状态

### 8. Insert mode 进入与退出必须显式切换“输入桥是否开启”

**决策**：进入 insert/editing 和返回 normal mode 时，系统必须显式切换当前 cell 是否开启输入桥，而不是靠被动布尔值推断。

**结果**：

- `i/a`、鼠标点击 cell、非 Vim 下方向键进入 cell 等动作，都会触发 `enterCellEditing(...)`
- 点击表格外、切换到另一 cell、编辑器真正失焦到外部、映射失效等动作，都会触发 `exitCellEditing(...)`
- 这两个动作必须同步：
  - UI 状态
  - overlay 显隐
  - 主 selection 位置
  - Vim insert/normal mode 的配合

**理由**：

- 进入/退出编辑是显式用户动作，不应只靠“当前是不是 Vim insert mode”倒推
- 这样更容易覆盖真实交互测试

**补充约束**：

- 非 Vim 模式下，`Esc` 不承担表格专用退出语义
- Vim 模式下，`Esc` 只承担 Vim 的标准语义：从 insert mode 返回 normal mode，并保留当前 cell 的文本光标锚点

### 9. 滚出 viewport 不结束编辑；后续输入负责把活动 cell 滚回可见区

**决策**：活动 cell 因滚动暂时离开 viewport 时，编辑会话 MUST 保持存在。编辑器不得仅因 cell 暂时不可见就结束当前编辑态。若用户在该状态下继续输入，编辑器 SHALL 将当前活动 cell 自动滚回最近可见边缘，再继续完成输入。

**结果**：

- 单纯滚动不会触发 `exitCellEditing(...)`
- 活动 cell 从 viewport 上侧滚出后继续输入时，编辑器 SHALL 将其滚回到可见区域顶部附近
- 活动 cell 从 viewport 下侧滚出后继续输入时，编辑器 SHALL 将其滚回到可见区域底部附近
- 输入、IME、粘贴与选区同步都必须在滚回后继续成功执行，而不是丢失本次输入

**理由**：

- 滚动不是“退出编辑”的显式意图
- 这更符合 Obsidian 一类 CodeMirror-based 编辑器的用户心智
- 相比“滚出即结束编辑”，保持编辑态并自动滚回更连贯，也更少误伤用户输入

### 10. 真实交互测试必须覆盖“CodeMirror 主光标落在 widget 内部”的链路

**决策**：自动化测试和手工验证都必须优先覆盖以下主链路，而不是只检查 active class 或 overlay class：

- 从表格外进入表格后，主 selection 是否落到目标 cell 对应源码位置
- Vim normal mode 下 `.cm-vimCursorLayer` 是否仍然可见并定位到表格区域
- 非 Vim 标准模式下普通 caret 是否能在表格内继续左右上下移动
- insert mode 进入/退出后，selection 锚点是否仍与 cell 文本位置一致

**理由**：

- 这是当前实现最容易“视觉上好像差不多，实际上原理不对”的地方
- 只有测主 selection 和真实按键链路，才能防止再次出现假通过

### 11. Sandbox 必须暴露不依赖单一快捷键路径的撤销验证入口

**决策**：`/#/sandbox/` 作为回归验证位，不能把 `6.10` 一类事务级验证完全建立在单一平台快捷键之上。对于撤销 / 重做这类受焦点路由、overlay 输入桥和操作系统快捷键差异影响的行为，sandbox MUST 提供显式的验证入口，例如独立的撤销 / 重做控制项。

**结果**：

- 开发者在 sandbox 中验证连续 cell 编辑后的撤销顺序时，不必依赖特定平台的 `Cmd+Z` / `Ctrl+Z`
- 即使当前焦点落在表格 overlay 或其它输入桥上，sandbox 仍然提供一条稳定的人工验证路径
- 该入口的职责是“触发编辑器当前实例上的 undo / redo 命令”，不是定义新的产品功能

**理由**：

- `6.10` 关注的是事务与撤销栈顺序，而不是某个特定 UI 控件
- 仅依赖快捷键会把平台差异、浏览器拦截和焦点竞态混入验证噪音
- sandbox 的职责本来就是提供更强的回归验证控制面

### 12. 结构删除的安全守卫需要区分“保护”与“整表收口”

**决策**：行列结构删除不应一概采用“最后一个不能删”的保守规则，而应区分两类情形：

- 对表头行，保护它在仍有数据行时不被误删
- 对最后一列，不做“永远禁止删除”的保护，而是在用户明确删除最后一列时直接删除整张表

**结果**：

- 行 handle、右键菜单与 Vim `dd` 在“表头保护”上需要共享同一套守卫：只要仍有数据行，表头行就不能被普通删除操作移除
- 列 handle 与右键菜单在删除最后一列时，不得留下零列表格或语法残片，而是要把整张表从文档中移除
- “删除最后一列”属于显式结构操作意图，不应再被误判为需要额外阻止

**理由**：

- 表头保护解决的是“误删结构骨架”的问题
- 删除最后一列时，用户表达的是“继续删除结构”的明确意图；此时整表删除比制造一个无法成立的零列表格更合理
- 这条规则也让鼠标结构操作与 Vim 下“仅剩表头时删整表”的收口语义更一致

## Architecture Sketch

```text
Markdown source in CodeMirror doc
        |
        v
structured table mapping
        |
        v
Decoration.replace(block widget)
        |
        +--> widget DOM renders table / handles / menus
        |
        +--> widget coordsAt(pos) maps hidden source positions to cell-local screen coords

CodeMirror selection
        |
        +--> standard cursor layer
        +--> Vim cm-vimCursorLayer / cm-fat-cursor
        +--> table active cell highlighting derived from current position

overlay textarea (optional, insert-only)
        |
        +--> IME / paste / native input bridge
        +--> syncs to main selection, never replaces it as source of truth
```

## State Sketch

```text
A. Main selection in normal document text
   普通文本区域

B. Main selection inside table source range
   推导出当前 cell + cell 内 offset
   normal mode / 非 Vim 光标都从这里渲染

C. Structure selection
   仅由 row/column handle 触发

D. Optional editing bridge
   仅 insert/editing 时开启
   不负责 normal caret
```

不再允许下面这个旧状态成为用户可见主状态：

```text
单个 cell 整格高亮，但没有真实文本位置
```

## Implementation Notes

- `StructuredTableWidget` 需要为 cell DOM 建立稳定的定位缓存，支持“文档位置 -> cell DOM / 文本片段 -> 屏幕坐标”的反查
- `resolveCurrentFocusCell()` 应改为主 selection 派生，而不是优先相信旧的 `focusCell`
- `focusCell` 可以保留，但它更像缓存/辅助状态；真正权威的是 selection 所在的 table range
- normal-mode 下点击 cell 内容，应直接设置主 selection 到目标 cell 的源码偏移，再让 widget 根据 selection 渲染 active 外观
- Vim 自定义 motion (`j/k`) 与标准 keymap (`ArrowUp/ArrowDown`) 应共享同一条“进入相邻表格”逻辑
- 若首版 `coordsAt` 无法做到逐字符级精确定位，允许先保证：
  - cell 起始/结尾位置准确
  - active cell 正确
  - Vim / 标准光标能稳定落入 cell 内部
  之后再迭代字符级精度

## Risks

- **Widget 坐标映射复杂度高**：需要把隐藏源码位置映射到表格 DOM 内字符坐标，首版可能只能保证边界和近似字符定位
- **CodeMirror 原生输入与 replace widget 的组合有边界问题**：特别是 IME、拖拽选区和复杂粘贴，可能仍需要 insert-only overlay 兜底
- **当前测试对真实光标层覆盖不足**：需要避免再用仅检查 class 的方式冒充光标存在
- **focusCell 与 selection 双轨状态可能短期并存**：重构过程中必须持续明确谁是 source of truth，避免倒挂
