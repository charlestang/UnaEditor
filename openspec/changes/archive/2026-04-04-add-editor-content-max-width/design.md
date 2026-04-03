## Context

UnaEditor 当前的宽度模型只有两层：外层编辑器壳子跟随宿主容器伸缩，内部 `.cm-content` 通过固定的左右 padding 让文本不要紧贴边缘。这个模型足以避免“贴边”，但无法解决“大屏下正文过宽”的写作体验问题。

这次变更要求引入第三层语义：外层 editor shell 仍然保持 fluid，左侧全局行号 gutter 继续贴外框左边，而正文内容区形成一个独立的内容版心。该版心默认最大宽度为 `720px`，并且图片、结构化表格、代码块都要跟随同一条约束。由于当前图片、代码块、表格分别在不同扩展内定义自己的尺寸与边距逻辑，这是一项横跨 `UnaEditor.vue`、`useEditor.ts`、`hybridMarkdown.ts`、`codeBlockLivePreview.ts`、`structuredTable.ts` 的交叉变更。

## Goals / Non-Goals

**Goals:**

- 为编辑器引入稳定的内部内容版心，默认最大宽度为 `720px`
- 提供 `contentMaxWidth` prop 作为唯一公开配置入口，允许调用方覆盖默认值
- 保持左侧 line number gutter 与其他外框附属 UI 贴壳布局，不计入内容版心宽度
- 让正文、图片、结构化表格、代码块都基于同一条内容版心约束渲染
- 在普通模式、浏览器全屏和屏幕全屏下保持一致的版心行为
- 允许 `contentMaxWidth` 在运行时响应式变化，且不重建编辑器实例

**Non-Goals:**

- 不控制宿主页面如何设置编辑器外框宽度
- 不为图片、表格、代码块提供各自独立的最大宽度配置
- 不在第一版支持“部分块元素突破版心”的特殊规则
- 不提供 props 之外的 CSS 覆盖通道作为公开 API

## Decisions

### Decision 1: 内容版心通过 `.cm-content` 内部布局实现，而不是缩窄外层编辑器壳子

外层 `.una-editor` 与 CodeMirror 的整体外壳继续保持 `width: 100%`，由宿主容器决定其最终宽度。内容版心通过 `.cm-content` 的内部水平布局来实现，使正文内容始终在“gutter 右侧的内容区域”中居中，而不是让整个编辑器或 gutter 一起向中间收缩。

**理由：**

- 用户明确要求左侧行号 gutter 继续贴外框左边，不参与 `720px` 的计算
- 这符合写作编辑器的视觉预期：外框可以很宽，但内容列有稳定阅读宽度
- fullscreen 模式下也能复用同一套布局规则，无需宿主页面额外兜底

**替代方案（已否决）：** 直接缩窄整个编辑器容器或由宿主页面限制外层 max-width。否决原因：会把 gutter 一起拖进中间，且无法稳定约束编辑器内部块内容。

### Decision 2: `contentMaxWidth` 使用单一 `number` prop，单位固定为 px，默认值为 720

公开 API 只提供 `contentMaxWidth?: number`，内部默认值为 `720`。该值表示正文内容列的最大宽度，不包含左侧 gutter。实现层可将该 prop 写入容器 CSS 变量（如 `--una-content-max-width`），但 CSS 变量只是内部传递机制，不作为公开 API。

**理由：**

- 当前项目没有外部用户，不需要为了兼容性保留“默认关闭”的旧行为
- `number` 与现有 `fontSize` 的 API 风格一致，调用方理解成本最低
- 先收敛到单一宽度值，避免一开始引入 `false`、对象配置或分块覆盖等过度设计

**替代方案（已否决）：**

- `contentMaxWidth?: number | false`：当前没有兼容性压力，先不暴露“关闭版心”的额外分支
- `contentLayout` 对象配置：过重，超出第一版需求

### Decision 3: 块级内容共享同一条版心宽度令牌，而不是各扩展继续维护独立上限

内容版心一旦启用，图片、结构化表格、代码块都必须以相同的内容列为宽度参考。现有扩展中分散的宽度限制或内联边距，只能作为块内部的装饰性 inset，不能再决定块元素相对于整个编辑器壳子的最大展开宽度。

**理由：**

- 这次变更的产品语义就是“统一版心”，不能让不同块类型继续各自为政
- 统一宽度参考可以避免大屏下正文很窄，但表格/代码块仍横跨整列的视觉割裂
- 后续如果要做“允许特定块突破版心”，也应该建立在统一版心之上，而不是保留当前离散规则

**替代方案（已否决）：** 仅限制正文，不处理图片/表格/代码块。否决原因：不符合本次已确认的需求边界。

### Decision 4: `contentMaxWidth` 运行时变化后走现有 remeasure 事务通道，而不是重建实例

`contentMaxWidth` 改变后，编辑器的视觉行宽、块级内容包裹宽度、滚动高度和 overlay 定位都可能变化。为保持与现有 props 一致的响应式行为，运行时更新必须在不销毁编辑器实例的前提下完成，并触发一次正常的 CodeMirror 测量/重绘周期。

**理由：**

- 现有 `theme`、`lineWrap`、`fontSize` 等 prop 都支持运行时变化，`contentMaxWidth` 不应成为例外
- 内容列宽度变化会影响 live preview decorations、代码块 header 位置、结构化表格 overlay 定位，必须让 CM6 在真实 update cycle 中重新测量

**替代方案（已否决）：** 仅在初始化时读取 `contentMaxWidth`。否决原因：与现有 props 行为不一致，也不利于 Playground 验证与上层设置面板联动。

## Risks / Trade-offs

- [内容列通过内边距实现，可能影响现有选中/active line 的视觉覆盖范围] → 通过回归测试确认普通文本、选区和活动行在宽屏下的观感；必要时单独补齐 active line 样式
- [结构化表格 overlay/handle 定位依赖几何信息，版心变化可能造成偏移] → 将 `contentMaxWidth` 变化纳入 remeasure 流程，并在 playground 中重点手测表格交互
- [代码块 live preview 目前有独立 inset，统一版心后可能出现“双重缩进”观感] → 将现有 inset 明确降级为块内部装饰，不再承担整体宽度控制职责
- [窄屏时内容列与基础 padding 的 CSS 计算容易产生边界问题] → 保留最小水平 padding，确保容器宽度小于 `contentMaxWidth` 时自然收缩，不引入横向滚动
- [默认行为直接从全宽变为 720 版心] → 当前项目没有外部用户，可直接接受这一视觉基线调整
