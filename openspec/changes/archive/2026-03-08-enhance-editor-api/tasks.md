## 1. 类型定义更新 (Type Definitions)

- [x] 1.1 在 `src/types/editor.ts` 的 `EditorExposed` 接口中添加 `getEditorView` 返回类型的定义
- [x] 1.2 在 `src/types/editor.ts` 中定义 `Heading` 接口 (text, level, line)
- [x] 1.3 在 `src/types/editor.ts` 的 `EditorExposed` 接口中添加 `insertText`, `getHeadings`, `scrollToLine` 的方法签名

## 2. 核心逻辑实现 (useEditor Composable)

- [x] 2.1 在 `src/composables/useEditor.ts` 中实现 `getEditorView` (直接返回 editorView 的 value)
- [x] 2.2 在 `src/composables/useEditor.ts` 中实现 `insertText` 方法，处理选区替换和光标移动逻辑，并触发内部更新标志
- [x] 2.3 在 `src/composables/useEditor.ts` 中实现 `getHeadings` 方法，利用 `@codemirror/language` 的 `syntaxTree` 解析 AST 提取标题
- [x] 2.4 在 `src/composables/useEditor.ts` 中实现 `scrollToLine` 方法，利用 `EditorView.scrollIntoView` 派发滚动效果
- [x] 2.5 确保 `useEditor` 能够正确返回这些新方法

## 3. 组件暴露与测试 (Component & Tests)

- [x] 3.1 修改 `src/components/UnaEditor.vue`，在 `defineExpose` 中暴露出新的方法
- [x] 3.2 运行 `pnpm typecheck` 和 `pnpm lint` 确保没有类型和规范错误
- [x] 3.3 在 `test/UnaEditor.test.ts` 中增加针对 `insertText` 的测试用例
- [x] 3.4 在 `test/UnaEditor.test.ts` 中增加针对 `getHeadings` 提取功能的测试用例

## 4. 演示环境更新 (Playground & Docs)

- [x] 4.1 修改 `playground/src/views/AppSandbox.vue`，增加调用新 API 的测试按钮
- [x] 4.2 更新 `docs/api.md` 和 `docs/api.en.md`，将新暴露的方法详细补充进文档中
