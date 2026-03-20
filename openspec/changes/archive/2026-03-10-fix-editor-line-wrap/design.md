## Context

UnaEditor 是基于 CodeMirror 6 开发的。CM6 默认不包含长文本自动折行（line wrapping）行为，这导致输入较长段落的 Markdown 文本时，编辑器区域会出现横向滚动条，严重破坏了所见即所得的输入体验。
需要一种机制来开启折行，同时保留对其进行配置的能力。

## Goals / Non-Goals

**Goals:**

- 为 `UnaEditor` 组件增加一个 `lineWrap` Prop 来控制是否自动折行。
- 默认开启长文本自动折行，改善所有现有用户的开箱即用体验。
- 支持在运行时响应式地动态切换 `lineWrap` 状态。

**Non-Goals:**

- 提供除了全局折行以外的更细粒度的折行策略配置（如软折行时的特定缩进或标识符），直接使用 CM6 默认的 `EditorView.lineWrapping`。
- 修改底层 CodeMirror 自身的样式表来强制折行。必须通过其标准扩展 API 实现。

## Decisions

**Decision 1: 采用 Compartment 动态管理扩展**

- **Rationale**: Vue 的设计哲学要求 Props 是响应式的。为了能够在初始化后动态切换是否折行（例如在 playground 中提供一个 toggle），我们需要使用 CodeMirror 的 `Compartment` 机制来包装 `EditorView.lineWrapping`，这样在 `props.lineWrap` 变化时可以执行 `reconfigure` 而无需销毁重建整个编辑器实例。
- **Alternative**: 在内部监听并使用 CSS 强行覆盖 `.cm-content` 的 `white-space`。这种方法不可控且容易与 CM 的内部尺寸计算机制冲突，直接被否决。

**Decision 2: 默认值设定**

- **Rationale**: `lineWrap: true`。作为 Markdown 编辑器，折行行为是被普遍期待的标准行为。向后兼容当前版本且提供更好的默认体验。

## Risks / Trade-offs

- **[Risk] 性能开销**: 对于极大体量的单行文本（极端情况，如压缩后的 base64 数据），开启 line wrapping 会对 CodeMirror 的渲染性能产生一定影响。
  - **Mitigation**: 对于绝大多数 Markdown 编写场景，单段落不会达到导致卡顿的长度。如果用户确实需要加载极不规范的超长行文本，他们可以通过传递 `:line-wrap="false"` 来关闭此功能。
