# structured-table-editing

## Purpose

定义合法 GFM Markdown 表格在 `livePreview` 下的结构化渲染、单元格编辑、导航、结构选择和安全增删规则。
## Requirements
### Requirement: 合法 GFM 表格在 livePreview 下进入结构化编辑态

当 `livePreview` 开启且 Markdown 内容被 GFM 解析为合法表格时，编辑器 SHALL 将该区域渲染为真实 table 结构，而不是保留 `|` 分隔的源码视图。该结构化表格 MUST 继续绑定到底层 Markdown 文档，确保所有 cell 编辑与结构操作都会同步回写源码。若这次合法化来自逐字符手动输入，且用户正是通过最后一个字符跨过合法 GFM 表格阈值，则编辑器 MUST 在首次结构化激活时保持连续录入语义：当当前表格仅包含表头行与 delimiter 行时，编辑器 SHALL 自动补齐首个空数据行，并将光标放到该数据行第一列 cell 的文本光标位置。完整表格的粘贴、撤销重放和程序化写入 MUST NOT 触发这条自动补齐语义。

#### Scenario: livePreview 渲染合法表格

- **WHEN** `livePreview` 为 `true` 且文档中的表格被 GFM 识别为合法 `Table`
- **THEN** 编辑器 SHALL 将该区域渲染为真实 table 结构
- **AND** 用户 SHALL NOT 看到原始 `|` 与分隔行源码作为主显示形态

#### Scenario: 表格语法不完整时保持源码态

- **WHEN** `livePreview` 为 `true` 但用户尚未输入完整的合法 GFM 表格
- **THEN** 编辑器 MUST 保持该区域为 Markdown 源码态
- **AND** 编辑器 SHALL NOT 渲染不完整的半结构化表格

#### Scenario: 手动录入到合法表格阈值时自动补首个空数据行

- **WHEN** `livePreview` 为 `true`，且用户手动输入的 Markdown 在本次编辑后首次形成只包含表头行与 delimiter 行的合法 GFM 表格
- **THEN** 编辑器 SHALL 立即为该表格补齐首个空数据行
- **AND** 编辑器 SHALL 将活动光标放到该空数据行第一列 cell 的文本光标位置

#### Scenario: 完整表格粘贴不触发额外补齐

- **WHEN** 用户通过粘贴一次性插入完整合法的 Markdown 表格
- **THEN** 编辑器 SHALL 按合法表格渲染该区域
- **AND** 编辑器 SHALL NOT 仅因该次粘贴而额外补齐首个空数据行或尾随空行

#### Scenario: 非文档末尾激活时不额外追加尾随空行

- **WHEN** 同一类首次激活发生在文档中部，且该表格后方已存在普通文本或后续块内容
- **THEN** 编辑器 SHALL 保持表格后方现有文档结构不变
- **AND** 编辑器 SHALL NOT 仅因首次激活而额外插入新的尾随空行

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

当用户处于结构化表格的活动 cell 编辑会话中时，编辑器 SHALL 以单 cell 编辑会话接管输入法、粘贴、选区与撤销语义。该编辑会话 SHOULD 由共享 overlay `textarea` 承载，而不是为每个 cell 创建独立编辑器实例。所有修改 MUST 作为标准文档 transaction 写回底层 Markdown 文档。若用户的最后一次逐字符输入首次触发表格结构化激活，并导致系统自动补齐首个空数据行或文档尾部普通文本空行，这些系统补写 MUST 与该次输入共享同一个撤销语义；第一次撤销 SHALL 直接回退到触发临界点之前的源码状态。

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

#### Scenario: 首次激活的自动补齐与触发字符共享同一个撤销语义

- **WHEN** 用户输入最后一个字符首次触发表格结构化激活，且编辑器自动补齐了首个空数据行或文档尾部空行
- **THEN** 用户第一次撤销 SHALL 直接回到该字符输入前的源码状态
- **AND** 用户再次输入同样的触发字符时，编辑器 SHALL 再次进入同样的首次激活路径

### Requirement: 文档尾部手动激活的表格必须保留普通文本出口

当用户手动录入的合法 GFM 表格在文档末尾首次进入结构化态时，编辑器 SHALL 保证该表格下方存在一个普通文本空行，作为表格外的继续写作出口。这条要求 MUST 与“自动补齐首个空数据行”同时成立，不得互相覆盖。

#### Scenario: 文档末尾首次激活时同时补齐首个空数据行与尾随空行

- **WHEN** `livePreview` 为 `true`，且用户手动输入的表格在文档末尾首次形成合法 GFM 表格，并且当前仅有表头行与 delimiter 行
- **THEN** 编辑器 SHALL 为该表格补齐首个空数据行
- **AND** 编辑器 SHALL 在该表格下方追加一个普通文本空行

#### Scenario: 文档末尾首次激活后优先把光标留在表格首个空数据行

- **WHEN** 文档末尾表格首次激活后，编辑器同时创建了首个空数据行与尾随空行
- **THEN** 活动光标 SHALL 停在首个空数据行第一列 cell 的文本光标位置
- **AND** 尾随空行 SHALL 作为可达的普通文本位置保留在表格下方

### Requirement: 文档末尾表格下方空行的删除采用两段式整表删除守卫

当用户位于文档最后一行的空行行首，且该空行紧邻在一个终端结构化表格下方时，编辑器 MUST 拦截会删除前一字符的后退删除操作，避免直接删除连接换行并破坏表格结构。第一次删除 SHALL 选中上方整张表；只有在整表已被选中的前提下再次删除，编辑器才真正删除该表格。

#### Scenario: 第一次后退删除先选中上方整张表

- **WHEN** 用户位于文档最后一行的空行行首，上一块内容是终端结构化表格，并执行一次后退删除
- **THEN** 编辑器 MUST NOT 立即删除该空行与表格之间的连接换行
- **AND** 编辑器 SHALL 改为选中上方整张表

#### Scenario: 第二次后退删除才真正删除整张表

- **WHEN** 上方终端表格已经处于整表选中态，且用户再次执行后退删除
- **THEN** 编辑器 SHALL 删除该整张表
- **AND** 编辑器 SHALL NOT 保留会导致非法表格残片的源码结构

#### Scenario: 第二次后退删除后光标停在表格上方一行

- **WHEN** 用户通过第二次后退删除删除了上方整张表
- **THEN** 光标 SHALL 停留在该表格上方一行
- **AND** 编辑器 SHALL NOT 把光标重新放回已删除表格原本占据的尾部位置

#### Scenario: 撤销整表删除时恢复表格与尾随空行

- **WHEN** 用户刚刚通过两段式删除移除了终端表格，并立即执行撤销
- **THEN** 编辑器 SHALL 完整恢复该表格及其下方普通文本空行
- **AND** 光标 SHALL 回到该尾随空行的行首

#### Scenario: 非守卫场景下保持普通删除语义

- **WHEN** 当前删除操作不满足“文档最后一行空行行首且上方为终端结构化表格”的守卫条件
- **THEN** 编辑器 SHALL 保持原有的普通删除语义
- **AND** 编辑器 SHALL NOT 额外进入整表选中态

### Requirement: 整表选中只作为终端删除守卫的暂态存在

为终端表格删除守卫引入的整表选中态 MUST 是一个可退出的暂态，而不是新的长期编辑 mode。进入该状态时，编辑器 SHALL 保留触发守卫前的锚点光标位置，即文档最后一行空行的行首。若用户不再继续删除，而是点击、按方向键或继续输入，编辑器 SHALL 退出整表选中，并从该锚点位置恢复正常编辑语义。

#### Scenario: 点击其他位置会退出整表选中

- **WHEN** 终端表格已经处于整表选中态，且用户用鼠标点击空白处或其它编辑位置
- **THEN** 编辑器 SHALL 退出整表选中
- **AND** 本次点击 SHALL 按普通点击语义生效

#### Scenario: 方向键按锚点位置的普通移动语义执行

- **WHEN** 终端表格已经处于整表选中态，且用户按下方向键
- **THEN** 编辑器 SHALL 退出整表选中
- **AND** 方向键 SHALL 以触发守卫前那个锚点光标位置为起点按普通移动语义执行

#### Scenario: 继续输入会退出整表选中并在锚点位置写入文本

- **WHEN** 终端表格已经处于整表选中态，且用户继续输入文本字符
- **THEN** 编辑器 SHALL 退出整表选中
- **AND** 本次输入 SHALL 在触发守卫前那个锚点光标位置写入文档

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

结构化表格的表头行 SHALL 保留轻微视觉强调，但这种强调 MUST 通过 resolved editor theme 中的表格 token 提供，而不是仅按 light / dark 字符串分支写死。该背景色 MUST 低于 active cell / selected cell 的视觉优先级。

#### Scenario: 预置主题下表头背景色正常工作

- **WHEN** 编辑器使用 `'light'` 或 `'dark'` 预置主题渲染结构化表格
- **THEN** 表头 cell SHALL 使用对应预置主题中的表头背景色

#### Scenario: 自定义主题覆盖表头背景色

- **WHEN** 编辑器使用 `{ type: 'dark', table: { headerBackground: 'rgba(99, 102, 241, 0.12)' } }` 渲染结构化表格
- **THEN** 表头 cell SHALL 使用 `rgba(99, 102, 241, 0.12)` 作为背景色
- **AND** 该背景色 SHALL 不覆盖活动单元格的高亮边框与高亮底色
