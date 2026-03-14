## 1. 删除 `language` prop

- [x] 1.1 从 `src/types/editor.ts` 的 `EditorProps` 中删除 `language` 字段
- [x] 1.2 从 `src/components/UnaEditor.vue` 的 `withDefaults` 中删除 `language: 'markdown'` 默认值

## 2. 重命名 `hybridMarkdown` → `livePreview`

- [x] 2.1 将 `src/types/editor.ts` 中的 `hybridMarkdown?: boolean` 改为 `livePreview?: boolean`
- [x] 2.2 将 `src/components/UnaEditor.vue` 的默认值 `hybridMarkdown: false` 改为 `livePreview: false`
- [x] 2.3 更新 `src/composables/useEditor.ts` 中所有引用 `props.hybridMarkdown` 的地方改为 `props.livePreview`

## 3. 整理导航修复的加载时机

- [x] 3.1 将 `src/extensions/hybridMarkdown.ts` 中的 `createHybridMarkdownExtensions()` 重命名为 `createLivePreviewExtensions()`，保持其内容不变（导航修复与渲染装饰继续捆绑）
- [x] 3.2 在 `src/composables/useEditor.ts` 中，将 `hybridCompartment` 中对 `createHybridMarkdownExtensions()` 的调用改为 `createLivePreviewExtensions()`

## 4. 实测并修复 livePreview 下的 ArrowUp 问题

- [x] 4.1 在 Playground 中开启 `livePreview: true`、关闭 `vimMode`，实测 ArrowUp 的具体异常表现并定位原因
- [x] 4.2 根据定位结果，在 `createLivePreviewExtensions()` 中修复 ArrowUp 行为，使其还原为视觉行移动（CodeMirror 默认）

## 5. 补充自动化测试（逻辑行导航）

- [x] 5.1 在 `test/` 中新建 `navigation.test.ts`，构造含多个逻辑行的 `EditorState`，作为导航测试的基础 fixture
- [x] 5.2 编写测试：`vim: true` + `livePreview: true` 时，按下 `j` 后光标落在下一逻辑行的对应列（offset 断言）
- [x] 5.3 编写测试：`vim: true` + `livePreview: true` 时，按下 `k` 后光标落在上一逻辑行的对应列（offset 断言）
- [x] 5.4 编写测试：`vim: true` + `livePreview: true` 时，ArrowDown 后光标落在下一逻辑行（offset 断言）
- [x] 5.5 编写测试：`vim: true` + `livePreview: true` 时，ArrowUp 后光标落在上一逻辑行（offset 断言）

## 6. 手动验证

- [x] 6.1 在 Playground 中验证 `livePreview: false` + `vimMode: false` 时，ArrowUp/Down 按视觉行移动（CM 默认行为，无干扰）
- [x] 6.2 在 Playground 中验证 `livePreview: true` + `vimMode: false` 时，ArrowUp/Down 均按视觉行移动（修复后）
- [x] 6.3 在 Playground 中验证 `livePreview: false` + `vimMode: true` 时，Arrow/j/k 按逻辑行移动（Vim 默认，无干扰）
- [x] 6.4 在 Playground 中验证 `livePreview: true` + `vimMode: true` 时，Arrow/j/k 按逻辑行移动（Vim 约定，修复后）
- [x] 6.5 运行 `pnpm build` 确认无 TypeScript 编译错误
- [x] 6.6 运行 `pnpm test` 确认所有测试通过（含新增的导航测试）
