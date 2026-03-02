## Why

当前编辑器只提供标准编辑行为，对习惯 Vim 工作流的用户不够友好。为编辑器增加可选的 Vim 模式，可以在不影响默认体验的前提下，给熟悉 Vim 的用户提供更高效、更符合习惯的模态编辑能力。

## What Changes

- 为 `UnaEditor` 增加可选的 Vim 模式开关，默认保持标准编辑模式。
- 启用 Vim 模式后，编辑器从标准模式切换为经典 Vim 模态编辑行为，支持普通模式与插入模式的切换。
- 在 Vim 模式下保持现有编辑器能力可用，尤其是保存行为不应与 `Mod-s` 冲突。
- 首期聚焦于可切换的标准/Vim 两种编辑模式，不引入额外的模式状态 UI 或更大范围的 Vim 扩展能力。

## Capabilities

### New Capabilities

- `vim-keybinding-mode`: 定义编辑器在标准模式与 Vim 模式之间切换时的行为，以及 Vim 模式下的基础模态编辑约束。

### Modified Capabilities

无。

## Impact

- 受影响代码主要包括 [src/types/editor.ts](/Users/charles/Projects/hexopress-editor/src/types/editor.ts)、[src/components/UnaEditor.vue](/Users/charles/Projects/hexopress-editor/src/components/UnaEditor.vue) 和 [src/composables/useEditor.ts](/Users/charles/Projects/hexopress-editor/src/composables/useEditor.ts) 的配置接入层。
- 预计会新增一个独立的 CodeMirror 扩展接入点，用于按需启用或关闭 Vim 模式。
- 预计新增依赖 `@replit/codemirror-vim`，并需要验证其与现有 keymap、Hybrid Markdown 导航逻辑以及 `Mod-s` 保存行为的兼容性。
