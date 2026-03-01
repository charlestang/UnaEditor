## Why

当前 `UnaEditor` 仍然是传统源码编辑态，用户需要直接阅读和操作完整的 Markdown 标记，阅读体验与内容最终呈现效果存在明显落差。为了让编辑体验更接近所见即所得，同时保留 Markdown 源码的可控性，需要引入一种 hybrid 编辑模式：默认显示渲染态，光标进入当前结构时切回源码态。

## What Changes

- 为编辑器新增可开关的 hybrid Markdown 渲染模式，使 Markdown 内容在默认状态下以渲染结果呈现。
- 在 hybrid 模式下，为标题、强调、链接、行内代码等常见行内语法提供富文本显示，并在非激活状态下隐藏对应的 Markdown 标记。
- 在 hybrid 模式下支持图片渲染，使图片语法在非激活状态下显示为实际图片内容，而不是纯 Markdown 源码。
- 对 blockquote 和 fenced code block 提供首期的保守渲染增强，优先改善视觉表现和阅读感受，不要求第一阶段直接做整块替换。
- 明确首期范围不包含表格的完整渲染替换，避免在首版引入过高的交互复杂度和性能风险。

## Capabilities

### New Capabilities
- `hybrid-markdown-rendering`: 为编辑器提供可开关的 hybrid Markdown 渲染能力，在渲染态与源码态之间按光标位置切换，并覆盖首期约定的 Markdown 结构显示行为。

### Modified Capabilities

无

## Impact

- 受影响代码主要集中在 `src/composables/useEditor.ts`、`src/components/UnaEditor.vue` 及相关样式定义，编辑器扩展组合方式会增加新的渲染扩展层。
- 可能需要扩展公开的组件配置接口，使调用方可以启用或关闭 hybrid 渲染模式。
- 将继续基于 `@codemirror/lang-markdown` 构建，不引入 Markdoc 一类额外渲染引擎，但需要补充与 hybrid 渲染相关的编辑器扩展、装饰和样式契约。
- 后续 specs 和 design 需要明确性能边界，避免在光标移动或文档变更时对整篇文档执行高成本的全量重算。
