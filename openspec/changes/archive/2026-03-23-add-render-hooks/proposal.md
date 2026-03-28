## Why

当前编辑器在 `livePreview` 模式下已经能把图片渲染为真实 `<img>`，并把链接渲染为带样式的可读文本，但用户还缺少一个稳定的扩展点来做以下事情：

- 在渲染前转换图片地址，例如走代理、补全相对路径或替换 CDN
- 为图片和链接注入自定义 `class`、`data-*` 属性与行内样式
- 为未来的链接悬浮卡、外部资源识别、仓库内相对路径解析准备 DOM 元数据

这类需求本质上属于“渲染前的轻量定制”，不应该迫使用户 fork 编辑器，也不应该为了支持自定义属性而把现有链接渲染模型整体推倒重来。

## What Changes

- 为 `UnaEditor` 新增可选的 `renderHooks` prop，包含 `image` 与 `link` 两类同步钩子
- 扩展现有 `ImageWidget`，支持在保留默认图片渲染体验的前提下，应用变换后的 `src` 以及可选的 `className`、`dataset`、`style`
- 保留链接现有的 mark-decoration 渲染路径；仅当提供 `renderHooks.link` 时，给链接追加变换后的目标地址和自定义元数据，而不是默认把所有链接改成 widget
- 链接上下文优先从 Markdown 语法树提取；图片则在复用现有解析逻辑的基础上补齐 `title` 等上下文，避免为图片 / 链接统一引入脆弱的新解析器
- 明确 `renderHooks` 在 `livePreview` 打开时才生效，并支持在组件生命周期内响应 prop 更新后重新渲染可见内容
- 补充回归测试与 playground 示例，覆盖兼容性、错误处理、动态更新和复杂链接内容

## Capabilities

### New Capabilities

- `render-hooks`: 允许用户在 `livePreview` 渲染阶段对图片和链接做同步 URL 变换与元数据注入

### Modified Capabilities

<!-- No existing capabilities are being modified at the requirement level -->

## Impact

- **类型定义**: 在 `src/types/editor.ts` 中新增 `RenderHooks`、`ImageRenderContext`、`ImageRenderResult`、`LinkRenderContext`、`LinkRenderResult`
- **组件层**: `UnaEditor.vue` 暴露 `renderHooks` prop
- **Composable**: `useEditor.ts` 把 `renderHooks` 传入 live preview 扩展，并在 prop 变化时触发重配置
- **渲染层**: `hybridMarkdown.ts` 扩展图片 widget 与链接 decoration 的属性构建逻辑
- **兼容性**: 当未提供 `renderHooks` 时，现有图片与链接的默认渲染行为保持不变
