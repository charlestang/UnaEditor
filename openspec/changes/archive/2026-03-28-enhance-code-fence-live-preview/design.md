## Context

当前围栏代码块的渲染链路分成两部分：

- `codeBlockDecorator.ts` 负责识别 `FencedCode`，并按行给 opening fence、closing fence 与代码正文打上 `cm-code-block-fence` / `cm-code-block-line`
- `codeThemeExtension.ts` 根据这些行级 class 提供背景色、前景色、语法 token 着色和当前的 `::before` 行号样式

这套结构已经能提供“代码块源码被着色”的体验，但距离 Obsidian 的代码块 live preview 还有三个明显差距：

- opening / closing fence 在非激活状态下仍直接暴露为源码
- 复制 affordance 需要另想入口，而不是自然地附着在代码块 header row 上
- 行号虽然可用，但视觉上更像在正文前插了一个带竖线的前缀，而不像代码块壳子内的稳定 gutter

这次变更的目标不是发明一条独立工具栏，而是尽可能模拟 Obsidian 的处理方式：文档仍然保持原始 Markdown，代码块仍然是同一个编辑器里的三类行，但非激活状态下，opening fence 行会表现为 header affordance row，closing fence 则退为块尾壳子语义，body 行继续显示高亮后的代码。

````text
原始文档
L1: ```js
L2: console.log("Hello")
L3: ```

非激活态
L1: [blank gutter slot][header row: JavaScript ...... copy]
L2: [line 1           ][code tokens...]
L3: [blank gutter slot][end cap / hidden closing fence]

激活态
L1: [blank gutter slot][```js]
L2: [line 1           ][code tokens...]
L3: [blank gutter slot][```]
````

## Goals / Non-Goals

**Goals:**

- 在 `livePreview` 下为 fenced code block 提供尽可能贴近 Obsidian 的 begin/body/end 行模型
- 在非激活状态下，将 opening fence 行渲染为代码块内部的 header affordance row，而不是独立工具栏
- 在非激活状态下隐藏 closing fence 的源码显示
- 光标进入 `FencedCode` 任意一行时，按整个代码块恢复 raw fence 源码
- 保持代码块壳子、背景和 gutter-like 行号槽在 active / inactive 之间尽量稳定
- 让 copy affordance 和语言标签与现有语法高亮、代码主题、行号能力协同工作

**Non-Goals:**

- 不在代码块上方插入独立工具栏容器
- 不把代码块替换成独立的嵌套编辑器实例
- 不切换到 CodeMirror 的全局外部 gutter 来承载代码块专用行号
- 不改变 `livePreview=false` 时当前源码态代码块的行号渲染方式
- 不在本次变更中增加执行、折叠、折行控制、主题切换等更重的代码块交互
- 不在本次变更中引入新的 public render hook 或额外的组件事件 API
- 不在本次变更中加入 “Copied” toast 一类额外反馈文案

## Decisions

### Decision 1: 围栏代码块继续建立在原始 Markdown 行之上，而不是整块替换为独立 widget

文档中的 opening fence、body lines、closing fence 仍然保持为原始 Markdown 源码。live preview 只改变这些行在不同状态下的可见内容和附加 affordance，不改变底层文档结构。

**Rationale**

- 这是最贴近 Obsidian / HyperMD 思路的方案
- 不会引入独立编辑器带来的选区映射、撤销栈和输入法复杂度
- 代码主题和嵌套语言高亮可以继续复用现有链路

### Decision 2: `livePreview` 专用的代码块状态机由独立插件拥有，源码态继续沿用现有装饰器

这次变更不把 `codeBlockDecorator.ts` 直接扩展成一切状态都要处理的巨型插件。相反：

- `codeBlockDecorator.ts` 继续服务于源码态和现有基础代码块装饰
- 新增 `codeBlockLivePreview.ts` 一类 `livePreview` 专用插件
- 只有当 `livePreview=true` 时，这个专用插件才负责代码块的 active scope、header affordance、closing fence 隐藏和 faux gutter

**Rationale**

- 可以明确把 Obsidian-like 交互限定在 `livePreview`
- 避免把源码态也拖入更复杂的 widget / replace 结构
- ownership 更清晰，后续调试和回归测试成本更低

### Decision 3: 非激活状态下，opening fence 行拥有 header affordance row，而不是独立工具栏

当某个 `FencedCode` 处于非激活状态时，opening fence 行不显示 raw `````/`~~~` 源码，而是显示一个属于该行的 header affordance row。这个 row 仍然占用 opening line 的位置，只是把源码视觉内容切换为：

- 右上角的 icon-like copy affordance
- 可选语言标签，但仅作为紧邻 copy affordance 的弱提示，不得占据左侧主阅读起点

该 affordance row 必须属于代码块本体的一部分，而不是插入到代码块上方形成独立工具栏。

**Rationale**

- 这更符合 Obsidian 的实际观感与交互模型
- 能显著减少 active / inactive 切换时的布局跳变
- 语义上更清楚：这是 opening fence 行的阅读态，而不是额外的组件层

### Decision 4: fenced code block 的 active scope 由代码块 live preview 插件单独拥有

代码块是否处于 active scope，不再依赖当前 `hybridMarkdown` 里那套专注于 inline / heading / blockquote 的通用 active scope 集合。代码块 live preview 层需要自己基于 `FencedCode` 语法节点和当前 selection 判断：

- 光标或选区落在 opening fence、body lines 或 closing fence 任意位置，都视为该代码块 active
- 光标离开整个 `FencedCode` 范围后，该代码块恢复 inactive

**Rationale**

- 当前实现已经把 `FencedCode` 从通用 hybrid scope 中排除了
- 代码块是块级结构，状态粒度天然应当是整块，而不是某一行或某个 token
- 单独拥有这套判断后，实现更清晰，也更不容易污染其它 live preview 结构

### Decision 5: 代码块 live preview 采用 line class + replace/widget 的混合 primitive

为实现 Obsidian-like 的 begin/body/end 行模型，渲染 primitive 明确拆成三类：

- `Decoration.line`: 为 begin/body/end 行提供稳定的壳子 class、主题锚点和块边界语义
- `Decoration.replace`: 在 inactive 状态下替换 opening fence / closing fence 的源码显示内容
- `Decoration.widget`: 在 opening row 注入 header affordance 内容，并在 begin/body/end 行注入 faux gutter slot

也就是说，不会尝试只靠 `Decoration.line` 或只靠 CSS 完成整套交互。

**Rationale**

- 这样最接近你观察到的 Obsidian / HyperMD 痕迹
- `replace` 适合控制 raw fence 的可见性
- `widget` 适合承载非编辑的 header affordance 和稳定的 leading slot

### Decision 6: active 状态恢复 raw fence，但尽量保留代码块壳子与布局锚点

当代码块进入 active scope 时：

- opening fence 行恢复 raw opening fence 源码
- closing fence 行恢复 raw closing fence 源码
- 代码块的 begin/body/end 行级 class、背景壳子和 faux gutter 槽位尽量继续保留

也就是说，切换时改变的是行内主要显示内容，而不是让整个代码块从“块级壳子”瞬间退回“普通段落文本”。

**Rationale**

- 这能最大程度拟合 Obsidian 的视觉稳定性
- 代码块编辑路径仍然是直接编辑 Markdown 源码，没有失真

### Decision 7: copy affordance 是附着在 opening row 的 trailing icon-like 按钮，其复制源来自文档范围而不是 DOM

copy affordance 需要以非编辑 DOM 节点呈现，并具备明确按钮语义。触发复制时：

- 优先使用 `navigator.clipboard.writeText`
- 复制内容必须来自 opening fence 与 closing fence 之间的正文文档范围
- 复制结果不得依赖当前 live preview DOM 的 `innerText`
- affordance 交互需要阻断不必要的冒泡，避免先触发模式切换再执行 copy

在 `readonly` 场景下，copy affordance MUST 继续可用；`disabled` 场景是否继续开放交互，取决于组件对整体禁用语义的最终约束，但至少不能通过“把控件做成普通文本”来回避这一点。

**Rationale**

- live preview DOM 本身是被装饰过的，不适合作为复制真值来源
- 只读场景下复制代码仍然是合理需求
- 明确按钮语义有助于无障碍和测试稳定性

### Decision 8: 语言标签采用 raw identifier → normalized id → display label 的三层映射

opening fence 中的语言标识符需要同时服务于高亮和 UI，但两者不应各算一套语义。因此设计上拆成三层：

- `raw identifier`: 用户在 opening fence 中写下的原始文本，例如 `js`
- `normalized id`: 与语法高亮共用的归一化语言 id，例如 `javascript`
- `display label`: header row 中展示的规范标签，例如 `JavaScript`

对于已知别名，display label 必须稳定收敛到规范名称。对于未知但非空的 identifier，header row MUST NOT 伪造一个受支持语言名称，也 MUST NOT 直接回显原始字符串；此时直接省略语言标签。

**Rationale**

- 避免 parser alias 与 UI label 脱节
- 支持未来统一扩展语言元数据，而不是在 UI 层散落 if/else

### Decision 9: 行号仅在 `livePreview` 代码块阅读态中采用 block-internal faux gutter

为了避免把 Obsidian-like 结构误扩展到源码态，faux gutter 仅服务于 `livePreview` 下的 fenced code block 阅读态。`livePreview=false` 时，代码块行号可以继续沿用现有源码态渲染策略。

**Rationale**

- 这次 change 的目标明确是拟合 Obsidian 的 live preview
- 源码态不需要承担同样的视觉义务
- 这样可以显著降低回归面

### Decision 10: 行号采用 block-internal faux gutter，而不是 `::before` 伪元素前缀

为了尽量贴近 Obsidian，代码块行号不再继续依赖 `data-code-line-number + ::before` 这套前缀式实现。取而代之的是：

- begin/body/end 每一行都拥有一个稳定的 leading slot
- body 行在该 slot 中显示行号
- opening / closing fence 行保留同宽空槽，不显示数字
- 同一代码块内所有行共享同一个 gutter 宽度
- 视觉上不依赖强烈的竖线分隔，而是通过间距、颜色和对齐形成 gutter 感

这个 faux gutter 属于代码块壳子的一部分，而不是编辑器全局 gutter。

**Rationale**

- 更接近 Obsidian 的实际观感
- 能让 begin/body/end 三种行的内容列严格对齐
- 比 `::before` 更容易和 header row、末尾壳子一起协调

### Decision 11: wrapped code line 的续行必须对齐到代码正文列，而不是 gutter 列

当全局 `lineWrap` 启用且某一行代码在视觉上换行时，续行片段需要继续从代码正文列开始，而不是回退到 faux gutter 之下，也不能与 opening row 的 header affordance 发生水平挤压。

**Rationale**

- 这是 Obsidian-like gutter 观感是否成立的关键
- 如果用整行 padding 模拟 gutter，wrapped line 很容易暴露破绽

### Decision 12: 代码块外壳样式与 header / faux gutter 样式由稳定 selector 拥有

代码块的背景、圆角、header row、faux gutter、正文颜色和 begin/end 边界样式，必须由代码块自己的稳定 class 或 widget selector 提供，而不能把关键视觉语义压在临时 DOM 结构或浏览器默认样式上。

**Rationale**

- 这与前面已经建立起来的“样式 ownership 属于编辑器自身 selector”的原则一致
- 也更利于 light / dark / custom theme 一致表现

### Decision 13: opening fence 行的 header affordance 必须压缩为紧凑的右上角控件组

opening fence 行虽然在 inactive 状态下不再显示 raw fence 源码，但它的视觉高度仍应尽量接近普通代码行，而不是扩展成明显更高的一条 header bar。实现上：

- header affordance 应表现为右上角的一组紧凑控件
- 语言标签若存在，应位于 copy affordance 左侧并右对齐
- 该组控件不得把 opening 行撑成明显高于正文行的空白条

**Rationale**

- 这更贴近你要的 Obsidian 紧凑观感
- opening 行的主作用是提供轻提示与 copy affordance，而不是形成新的视觉层级

### Decision 14: 代码块 shell 在 light / dark 下都必须具备明确但轻量的轮廓区隔

仅依赖代码主题背景色不足以保证 fenced code block 从编辑器正文背景中清晰分离。实现上：

- light 下代码块 MUST 通过细边框、轻微 tint 背景或两者组合与正文区隔
- dark 下代码块 MUST 保留轻微圆角矩形轮廓，避免代码直接融入页面底色
- faux gutter 与代码正文之间 MUST 保留明确的水平 breathing room，而不是紧贴
- faux gutter 本身 SHOULD 通过轻微底色或极细边界与代码正文区区分开
- 代码块 shell 在左右两侧 SHOULD 保留适度 inline inset，避免直接贴住编辑器内容区边缘

**Rationale**

- 这正是你指出的当前视觉缺口
- Obsidian-like 的舒适感很大程度来自“紧凑但清晰”的块级轮廓和 gutter 间距

### Decision 15: `codeFontFamily` 只拥有代码内容，不拥有任何行号列的字体

调用方配置 `codeFontFamily` 时，这个字体选择只应用于 inline code 与 fenced code block 的代码内容本身。编辑器全局 line number gutter、源码态代码块行号以及 `livePreview` faux gutter 的数字列都必须保持独立的数字字体栈，不跟随 `codeFontFamily` 切换。

**Rationale**

- 代码内容与行号列属于不同的视觉语义层级
- 调用方选择代码字体时，预期是改变代码文本观感，而不是连编辑器 chrome 一起改掉
- 将行号字体 ownership 从 `codeFontFamily` 中剥离，可以避免全局 gutter 与代码块内部 gutter 出现不必要的字体漂移

## Risks / Trade-offs

**[Per-row widget count]** → faux gutter 和 opening row affordance 可能增加行内非编辑 DOM 数量。Mitigation: 只在可见范围内构建，沿用当前 visible range decoration 模式。

**[Pointer / focus choreography]** → copy affordance 是编辑区内的可点击控件，若处理不当，点击会先导致 active scope 切换。Mitigation: 明确使用非编辑按钮语义并在事件层阻断无关冒泡。

**[Fence visibility and navigation]** → opening / closing fence 在 inactive 状态下被替换后，可能影响键盘导航、选区跨越和鼠标点击定位。Mitigation: 为进入代码块、离开代码块、跨 fence 选区和只读点击场景补导航测试。

**[Long blocks and gutter width]** → 长代码块需要更宽的行号槽。Mitigation: gutter 宽度基于当前块最大行号位数或稳定 CSS 变量计算，而不是硬编码常量。

**[Wrapped line alignment]** → 全局 `lineWrap` 打开后，faux gutter 容易和续行对齐产生冲突。Mitigation: 为 wrapped line 单独补样式与交互测试，并避免使用整行 padding 冒充 gutter。

## Migration Plan

1. 保持现有代码块高亮、代码主题与 `livePreview` 基础导航回归测试通过
2. 新增 Obsidian-like 代码块交互测试，覆盖 begin/header/end 状态切换、copy affordance 和 faux gutter
3. 在 playground 中增加带语言、无语言、长代码段和开启行号的样例，专门人工检查观感
4. 在归档 / sync `code-block-line-numbers` 主 spec 时，必须替换现有“行号必须通过 CSS 伪元素渲染”要求，而不是把新要求并列追加，避免主 spec 自相矛盾
