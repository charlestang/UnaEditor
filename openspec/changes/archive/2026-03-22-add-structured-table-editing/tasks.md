## 1. Table Foundation

- [x] 1.1 将编辑器的 Markdown 语言配置切换到 GFM 基线，并补充现有 hybrid 能力的回归验证
- [x] 1.2 实现表格语法树到表格坐标的映射层，覆盖 table、row、cell 与源码范围的双向定位
- [x] 1.3 实现表格源码改写工具，支持单元格内容更新、追加数据行、追加数据列、删除数据行和删除数据列，并覆盖换行规范化、必要转义、对齐分隔保留和缺失尾部 cell 补齐
- [x] 1.4 为结构化表格建立独立的 block plugin / command 分层，避免把重交互逻辑直接耦合到通用 hybrid decoration 重建路径

## 2. CodeMirror-Native Cell Caret Rework

- [x] 2.1 重构表格 UI 状态模型，明确“主 selection 是单元格内文本位置的唯一真相源”，`focusCell` 仅作为派生缓存或辅助状态
- [x] 2.2 为结构化 table widget 建立“隐藏源码位置 -> widget 屏幕坐标”的映射能力，使普通 caret 与 Vim `.cm-vimCursorLayer` 都能落进 cell 内部
- [x] 2.3 重构 cell 点击路径：点击 cell 时先把主 selection 设到目标 cell 的源码偏移，再由 widget 和 cursor layer 表达文本光标，不得只显示 active 样式
- [x] 2.4 重构 overlay `textarea` 生命周期，使其降级为 insert/editing 专用输入桥，不再承担 normal mode 下的光标显示职责
- [x] 2.5 明确并实现点击另一 cell、点击表格外、失焦、映射失效等场景下的 selection / 编辑桥切换规则，并将“滚出 viewport”重定义为保持编辑态

## 3. Structured Table Interaction Semantics

- [x] 3.1 重构标准模式下的方向键导航，使 `ArrowLeft` / `ArrowRight` 先在 cell 内逐字符移动，只有命中边界时才跨到相邻 cell
- [x] 3.2 补全从表格外按 `ArrowUp` / `ArrowDown` 进入表格的规则：进入边界行第一列 cell，并以文本光标态落点
- [x] 3.3 重构 `ArrowUp` / `ArrowDown` 在表格内的按列移动，尽量保留当前 cell 内相对字符偏移；目标 cell 更短时夹紧到尾部
- [x] 3.4 调整 `Enter` / `Shift+Enter` / `Tab` / `Shift+Tab` 的导航与扩行规则，确保到达目标后停在目标 cell 的文本光标态
- [x] 3.6 复核单 cell 纯文本粘贴协议，继续统一读取 `text/plain`，将换行规范化为 `<br>`，并且不把 TSV / 矩形剪贴板拆分成多 cell 更新

## 4. Vim And Structure Rules

- [x] 4.1 重构 Vim normal mode 下 `j` / `k` 从普通文本进入表格的语义：通过主 selection 进入边界行第一列 cell，并让 `.cm-fat-cursor` 落到 cell 内容起始处
- [x] 4.2 重构 Vim normal mode 下 `h` / `l` / `w` / `b` 的 cell 内文本移动语义，确保优先在当前 cell 内容内移动，只有边界时才跨 cell
- [x] 4.3 重构 Vim normal mode 下 `j` / `k` 在表格内的按列导航，使其尽量保留当前 cell 内的相对字符偏移
- [x] 4.4 接入并验证 `i` / `a` 等 Vim 进入插入态命令，确保它们在当前 cell 文本光标位置生效，并仅在需要原生输入时打开编辑桥
- [x] 4.5 复核 `Esc` 在 Vim insert mode 下退出表格编辑会话后的行为，确保回到当前 cell 的 normal mode 文本光标锚点，并把控制权交还 CodeMirror cursor layer
- [x] 4.6 复核 `dd`、表头保护和“删除最后一列时删除整表”规则，确保鼠标结构操作与 Vim 命令遵循同一套安全守卫
- [x] 4.7 收敛结构入口边界：行列 handle 保留为唯一结构选中入口，单个 cell 内容区域不得触发行列结构选中

## 5. Automated Verification

- [x] 5.1 更新组件测试，覆盖合法表格渲染、不完整表格回退和 `livePreview=false` 源码回退
- [x] 5.2 更新组件测试，覆盖非 Vim 模式下点击 cell 后主 selection 立即进入 cell 文本位置、光标落点接近点击位置，以及单个 cell 不再出现独立整格选中态
- [x] 5.3 更新组件测试，覆盖标准模式下从表格外用方向键进入表格、cell 内字符级导航、按列移动与扩行，并确认普通 caret 落在表格内部
- [x] 5.4 更新组件测试，覆盖撤销顺序、IME 组合输入、纯文本粘贴退化、换行规范化、裸 `|` 转义和 inline code 中 `|` 保留
- [x] 5.5 更新组件测试，覆盖行列 handle、左上角中性角区、右键菜单、整行整列删除、“删除最后一列时删除整表”和新增行列
- [x] 5.6 更新组件测试，覆盖 Vim 模式下从普通文本进入表格、`h` / `l` / `j` / `k` / `w` / `b` 的 cell 内文本移动、`i` / `a` 进入插入态、`Esc` 返回 normal mode 锚点、`dd` 的表头保护与“仅剩表头时删除整表”，以及 `.cm-vimCursorLayer` 在表格内的真实落点
- [x] 5.7 更新 Playground 的表格示例内容与验证控制项，覆盖非 Vim 文本光标编辑、Vim normal/insert 切换、结构 affordance、`<br>` 换行、源码兜底路径，以及 `6.10` 需要的撤销 / 重做触发入口

## 6. Manual Verification Gate

- [x] 6.1 手工验证：`livePreview=true` 且输入合法 GFM 表格时，表格显示为结构化 table，而不是 `|` 源码
- [x] 6.2 手工验证：`livePreview=false` 时，同一段表格完全回退为 Markdown 源码态
- [x] 6.3 手工验证：刻意删坏某一行列数，使表格不再完整时，表格自动回退为源码态
- [x] 6.4 手工验证：非 Vim 模式下点击普通 cell 后，光标进入该 cell 内容中并立即可编辑，而不是只显示整格高亮
- [x] 6.5 手工验证：非 Vim 模式下点击 cell 内容中不同位置时，光标会尽量贴近点击位置落点
- [x] 6.6 手工验证：点击另一 cell 时，当前编辑立即提交并切换到目标 cell 的文本光标
- [x] 6.7 手工验证：点击表格外区域后，编辑会话结束，但已输入内容保留
- [x] 6.8 手工验证：滚动使活动 cell 离开可见区域后，编辑会话保持存在；继续输入时，该 cell 会自动滚回最近可见边缘并成功写入内容
- [x] 6.9 手工验证：使用中文输入法在活动 cell 中连续输入文本，组合态不会丢字或重置
- [x] 6.10 手工验证：连续编辑两个不同 cell 后，通过快捷键或 sandbox 提供的撤销入口触发回退时，撤销顺序按最近一次编辑优先回退
- [x] 6.11 手工验证：在普通文本中输入 `|` 时，源码会最小化转义为 `\|`
- [x] 6.12 手工验证：在合法 inline code 中输入 `|` 时，源码保持原样，不额外转义
- [x] 6.13 手工验证：在活动 cell 中粘贴多行纯文本时，换行被规范化为 `<br>`
- [x] 6.14 手工验证：在活动 cell 中粘贴带 HTML 样式的内容时，结果按 `text/plain` 退化处理
- [x] 6.15 手工验证：在活动 cell 中粘贴 TSV / 表格矩形区域时，不会自动拆分成多个 cell 更新
- [x] 6.16 手工验证：非活动 cell 中仅 `<br>` 与 `<br/>` 被渲染为换行，其它 HTML 片段保持源码文本
- [x] 6.17 手工验证：从表格外按 `ArrowDown` / `ArrowUp` 进入表格时，会进入边界行第一列 cell 的文本光标态，而不是单个 cell 的整格选中态
- [x] 6.18 手工验证：`ArrowLeft` / `ArrowRight` 在 cell 边界内逐字符移动，越界时才跳到相邻 cell
- [x] 6.19 手工验证：`ArrowUp` / `ArrowDown` 在表格内按列移动，并尽量保留当前 cell 内的相对字符偏移
- [x] 6.20 手工验证：`Enter` 向下移动；在最后一行时自动新增一行，并停在目标 cell 的文本光标态
- [x] 6.21 手工验证：`Shift+Enter` 向上移动；在首行时保持当前位置
- [x] 6.22 手工验证：`Tab` 向右移动；在最后一个 cell 时自动新增一行并跳到新行第一列
- [x] 6.23 手工验证：`Shift+Tab` 向左移动到前一个 cell
- [x] 6.25 手工验证：顶部 `:::` handle 可选中整列，并通过右键菜单删除或前后插入列
- [x] 6.26 手工验证：左侧 `:::` handle 可选中整行，并通过右键菜单删除或前后插入行
- [x] 6.27 手工验证：右侧 `+` handle 可在末尾追加新列
- [x] 6.28 手工验证：底部 `+` handle 可在末尾追加新行
- [x] 6.29 手工验证：左上角交汇处显示中性空白角区，不会触发行列 handle 冲突
- [x] 6.30 手工验证：单个 cell 内容区域不会进入整行、整列或单 cell 结构选中态
- [x] 6.31 手工验证：当表格仍包含数据行时，删除表头行的操作会被保护，不会误删表头
- [x] 6.32 手工验证：Vim normal mode 下从表格相邻普通文本行按 `j` / `k` 进入表格时，会落在边界行第一列 cell 的内容起始处，并保持 normal mode
- [x] 6.33 手工验证：Vim normal mode 下点击 cell 内容后，会把当前位置落到该 cell 内容中的文本光标位置，而不是只显示整格高亮
- [x] 6.34 手工验证：Vim normal mode 下进入表格后，`h` / `l` 会先在当前 cell 内逐字符移动，只有打到边界时才跨到相邻 cell
- [x] 6.35 手工验证：Vim normal mode 下 `j` / `k` 在表格内按列移动时，会尽量保留当前 cell 内的相对字符偏移；目标 cell 更短时会夹紧到尾部
- [x] 6.36 手工验证：Vim normal mode 下 `w` / `b` 仅在当前 cell 内移动，不跨入相邻 cell
- [x] 6.37 手工验证：Vim normal mode 下执行 `i` / `a` 时，会从当前 cell 文本光标位置进入 insert mode 并保持输入正常
- [x] 6.38 手工验证：Vim insert mode 下按 `Esc` 返回 normal mode 后，当前 cell 的文本光标位置会保留为后续导航锚点
- [x] 6.39 手工验证：若原本已经处于 Vim insert mode，再通过导航进入表格时，会继续保持 insert mode 并直接进入当前 cell 的编辑会话
- [x] 6.40 手工验证：Vim normal mode 下 `dd` 删除数据行，但在仍有数据行时不会删除表头行
- [x] 6.41 手工验证：Vim normal mode 下若表格仅剩表头行，在表头行执行 `dd` 时会删除整张表，而不会抛出错误
- [x] 6.42 手工验证：删除最后一列时，会删除整张表，而不是保留非法的零列表格
