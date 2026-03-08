## Why

为了支持高级开发者（如集成 AI Copilot、构建文档大纲导航等）对 `UnaEditor` 进行深度定制，我们需要暴露更多的内部 API 接口。现有的 `getSelection` 等接口已经无法满足复杂的场景。提供丰富的可编程接口是提升组件库竞争力的关键。

## What Changes

- 在 `UnaEditor` 暴露的方法中新增 `getEditorView()`，返回底层的 CodeMirror 6 视图实例。
- 新增 `insertText(text: string)` 方法，允许开发者在当前光标处插入或替换选中区域。
- 新增 `getHeadings()` 方法，利用内部 `syntaxTree` 高效提取 Markdown 标题层级结构。
- 新增 `scrollToLine(lineNumber: number)` 方法，允许开发者平滑滚动到指定行。

## Capabilities

### New Capabilities
- `editor-programmable-api`: 提供如获取底层视图、操作光标插入、大纲解析和程序化滚动等高级编辑器交互接口。

### Modified Capabilities
无。

## Impact

- **暴露的 API**: `src/types/editor.ts` 中的 `EditorExposed` 接口将会被扩展。
- **内部实现**: `src/composables/useEditor.ts` 将增加新的方法实现。
- **文档**: `docs/api.md` 和 `docs/api.en.md` 需要同步更新新增加的 Methods 及其说明。
- **Playground**: 将在演示环境中增加新 API 的调用示例。