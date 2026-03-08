## Context

当前 Una Editor 作为 Vue 3 组件，只暴露了 `focus`, `getSelection`, `toggleFullscreen` 等极少的基础方法。对于希望在编辑器之上搭建复杂应用的开发者（如 AI Copilot，或具有文章大纲导航能力的博客系统），他们需要更底层的 API 来操纵文本、解析结构和控制滚动。

## Goals / Non-Goals

**Goals:**
- 提供 `insertText` 用于光标处的插入或替换（适配 AI 场景）。
- 提供 `getHeadings` 用于无损提取 Markdown 标题层级（适配大纲 TOC 场景）。
- 提供 `scrollToLine` 用于精准视图导航。
- 提供 `getEditorView` 作为终极扩展手段（Escape Hatch）。

**Non-Goals:**
- 将编辑器打造成完整的 Markdown 抽象语法树分析工具（仅针对高频 TOC 需求提供 `getHeadings`，其他依然依赖开发者自己处理 `v-model` 内容）。
- 修改 CodeMirror 6 底层的原有架构，所有 API 必须是对 CM6 `dispatch` 和 `syntaxTree` 的优雅封装。

## Decisions

**1. `insertText` 实现机制**
- **方案**: 封装 `view.dispatch({ changes: { from: selection.from, to: selection.to, insert: text } })`。
- **合理性**: 自动处理了“无选区插入”和“有选区替换”的两种逻辑。并需要在触发前标记 `isInternalUpdate = true`，确保 `v-model` 双向绑定的流畅性，不引发死循环。

**2. `getHeadings` 解析机制**
- **方案**: 引用 `@codemirror/language` 中的 `syntaxTree`，通过 `tree.iterate` 遍历所有以 `ATXHeading` 开头的节点，提取 `text`, `level`, 和通过 `lineAt(pos)` 计算出的 `line` 属性。
- **合理性**: 极其高效，复用 CodeMirror 在编辑态已经维护好的 AST 树，不消耗额外的正则表达式性能。

**3. `scrollToLine` 实现机制**
- **方案**: 计算 `doc.line(lineNumber).from` 获取绝对位置，并分发 `EditorView.scrollIntoView(pos, { y: 'start', yMargin: 20 })` effect。
- **合理性**: 统一基于“行号”进行交互，符合外部 TOC 解析工具的输出格式。使用 `yMargin` 保证滚动后顶部有一定的呼吸感。

## Risks / Trade-offs

- **Risk**: 暴露 `getEditorView` 后，开发者可能直接通过它修改文档，导致 Vue 组件层面的 `v-model` 失去同步。
  - **Mitigation**: 在 API 文档（`api.md`）中增加显著警告，提示直接操作 View 需自行承担状态同步风险。