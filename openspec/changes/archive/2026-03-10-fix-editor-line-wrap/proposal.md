## Why

当使用 `una-editor` 编辑较长的 Markdown 文稿时，由于底层 CodeMirror 6 默认没有开启自动折行 (line wrapping)，超出的文本会持续向右延伸并出现横向滚动条。这严重影响了长文档的编写体验。作为一款所见即所得/混合态的 Markdown 编辑器，自动折行应该作为默认开启的基础体验保障配置提供给用户。

## What Changes

- 在 `UnaEditor` 组件中新增 `lineWrap` (boolean) Prop，默认值为 `true`。
- 在 `useEditor` composable 中监听该配置，并动态挂载/卸载 CodeMirror 的 `EditorView.lineWrapping` 扩展。
- 更新相关的 TypeScript 类型定义以支持新的暴露属性。
- （可选）在 Playground 中增加针对此配置项的开关进行测试。

## Capabilities

### New Capabilities

<!-- Capabilities being introduced. Replace <name> with kebab-case identifier (e.g., user-auth, data-export, api-rate-limiting). Each creates specs/<name>/spec.md -->

### Modified Capabilities

<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->

## Impact

- **`src/types/editor.ts`**: 增加 `lineWrap?: boolean` 属性到 `EditorProps` 接口中。
- **`src/components/UnaEditor.vue`**: 在 `withDefaults` 中声明新属性的默认值 `lineWrap: true`。
- **`src/composables/useEditor.ts`**: 引入 `EditorView.lineWrapping` 并在 setup 阶段和 `watch` 中基于 `Compartment` 动态响应 `props.lineWrap` 变化。
- 完全向后兼容，当前使用方自动获得长文本换行体验。
