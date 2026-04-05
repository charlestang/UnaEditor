## Why

当前 [useEditor.ts](/Users/charles/Projects/una-editor/src/composables/useEditor.ts) 同时承担实例生命周期、CodeMirror 扩展装配、运行时 watcher 同步、Vue 事件桥接、Vim 配置、布局重测量和命令门面等职责，导致组件壳层与编辑器适配层的边界模糊，改动半径持续扩大。随着主题、表格、代码块和 Vim 能力继续增长，这种单体式适配器会显著放大维护成本、多实例副作用风险和回归面。

现在进行一次渐进式内部分层重构，可以在不推翻现有公开 API 和默认行为的前提下，先把 `UnaEditor.vue` 与 `useEditor.ts` 的职责边界稳定下来，为后续功能演进留出清晰扩展位。

## What Changes

- 将 `useEditor` 重构为对外稳定的 facade，并在内部拆分实例内核、运行时同步、appearance 协调、事件桥和命令门面等职责边界。
- 建立统一的 resolved appearance 来源，避免组件壳层与编辑器适配层分别解析 `theme`、字体和版心相关配置。
- 将运行时同步逻辑按领域收拢，替代当前平铺式 watcher 结构，降低新增配置项时的耦合扩散。
- 隔离 Vim 的全局初始化与实例级启停逻辑，确保多实例与重复启停场景下的幂等性。
- 明确 `disabled` 与 `readonly` 的组件契约，并在保持现有公共接口兼容的前提下收紧内部语义。
- 保持当前公开 props、events 和 exposed methods 默认兼容，包括 `drop` 事件和 `getEditorView()` 高级接口。

## Capabilities

### New Capabilities
- `editor-runtime-boundaries`: 定义组件壳层、编辑器适配层、appearance 协调层、运行时同步层与高级 escape hatch 之间的边界约束。

### Modified Capabilities
- `markdown-editor`: 明确 `disabled` / `readonly` 的交互语义，并收紧外部内容同步与文件输入兼容边界。
- `editor-theming`: 要求主题相关消费者共享同一份解析后的 appearance 数据，并在运行时保持同步更新。
- `editor-programmable-api`: 保持高层命令 API 为首选集成面，同时将 `getEditorView()` 约束为高级兼容 escape hatch。
- `vim-keybinding-mode`: 增加 Vim 全局配置在多实例与重复启停场景下的幂等性要求。

## Impact

- 主要影响代码：
  - `src/composables/useEditor.ts`
  - `src/components/UnaEditor.vue`
  - `src/themes/editorThemes.ts`
  - `src/types/editor.ts`
  - `src/extensions/vim.ts`
  - 相关测试与文档
- 首阶段不引入预期的 breaking public API 变化。
- 需要重点验证的回归面：
  - 主题切换与字体/版心变化后的布局稳定性
  - `disabled` / `readonly` 的交互差异
  - 多实例 Vim 行为
  - `drop` 事件兼容性
  - `getEditorView()` 与高层命令 API 的兼容性
