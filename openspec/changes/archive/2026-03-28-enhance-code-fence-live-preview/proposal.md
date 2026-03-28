## Why

当前围栏代码块在 `livePreview` 下仍然更像“被着色的 Markdown 源码”，而不像 Obsidian 那种已经具备稳定阅读态壳子、header affordance 和 gutter-like 行号的代码块。光标离开后，opening / closing fence 依然直接暴露给用户；想复制整段代码，也缺少一个自然的右上角 copy affordance。

此前的 artifact 把这个方向误写成了“独立工具栏”。这并不符合目标体验。我们真正要模拟的是 Obsidian 那种基于 opening fence 行改造出来的 header row，而不是在代码块上方再挂一条独立工具栏。

现在 hybrid 渲染、主题系统和代码块主题链路已经足够稳定，可以把围栏代码块从“有颜色的源码段落”提升为“尽可能贴近 Obsidian 的代码块 live preview 交互”。

## What Changes

- 在 `livePreview` 下为 fenced code block 引入更接近 Obsidian 的块级壳子与行级状态模型
- 在非激活状态下，将 opening fence 行渲染为代码块 header affordance row，而不是额外插入独立工具栏
- 在非激活状态下隐藏 closing fence 的源码显示，仅保留代码块尾部壳子语义
- 在 header row 中保留右侧 copy affordance；若语言标识符可映射为已知 display label，则该标签应作为右侧弱提示与 copy affordance 一起出现，否则直接省略
- 当光标进入 fenced code block 的任意行时，按整个 `FencedCode` 结构恢复 opening / closing fence 源码显示，同时尽量保留代码块外壳与布局稳定性
- 仅在 `livePreview` 下，将可选行号升级为 block-internal faux gutter，让 begin/body/end 行共享稳定的号码槽宽度，而不是继续依赖带强分隔感的 `::before` 前缀；非 `livePreview` 模式保持现有源码态行号策略
- 收紧 `codeFontFamily` 的作用域，使其仅影响代码内容本身，而不影响编辑器全局 gutter 或代码块行号列的数字字体
- 保持现有代码块语法高亮、代码主题和 live preview 导航行为与上述新结构协同工作

## Capabilities

### New Capabilities

- `code-block-header-affordances`: 代码块 header row affordance 能力，包括语言标签与右侧 copy affordance

### Modified Capabilities

- `hybrid-markdown-rendering`: fenced code block 在 `livePreview` 下的非激活/激活状态行为将从“仅着色源码”升级为“Obsidian-like 的 begin/body/end 行模型”
- `code-block-syntax-highlighting`: opening fence 中的语言标识符不仅驱动语法高亮，也将驱动 header row 的语言标签
- `code-block-line-numbers`: 代码块行号将在 `livePreview` 下从 `::before` 前缀改为 block-internal faux gutter 表现，源码态保持现有策略
- `editor-font-settings`: `codeFontFamily` 的作用域将明确收紧为代码内容本身，不再外溢到编辑器 gutter 或代码块行号列

## Impact

- `src/extensions/codeBlockDecorator.ts`: 保留源码态与基础代码块行装饰职责，避免被 live preview 专用状态机污染
- `src/extensions/codeBlockLivePreview.ts`（新文件）: 需要承载 `livePreview` 专用的 begin/body/end 行状态、header affordance、copy 交互、faux gutter 和整块 active scope 判断
- `src/extensions/codeThemeExtension.ts`: 需要让主题样式覆盖代码块外壳、header row、faux gutter 与代码主体
- `src/extensions/languageSupport.ts`: 需要补充 canonical display label 映射，让语言标签与高亮共用同一归一化来源
- `src/composables/useEditor.ts`、`src/extensions/codeBlockDecorator.ts`、`src/extensions/codeBlockLivePreview.ts`: 需要让编辑器 gutter 与代码块行号列保持独立的数字字体栈，不随 `codeFontFamily` 一起切换
- `test/`: 需要新增 begin/header/end 切换、语言标签、copy affordance、只读复制、行号 faux gutter、换行对齐、active scope 平滑回退与导航回归测试
- `playground/`: 需要补一段适合验证 Obsidian-like 代码块交互与行号观感的示例内容
