## Context

`UnaEditor` 当前提供的是标准的 CodeMirror 编辑体验，并通过 `useEditor()` 挂载多层可选能力，包括主题、行号、只读状态和 Hybrid Markdown 渲染等动态 compartment。引入 Vim 支持后，编辑器会新增一种比现有视觉类开关更深入的编辑行为模式，同时也会引入新的外部依赖：`@replit/codemirror-vim`。

这份设计需要在不影响非 Vim 用户默认体验的前提下，保持对外 API 简洁，并避免破坏现有键盘行为，尤其是 `Mod-s` 保存快捷键和 Hybrid Markdown 的自定义上下方向键导航。

## Goals / Non-Goals

**Goals:**
- 增加一个单一的配置开关，用于在标准模式和 Vim 键位模式之间切换。
- 保持标准模式为默认值，在未启用 Vim 模式时完整保留当前行为。
- 在启用 Vim 模式后继续保留现有保存快捷键行为。
- 以符合当前 compartment 动态重配置架构的方式接入 Vim 模式。

**Non-Goals:**
- 首期不在组件内增加完整的 Vim 状态栏或模式指示 UI。
- 首期不扩展成超出标准 / Vim 两种模式的更大键位模式系统。
- 首期不自定义或扩展 `:w`、`:q` 等 Vim ex 命令，也不处理插件专有命令体系。

## Decisions

### Add a dedicated `vimMode` prop and a separate Vim compartment
对外 API 应以单一布尔开关 `vimMode` 暴露 Vim 支持，默认值为 `false`。在内部，`useEditor()` 应新增一个专门用于 Vim 扩展的 `Compartment`，使该模式可以在不重建编辑器实例的情况下动态启用或关闭。

这与当前架构一致，因为现有可选能力本来就是以独立扩展层的方式接入的。同时，这也保持了首期对外需求的清晰性，只处理“standard vs vim”，避免过早扩展成更通用的键位模式枚举。

Alternative considered:
- 立即引入 `keybindingMode: 'standard' | 'vim'` 这样的 API。它确实更易扩展，但在当前阶段会增加概念负担，且没有直接带来足够的产品价值。

### Treat Vim mode as an editing-behavior layer, not a replacement for other editor features
Vim 模式只应改变键盘输入的解释方式，不应取代现有能力，例如 Hybrid Markdown 渲染、主题、保存事件或只读行为。

这样可以保持职责分离：
- 视觉表现和文档呈现仍由现有扩展控制
- Vim 模式只负责键盘语义

Alternative considered:
- 让 Vim 模式顺带驱动额外的显示行为，例如在 `Esc` 时强制让 Hybrid 结构回到渲染态。这样会把两个本应独立的系统耦合在一起，并显著提升首期实现的脆弱性。

### Preserve existing arrow-key navigation and `Mod-s` priority expectations
编辑器当前已经在 Hybrid Markdown 扩展中实现了自定义方向键行为，并显式接入了 `Mod-s` 保存 keymap。Vim 集成必须以这些既有行为仍然成立为前提：
- 上下左右方向键应继续遵循编辑器当前的导航规则
- `Mod-s` 在 Vim 的 normal mode 和 insert mode 下都应继续触发保存事件

这意味着最终的扩展顺序和按键优先级需要被显式验证，而不能假设把 Vim 扩展简单追加进去就一定没有副作用。

Alternative considered:
- 让 Vim 模式完全接管所有导航键和快捷键分发。这样会更接近纯粹的 Vim 环境，但会破坏编辑器当前已经建立起来的 hybrid 导航预期。

### Keep first-phase Vim UX low-intrusion
首期版本只提供行为层能力：启用 Vim 模式后获得经典模态编辑。首期不增加状态栏、角标或专门的模式显示等新增 UI。

这样可以保持组件表面足够克制，也避免在键盘行为尚未充分验证之前，过早承诺新的 UI 契约。

Alternative considered:
- 立即增加内建模式指示器。这样确实更利于 Vim 用户理解当前状态，但会扩大组件 UI 面，并引出额外的定制化和样式 API 问题。

## Risks / Trade-offs

- [Keymap precedence conflicts] `@replit/codemirror-vim` 可能会拦截当前用于保存和 hybrid 导航的按键。 → 显式验证扩展顺序，并用聚焦测试覆盖 `Mod-s`、方向键和模式切换。
- [Behavioral mismatch with “pure Vim” expectations] 保留现有方向键行为意味着 Vim 模式会被整合进 UnaEditor 的规则，而不是一个完全隔离的纯 Vim 环境。 → 在文档中明确首期 Vim 模式优先兼容现有编辑器行为。
- [Dynamic reconfiguration edge cases] 在已有编辑器实例上动态切换 Vim 模式时，可能保留出乎意料的内部状态。 → 首期以 compartment 切换为边界，并测试挂载后开启/关闭的场景。
- [Dependency footprint] 新增 Vim 支持会引入一份默认关闭能力的运行时依赖。 → 保持 API 可选，若包体积成为实际问题，再评估后续的懒加载或拆分策略。

## Migration Plan

1. 添加新依赖，并把它接入编辑器扩展装配流程。
2. 扩展公开 props 和文档，暴露 `vimMode`。
3. 验证在不传该 prop 时，标准模式行为保持不变。
4. 在发布前通过测试和 Playground 验证 Vim 模式行为。

这项变更不涉及数据迁移。若需要回滚，只需禁用 `vimMode` 或移除 Vim 扩展接线。

## Open Questions

- 首期实现之后，是否需要向调用方暴露当前 Vim 子模式（`normal`、`insert` 等）的观测能力。
- 这份依赖是否应保持直接打包，还是在后续优化阶段改为懒加载的可选增强。
