## Why

编辑器当前的代码字体和正文字号为硬编码值（代码字体硬编码在 `HYBRID_THEME` 中，正文字号硬编码在 `.una-editor` CSS 中），正文字体未显式设置（依赖浏览器默认）。调用方无法通过 API 自定义这些值。

上层应用需要允许用户调整编辑器的正文字体、代码字体和字号。编辑器应从组件层面提供字体和字号的配置能力，并支持运行时响应式变化，与现有 props（theme、lineNumbers、vimMode）的行为保持一致。

## What Changes

- 新增 `fontFamily` prop：指定正文字体（段落、标题、引用、列表等所有非代码内容），支持运行时响应式变化
- 新增 `codeFontFamily` prop：指定代码字体（inline code 和 fenced code block），支持运行时响应式变化
- 新增 `fontSize` prop：指定正文字号，支持运行时响应式变化
- 拆分代码字体 class：新增 `cm-una-code-font` typography-only class，与 livePreview 视觉增强 class 分层
- livePreview 模式的 `HYBRID_THEME` 引用字体样式，非 livePreview 模式下也为代码结构添加字体 decoration
- 运行时 props 变化时触发 CodeMirror 重新测量，确保光标定位和滚动行为正确

## Capabilities

### New Capabilities

- `editor-font-settings`: 编辑器字体和字号的可配置能力，包括正文字体、代码字体和字号三个维度

### Modified Capabilities

- `hybrid-markdown-rendering`: HYBRID_THEME 中的硬编码字体值改为可配置，代码字体 class 与视觉增强 class 分层
- `markdown-editor`: 新增三个 props（fontFamily、codeFontFamily、fontSize），非 livePreview 模式下也需要为代码结构添加字体 decoration

## Impact

- `src/types/editor.ts`: EditorProps 新增三个可选属性
- `src/components/UnaEditor.vue`: 将 props 应用到容器元素样式
- `src/composables/useEditor.ts`: 初始化时应用字体配置到扩展
- `src/extensions/hybridMarkdown.ts`: 拆分代码字体 class，新增非 livePreview 模式下的代码字体 decoration
