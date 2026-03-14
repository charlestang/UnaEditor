## Why

UnaEditor 的公开 API 存在两处设计缺陷：`language` prop 虽然暴露给用户，但实际上被完全忽略（编辑器始终以 Markdown 模式运行）；`hybridMarkdown` 命名无法传达其"所见即所得预览"的语义，且将导航行为修复与渲染模式错误地耦合在一起。趁组件尚在早期阶段，现在清理 API 的成本最低。

## What Changes

- **BREAKING** 删除 `language` prop——编辑器固定为 Markdown，该参数从未生效
- **BREAKING** 将 `hybridMarkdown` prop 重命名为 `livePreview`，语义更准确
- 明确导航键的约定：非 vim 模式下遵循 CodeMirror 默认行为（视觉行），vim 模式下遵循 Vim 约定（逻辑行）；livePreview 开启时若干扰了上述默认行为，则在 livePreview 扩展内修复
- Markdown 语法高亮始终开启，不受 `livePreview` 状态影响

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `hybrid-markdown-rendering`：将 `hybridMarkdown` prop 重命名为 `livePreview`；明确导航修复仅在 livePreview 开启时介入，目的是还原被 decoration 干扰的默认行为
- `markdown-editor`：移除 `language` prop；明确编辑器固定为 Markdown 模式

## Impact

- `src/types/editor.ts`：删除 `language` 字段，`hybridMarkdown` 改为 `livePreview`
- `src/components/UnaEditor.vue`：更新 props 默认值
- `src/composables/useEditor.ts`：livePreview compartment 同时控制渲染装饰与导航修复（两者捆绑）
- `src/extensions/hybridMarkdown.ts`：将主函数重命名为 `createLivePreviewExtensions()`，内部结构不拆分
- 对使用了 `language` 或 `hybridMarkdown` prop 的下游用户构成破坏性变更
