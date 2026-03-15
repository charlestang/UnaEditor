## Context

UnaEditor 当前的代码字体和字号为硬编码：代码字体 `ui-monospace, SFMono-Regular, Menlo, monospace`（在 `HYBRID_THEME` 的 inline code 和 fenced code 样式中），正文字号 `font-size: 14px`（在 `.una-editor` CSS 中）。正文字体未显式设置，依赖浏览器默认值。调用方无法通过 API 自定义这些值。

上层应用需要允许用户调整编辑器字体和字号。通过外部 CSS 修改字号会导致 CodeMirror 的行高缓存和光标定位出现问题，因此需要从组件层面提供配置能力。

此外，非 livePreview 模式下 inline code 和 fenced code block 没有专门的 decoration class，代码字体无法生效。需要补充这部分 decoration。

## Goals / Non-Goals

**Goals:**
- 通过 props 提供正文字体、代码字体、字号三个配置维度
- Props 是唯一的字体/字号配置入口，不提供外部 CSS 覆盖口子
- 两种模式（livePreview / 非 livePreview）下代码字体一致生效
- 字体/字号 props 支持运行时响应式变化，与现有 props（theme、lineNumbers、vimMode）行为一致

**Non-Goals:**
- 不提供标题字号的独立配置（标题字号通过 em 相对于正文自动缩放）
- 不提供行高的独立配置
- 不提供代码字号的独立配置（代码字号跟随正文字号）
- 不提供外部 CSS 变量覆盖字体/字号的能力（未来如有定制需求，通过 theme 机制解决）

## Decisions

### Decision 1: Props 为唯一入口，CSS 变量为内部实现细节

Props（`fontFamily`、`codeFontFamily`、`fontSize`）是调用方配置字体/字号的唯一方式。内部实现可以使用 CSS 变量作为 props 到 theme 的传递机制，但 CSS 变量不作为公开 API，不承诺外部可覆盖。

**理由：** 同一件事提供两条路径（props + CSS 变量覆盖）会造成语义矛盾 — 调用方不知道该用哪个，两者同时设置时优先级需要额外解释。既然提供了 props 作为官方 API，就不应该再开 CSS 覆盖口子。未来如有更深层的样式定制需求，应通过 theme 机制统一解决。

**替代方案（已否决）：** CSS 变量 + Props 双通道。Props 设值到容器 CSS 变量上，外部也可直接改 CSS 变量。否决原因：语义矛盾，且需要额外 expose `remeasure()` 方法为 CSS 覆盖场景擦屁股。

### Decision 2: 代码字体 class 与 livePreview 视觉增强 class 分层

当前 `cm-hybrid-inline-code` 同时承载字体和视觉增强（背景色、圆角、padding），`cm-hybrid-fenced-code-line` 同理（背景色 + 字体）。直接在非 livePreview 模式下复用这些 class 会导致源码模式被染成 preview 风格。

**方案：** 拆成两层 class：

- `cm-una-code-font` — typography-only class，只设 `fontFamily: var(--una-code-font-family, ...)`。两种模式共用。
- `cm-hybrid-inline-code` — 仅在 livePreview 模式下附加，负责背景色、圆角、padding 等视觉增强。`fontFamily` 从该 class 中移除，改为继承自 `cm-una-code-font`。
- `cm-hybrid-fenced-code-line` — 同理，`fontFamily` 移除，背景色保留。

livePreview 模式下 inline code 的 decoration 同时加 `cm-una-code-font` 和 `cm-hybrid-inline-code` 两个 class。非 livePreview 模式下 `createCodeDecorationExtension()` 只加 `cm-una-code-font`。

**替代方案：** 通过 `HighlightStyle.define` 给 lezer 的 monospace tag 指定代码字体。缺点是两套机制分别维护字体值，且 lezer tag 粒度不够精确。

### Decision 3: fontSize prop 类型为 `number`，单位固定为 px

`fontSize` 接受 `number` 类型，内部转为 `${value}px` 应用到样式。这比 `string` 类型更简洁，避免调用方传入不一致的单位。livePreview 标题字号使用 `em` 单位，自动跟随正文字号缩放。

**替代方案：** 接受 `number | string`，支持 rem/px 等多种单位。增加了复杂度但灵活性更高。当前场景下 px 足够。

### Decision 4: 运行时字体变化后显式触发 CM6 重新测量

为保持与现有 props（`theme`、`lineNumbers`、`vimMode`）的行为一致，`fontFamily`、`codeFontFamily`、`fontSize` 必须支持运行时响应式变化。

CodeMirror 6 在 `HeightOracle` 中缓存了 `charWidth`、`lineHeight`、`textHeight`，不会自动感知样式变化。仅修改样式而不通知 CM6 会导致光标定位、滚动计算和行高映射与实际渲染不一致。

**方案：** props 变化时，Vue 模板将新的字体 CSS 变量写入容器 DOM，watch 使用 `flush: 'post'` 确保在 DOM 更新完成后，dispatch 一个携带 `remeasureEffect` 的 transaction 通知 CM6 重新测量。`HybridMarkdownPlugin` 在 `update()` 里检测到该 effect 时重建 decorations。对于 `fontFamily` / `codeFontFamily` 变化，还需在 `document.fonts.ready` resolve 后再 dispatch 一次，确保自定义字体加载完成后度量值正确。

**具体流程：**
1. watch（`flush: 'post'`）检测到 fontFamily / codeFontFamily / fontSize 变化
2. Vue 模板已将新的 CSS 变量（`--una-font-family` / `--una-code-font-family` / `--una-font-size`）写入容器 DOM
3. dispatch `remeasureEffect` transaction — CM6 在正常 update cycle 里重新测量，`HybridMarkdownPlugin` 同步重建 decorations
4. 若本次变化涉及 fontFamily / codeFontFamily（对比新旧值判断），额外等待 `document.fonts.ready` 后再 dispatch 一次 — 确保自定义字体加载完成后度量值正确

**⚠️ 实现陷阱：不能使用 `requestMeasure()` 替代 dispatch。**
`requestMeasure()` 触发的是无 transaction 的 measure update（`geometryChanged=true, transactions=0`）。CM6 在这类 update 里重新绘制 DOM 时，`Decoration.replace({})` 类型的 decorations（用于隐藏 `# ` 等 Markdown 标记）会被内部丢弃，进而导致整行的 mark decorations（如 `cm-hybrid-heading-1`）也失效，livePreview 视觉上退化为纯文本。dispatch 一个真实 transaction 可以让 CM6 正确 map 所有 decorations，避免这个问题。

**替代方案（已否决）：** 仅在初始化时设置，运行时不支持变化。否决原因：与现有 props 行为不一致，调用方无法从 API 表面区分哪些 prop 是响应式的，容易踩坑。

## Risks / Trade-offs

- [非 livePreview decoration 性能] 额外的 decoration 扫描会有轻微性能开销 → 仅扫描 InlineCode 和 FencedCode 节点，开销可忽略
- [标题字号单位切换] HYBRID_THEME 中标题当前使用 rem，改为 em 后行为依赖容器 font-size → 确保样式设置在 `.cm-editor` 层级
- [字体加载时序] 运行时修改字体时，首次测量可能拿到 fallback 字体度量 → 通过 document.fonts.ready 二次 dispatch remeasureEffect 兜底
- [livePreview 切换时 code decoration 状态] createCodeDecorationExtension 若静态插入则切换后状态错误 → 纳入 codeDecorationCompartment，与 hybridCompartment 在同一次 dispatch 中原子切换
- [运行时更新复杂度] 需要 watch + dispatch remeasureEffect 逻辑 → 为保持 API 一致性必须承担的复杂度
- [⚠️ requestMeasure 破坏 livePreview decorations] requestMeasure() 产生无 transaction 的 measure update，CM6 在其中会丢弃 Decoration.replace({}) 导致 livePreview 退化为纯文本 → 必须改用 dispatch(remeasureEffect) 走正常 transaction update cycle
- [⚠️ CM6 基础主题覆盖字体继承链] CM6 基础主题通过 `.ͼ1 .cm-scroller { font-family: monospace }` 在 cm-scroller 层显式设置了字体，选择器特异性高于在 cm-editor 根元素上设的值，导致 fontFamily prop 实际无效 → fontTheme 中必须同时对 `& .cm-scroller` 设置 `fontFamily: inherit`，打通继承链
