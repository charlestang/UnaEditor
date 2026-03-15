## 1. Types and Props

- [x] 1.1 在 `EditorProps` 中新增 `fontFamily?: string`、`codeFontFamily?: string`、`fontSize?: number` 三个可选属性
- [x] 1.2 在 `UnaEditor.vue` 的 `withDefaults` 中不设置这三个 prop 的默认值（由样式 fallback 处理）

## 2. Styles and Theme

- [x] 2.1 在 `UnaEditor.vue` 中，将 font 相关 props 通过 computed style 对象绑定到容器元素（仅在 prop 有值时设置对应样式）
- [x] 2.2 新增 `cm-una-code-font` typography-only class，只设 `fontFamily: var(--una-code-font-family, ui-monospace, SFMono-Regular, Menlo, monospace)`
- [x] 2.3 从 `cm-hybrid-inline-code` 中移除 `fontFamily`（背景色、圆角、padding 保留），livePreview 的 inline code decoration 改为同时加 `cm-una-code-font` 和 `cm-hybrid-inline-code` 两个 class
- [x] 2.4 从 `cm-hybrid-fenced-code-line` 中移除 `fontFamily`（背景色保留），livePreview 的 fenced code decoration 改为同时加 `cm-una-code-font` 和 `cm-hybrid-fenced-code-line`
- [x] 2.5 在 theme 中为 `.cm-editor` 设置 `fontFamily: var(--una-font-family, sans-serif)` 和 `fontSize: var(--una-font-size, 14px)`
- [x] 2.6 将 `HYBRID_THEME` 中标题字号从 `rem` 改为 `em`（1.875em, 1.5em, 1.25em）

## 3. Runtime Reactivity

- [x] 3.1 在 `useEditor.ts` 中 watch fontFamily / codeFontFamily / fontSize 三个 props，变化时更新样式后调用 `view.requestMeasure()`
- [x] 3.2 fontFamily / codeFontFamily 变化时，额外等待 `document.fonts.ready` resolve 后再调一次 `view.requestMeasure()`

## 4. Code Decoration for Non-livePreview Mode

- [x] 4.1 在 `hybridMarkdown.ts` 中新增 `createCodeDecorationExtension()` 函数，仅为 InlineCode 和 FencedCode 添加 `cm-una-code-font` mark decoration（不加 hybrid 视觉增强 class）
- [x] 4.2 在 `useEditor.ts` 中，非 livePreview 模式下加载 `createCodeDecorationExtension()` 扩展

## 5. Testing

- [x] 5.1 为 `fontFamily`、`codeFontFamily`、`fontSize` props 编写单元测试，验证样式正确应用到容器元素
- [x] 5.2 验证运行时修改 fontSize prop 后编辑器正确重新测量（光标定位和滚动行为正常）
- [x] 5.3 验证非 livePreview 模式下 inline code 和 fenced code block 获得正确的 decoration class

## 6. Playground

- [x] 6.1 在 Playground 的 DemoEditor 中添加字体设置控件，用于验证运行时响应式变化功能
