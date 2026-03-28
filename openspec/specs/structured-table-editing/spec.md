# structured-table-editing

## Purpose

定义合法 GFM Markdown 表格在 `livePreview` 下的结构化渲染、单元格编辑、导航、结构选择和安全增删规则。
## Requirements
### Requirement: 合法 GFM 表格在 livePreview 下进入结构化编辑态

当 `livePreview` 开启且 Markdown 内容被 GFM 解析为合法表格时，编辑器 SHALL 将该区域渲染为真实 table 结构，而不是保留 `|` 分隔的源码视图。该结构化表格 MUST 继续绑定到底层 Markdown 文档，确保所有 cell 编辑与结构操作都会同步回写源码。

#### Scenario: livePreview 渲染合法表格

- **WHEN** `livePreview` 为 `true` 且文档中的表格被 GFM 识别为合法 `Table`
- **THEN** 编辑器 SHALL 将该区域渲染为真实 table 结构
- **AND** 用户 SHALL NOT 看到原始 `|` 与分隔行源码作为主显示形态

#### Scenario: 表格语法不完整时保持源码态

- **WHEN** `livePreview` 为 `true` 但用户尚未输入完整的合法 GFM 表格
- **THEN** 编辑器 MUST 保持该区域为 Markdown 源码态
- **AND** 编辑器 SHALL NOT 渲染不完整的半结构化表格

### Requirement: 单个 cell 只承载文本光标语义，不承载独立结构选中态

在结构化表格内，单个 cell 的默认交互语义 SHALL 是“cell 内容中的文本光标或文本选区”。编辑器 MUST NOT 为单个 cell 提供独立的“整格被选中但没有文本光标”的用户态。结构选中只允许由行 handle 或列 handle 触发。

#### Scenario: 点击单元格内容时进入文本光标态

- **WHEN** 用户点击任意普通 cell 内容区域
- **THEN** 编辑器 SHALL 把当前活动位置落到该 cell 内容中的文本光标或文本选区
- **AND** 编辑器 MUST NOT 只显示单个 cell 的整格选中态

#### Scenario: 行列结构选中只由 handle 触发

- **WHEN** 用户点击某一行或某一列的 `:::` handle
- **THEN** 编辑器 SHALL 进入整行或整列的结构选中态
- **AND** 该选中语义 SHALL 与单个 cell 的文本光标语义区分开

### Requirement: 非 Vim 模式下进入 cell 即进入可编辑文本态

当 Vim 模式关闭时，用户进入单个 cell 的结果 SHALL 是立即获得可输入的文本光标，而不是先进入一个等待二次激活的中间态。鼠标点击、从表格外按方向键进入表格，以及在表格内继续导航，最终都 MUST 落到目标 cell 内容中的文本光标位置。

#### Scenario: 非 Vim 模式下点击 cell 后立即可编辑

- **WHEN** Vim 模式关闭且用户点击任意 cell
- **THEN** 编辑器 SHALL 打开该 cell 的编辑会话
- **AND** 用户随后输入任意字符时 SHALL 直接在该 cell 内容中插入文本

#### Scenario: 点击时尽量贴近点击位置落光标

- **WHEN** Vim 模式关闭且用户点击 cell 内容中的某个位置
- **THEN** 编辑器 SHALL 尽量将光标放到与点击位置对应的字符偏移附近
- **AND** 若无法精确映射，编辑器 SHALL 至少落到最近合理的文本边界，而不是退回整格选中

### Requirement: 活动单元格编辑会话必须保持事务级输入语义

当用户处于结构化表格的活动 cell 编辑会话中时，编辑器 SHALL 以单 cell 编辑会话接管输入法、粘贴、选区与撤销语义。该编辑会话 SHOULD 由共享 overlay `textarea` 承载，而不是为每个 cell 创建独立编辑器实例。所有修改 MUST 作为标准文档 transaction 写回底层 Markdown 文档。

#### Scenario: 点击另一 cell 时转移编辑会话

- **WHEN** 用户正在编辑一个活动 cell，并点击同表中的另一 cell
- **THEN** 编辑器 SHALL 结束当前编辑会话并立即激活目标 cell 的文本光标
- **AND** 已提交到文档的内容 SHALL 保持不变

#### Scenario: 非 Vim 模式下 Esc 不承担表格专用退出语义

- **WHEN** 用户在非 Vim 模式下编辑活动 cell 并按下 `Esc`
- **THEN** 编辑器 MUST NOT 仅因该按键结束当前 cell 编辑会话
- **AND** 该按键 SHALL NOT 被赋予额外的表格专用退出语义

#### Scenario: 失焦时保守结束编辑会话

- **WHEN** 用户点击表格外区域或编辑器失去焦点
- **THEN** 编辑器 SHALL 结束当前编辑会话
- **AND** 已提交到文档的内容 SHALL 保持不变

#### Scenario: 滚动导致活动 cell 离开视口时保持编辑态

- **WHEN** 用户滚动编辑器并使当前活动 cell 离开可见区域
- **THEN** 编辑器 SHALL 保持当前活动 cell 的编辑会话
- **AND** 编辑器 MUST NOT 仅因该 cell 暂时离开 viewport 而结束编辑

#### Scenario: 离开视口后继续输入时自动滚回活动 cell

- **WHEN** 当前活动 cell 已离开 viewport，且用户继续输入字符、进行 IME 输入或执行粘贴
- **THEN** 编辑器 SHALL 先将该活动 cell 滚回最近可见边缘
- **AND** 本次输入或粘贴 SHALL 成功写入当前活动 cell，而不是被丢弃

#### Scenario: 撤销按最近一次 cell 编辑顺序回退

- **WHEN** 用户先编辑一个 cell，再编辑另一个 cell，并触发撤销
- **THEN** 编辑器 SHALL 先撤销最近一次 cell 编辑
- **AND** 编辑器 SHALL NOT 以整张表为粒度一次性回滚

### Requirement: 非活动单元格复用 hybrid 行内渲染能力

结构化表格中的非活动 cell SHALL 复用现有 hybrid 行内渲染规则。对于粗体、斜体、链接、行内代码、图片，以及精确字面量 `<br>` / `<br/>`，编辑器 SHALL 显示接近最终内容的渲染效果；对于其它 HTML 片段，编辑器 SHALL 继续把它们作为普通源码文本处理。

#### Scenario: 常见行内 Markdown 在非活动 cell 中被渲染

- **WHEN** 非活动 cell 中包含粗体、斜体、链接、行内代码或图片语法
- **THEN** 编辑器 SHALL 显示对应的渲染效果
- **AND** 非活动 cell SHALL 不以原始 Markdown 标记作为主要展示形态

#### Scenario: 只有白名单 br 标记被渲染为换行

- **WHEN** 非活动 cell 中包含 `<br>` 或 `<br/>`
- **THEN** 编辑器 SHALL 将该标记渲染为视觉换行
- **AND** 其它 HTML 片段 SHALL 保持普通文本语义

### Requirement: 标准模式下方向键以文本光标优先的二维导航工作

在结构化表格内，标准模式方向键 SHALL 以“cell 内文本光标优先，跨 cell 次之”的规则工作。编辑器 MUST 根据当前 cell 内文本光标位置决定是在当前 cell 内移动，还是跨到相邻 cell。

#### Scenario: 左右方向键先在 cell 内逐字符移动

- **WHEN** 用户在结构化表格内按下 `ArrowLeft` 或 `ArrowRight`，且当前文本光标尚未到达 cell 边界
- **THEN** 编辑器 SHALL 仅在当前 cell 内容范围内移动文本光标
- **AND** 当前活动 cell SHALL 保持不变

#### Scenario: 左右方向键在边界时跨 cell

- **WHEN** 用户在结构化表格内按下 `ArrowLeft` 或 `ArrowRight`，且当前文本光标已经位于 cell 边界
- **THEN** 编辑器 SHALL 移动到左侧或右侧相邻 cell
- **AND** 目标位置 SHALL 是目标 cell 的对应边界文本光标位置

#### Scenario: 从表格外按下方向键进入表格

- **WHEN** 用户位于表格上方普通文本并按下 `ArrowDown`，或位于表格下方普通文本并按下 `ArrowUp`
- **THEN** 编辑器 SHALL 进入边界行第一列的 cell
- **AND** 光标 SHALL 落在该 cell 内容中的文本光标位置，而不是整格选中态

#### Scenario: 上下方向键按列移动

- **WHEN** 用户在结构化表格内按下 `ArrowUp` 或 `ArrowDown`
- **THEN** 编辑器 SHALL 按当前列移动到上一行或下一行的对应 cell
- **AND** 编辑器 SHALL 尽量保留当前 cell 内的相对字符偏移

### Requirement: Enter 与 Tab 在表格内承担导航与扩行职责

在结构化表格内，`Enter` 与 `Tab` SHALL 按电子表格风格工作。`Enter` 负责纵向向下移动，`Shift+Enter` 负责纵向向上移动，`Tab` 负责横向移动；当用户到达表格末端时，编辑器 SHALL 自动新增一行。所有这些动作完成后，目标位置 MUST 停在目标 cell 的文本光标态。

#### Scenario: Enter 向下移动或扩行

- **WHEN** 用户在表格内按下 `Enter`
- **THEN** 编辑器 SHALL 向下移动到同列 cell；若当前位于最后一行，则新增一行并停在新行同列
- **AND** 编辑器 SHALL NOT 在当前 cell 中插入原始换行

#### Scenario: Tab 向右移动或扩行

- **WHEN** 用户在表格内按下 `Tab`
- **THEN** 编辑器 SHALL 向右移动到相邻 cell；若当前位于最后一个 cell，则新增一行并停在新行第一列
- **AND** 目标位置 SHALL 继续是文本光标态

#### Scenario: Shift 组合键保留逆向导航语义

- **WHEN** 用户在表格内按下 `Shift+Enter` 或 `Shift+Tab`
- **THEN** `Shift+Enter` SHALL 向上移动到上一行同列 cell，`Shift+Tab` SHALL 向左移动到前一个 cell
- **AND** 这两个动作都 SHALL 以文本光标态落到目标 cell

### Requirement: 表格源码改写必须遵循保守序列化与规范化规则

表格源码改写 MUST 优先保持源码可读性和结构合法性。对于未受影响的 cell，编辑器 SHOULD 尽可能保持原始 Markdown 文本不变；对于受影响的 cell 或结构，编辑器 SHALL 只做维持合法 GFM 表格所必需的最小规范化。

#### Scenario: 多行纯文本粘贴被规范化为 br

- **WHEN** 用户在活动 cell 内粘贴包含换行的纯文本
- **THEN** 编辑器 SHALL 将这些换行规范化为 `<br>`
- **AND** 编辑器 SHALL NOT 将原始换行直接写入 Markdown 表格源码

#### Scenario: 富文本粘贴退化为纯文本

- **WHEN** 用户在活动 cell 内粘贴包含 HTML 或富文本格式的内容
- **THEN** 编辑器 SHALL 以 `text/plain` 结果作为粘贴输入
- **AND** 编辑器 SHALL NOT 依据剪贴板 HTML 结构直接生成多 cell 或富渲染内容

#### Scenario: TSV 或矩形表格粘贴不拆分为多 cell

- **WHEN** 用户在活动 cell 内粘贴包含制表符或 TSV 结构的文本
- **THEN** 编辑器 SHALL 将其作为当前 cell 的单次纯文本粘贴处理
- **AND** 编辑器 SHALL NOT 自动拆分到多个 cell

#### Scenario: 裸竖线被最小化转义

- **WHEN** 用户在 cell 内容中输入会破坏列分隔的裸 `|`
- **THEN** 编辑器 SHALL 对该字符执行必要转义
- **AND** 编辑器 SHALL 继续保持表格结构合法

#### Scenario: inline code 中的竖线保持原样

- **WHEN** 用户在合法 inline code 代码跨度内输入 `|`
- **THEN** 编辑器 SHALL 保持该字符原样
- **AND** 编辑器 SHALL NOT 因该字符位于代码跨度内而额外插入转义

### Requirement: 行列结构操作采用 handle-only 入口

在结构化表格内，编辑器 SHALL 为桌面用户提供显式的结构操作 affordance。`:::` handle 用于触发行或列的结构选中与右键操作，`+` handle 用于追加行列。单个 cell 内容区域 MUST NOT 成为结构选中的入口。

#### Scenario: 顶部列 handle 选中整列

- **WHEN** 用户点击表头上方的列 handle
- **THEN** 编辑器 SHALL 进入该列的结构选中态
- **AND** 后续上下文菜单 SHALL 作用于整列而不是某个单独 cell

#### Scenario: 左侧行 handle 选中整行

- **WHEN** 用户点击第一列左侧的行 handle
- **THEN** 编辑器 SHALL 进入该行的结构选中态
- **AND** 后续上下文菜单 SHALL 作用于整行而不是某个单独 cell

#### Scenario: 右侧与底部加号追加结构

- **WHEN** 用户点击最后一列右侧的 `+` 或最后一行底部的 `+`
- **THEN** 编辑器 SHALL 在目标方向追加新列或新行
- **AND** 追加后 MUST 保持表格为合法结构

#### Scenario: 左上角交汇处不触发行列 handle 冲突

- **WHEN** 用户将鼠标移动到表头第一格左上角的交汇区域
- **THEN** 编辑器 SHALL 显示中性空白角区
- **AND** 编辑器 SHALL NOT 在该区域同时暴露行和列的竞争命中目标

### Requirement: 结构删除遵循保守保护与整表收口规则

在结构化表格内，删除行列的结构操作 MUST 保持表格语义稳定，并避免留下非法的半残结构。当表格仍包含数据行时，编辑器 MUST 保护表头行不被普通结构删除误删；当用户删除最后一列时，编辑器 SHALL 删除整张表，而不是保留零列的非法表格残片。

#### Scenario: 存在数据行时保护表头行

- **WHEN** 用户通过行 handle、右键菜单或等价结构删除入口尝试删除表头行，且当前表格仍包含至少一行数据行
- **THEN** 编辑器 MUST NOT 删除该表头行
- **AND** 当前表格结构 SHALL 保持不变

#### Scenario: 删除最后一列时删除整张表

- **WHEN** 用户通过列 handle、右键菜单或等价结构删除入口删除该表格的最后一列
- **THEN** 编辑器 SHALL 删除整张表
- **AND** 编辑器 SHALL NOT 在文档中保留零列的非法表格结构

### Requirement: 表头渲染必须遵循 delimiter row 的列对齐语义

在结构化表格内，delimiter row 中定义的列对齐规则 SHALL 同时作用于表头和数据行。表头可以保留 header 语义和加粗样式，但 MUST NOT 再依赖浏览器默认 `th` 居中行为覆盖列对齐语义。

#### Scenario: delimiter row 控制表头对齐

- **WHEN** 结构化表格的 delimiter row 分别使用 `:---`、`:---:`、`---:` 或 `---`
- **THEN** 对应列的表头与数据 cell SHALL 使用同一份列对齐规则
- **AND** `---` 对应的表头 SHALL 显式按左对齐渲染，而不是暴露默认居中样式

### Requirement: 表头需要主题感知的淡背景色

结构化表格的表头行 SHALL 保留轻微视觉强调，但这种强调 MUST 通过极淡背景色实现，并在 light / dark 主题下分别使用合适的弱对比色。该背景色 MUST 低于 active cell / selected cell 的视觉优先级。

#### Scenario: light 主题下表头具有淡背景色

- **WHEN** 编辑器使用 light 主题渲染结构化表格
- **THEN** 表头 cell SHALL 显示极淡背景色
- **AND** 该背景色 SHALL 不覆盖活动单元格的高亮边框与高亮底色

#### Scenario: dark 主题下表头具有淡背景色

- **WHEN** 编辑器使用 dark 主题渲染结构化表格
- **THEN** 表头 cell SHALL 显示适配 dark 背景的极淡背景色
- **AND** 该背景色 SHALL 不覆盖活动单元格的高亮边框与高亮底色

