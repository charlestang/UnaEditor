## Why

当前编辑器的内容区样式主要硬编码在 `hybridMarkdown.ts` 的 `HYBRID_THEME` 中，集成方无法以稳定 API 定制标题、链接、引用、行内代码等 Markdown 内容样式。与此同时，现有 `theme` prop 只区分 `'light' | 'dark'`，无法表达“基于 dark 外观，只覆盖部分内容 token”的常见集成诉求。

这次变更最初还试图把底层 CodeMirror `Extension` 直接暴露给集成方，作为自定义主题对象的一部分。对开源组件库来说，这个 API 过于底层，会把公共契约绑定到 CodeMirror 的内部扩展机制和未来版本兼容性上，也会让主题对象在后续新增 token 时变成脆弱的 breaking surface。

此外，live preview 模式下标题存在视觉基线不稳定的问题：非激活时依赖 `cm-hybrid-heading-*`，进入源码态后 `tok-heading` 缺少同等级的字号和字重约束，容易出现行高跳变。这个问题不仅影响观感，也会放大外部 CSS reset 对标题渲染的一致性影响。

我们在后续集成验证中又确认了另一类真实风险：宿主应用可能对 `span`、`strong`、`em`、`code` 等元素施加全站 CSS reset。如果 Markdown 语义样式只是“碰巧”落在内层语法高亮 token span 上，而不是由编辑器自己拥有的 decoration class 或行级锚点承担，那么加粗、斜体、链接、行内代码等关键视觉语义就可能被 reset 掉。对一个开源组件库来说，这种脆弱性会直接转化为集成不确定性。

因此，本次 change 需要把“编辑器主题”收敛为一个适合组件库公开暴露的高层 token API，并同时补齐标题在 live preview / 源码态之间的视觉一致性，以及在常见宿主 CSS reset 下的样式稳健性。

## What Changes

- 引入面向集成方的 `EditorTheme` 主题对象，但它是“基于 light/dark 预置主题的覆盖对象”，而不是要求调用方自行提供底层 CodeMirror `Extension`
- `theme` prop 从 `'light' | 'dark'` 扩展为 `'light' | 'dark' | EditorTheme`，其中自定义对象必须声明 `type: 'light' | 'dark'` 作为外观基线，未覆盖的 token 从对应预置主题继承
- 新增 `editor-theming` capability，首期覆盖 Markdown 内容区 token 和结构化表格表头背景色，不把所有 CodeMirror chrome 细节直接开放为公共配置面
- 预置 `light` 和 `dark` 两套完整 resolved theme，作为字符串主题和自定义主题合并的基线
- `codeTheme='auto'` 的决策改为跟随“resolved editor theme”的 `type`，因此自定义主题对象也能稳定驱动代码块自动配色
- 将当前 `HYBRID_THEME` 拆为稳定的 base theme 和动态生成的 content theme，避免非 `livePreview` 路径因为主题重构而丢失代码字体相关样式
- 为标题文本行添加始终存在的 `cm-heading-line-{1-6}` line decoration，作为 `tok-heading` / `tok-meta` 的级别锚点，统一 live preview 与源码态的字号、字重和行高
- 明确 heading line decoration 的语义同时适用于 ATX heading 和 Setext heading；对于 Setext heading，仅内容行携带级别 class，不把下划线分隔行视为标题样式承载行
- 明确 Markdown 关键语义样式的“所有权”属于编辑器自身的稳定 decoration class / line-level selector，而不是把最终视觉结果托付给内层 `tok-*` span 的默认继承
- 针对常见宿主 CSS reset 补充回归约束，确保加粗、斜体、链接、行内代码与标题源码态在 reset 场景下仍保持主题定义的视觉语义

## Capabilities

### New Capabilities
- `editor-theming`: 编辑器主题解析与主题 token 体系，包括预置主题、自定义覆盖对象、resolved theme、主题驱动的内容区样式

### Modified Capabilities
- `markdown-editor`: `theme` prop 的公共契约从仅支持字符串主题扩展为支持自定义主题覆盖对象
- `code-block-theming`: `codeTheme='auto'` 需要跟随 resolved editor theme 的 `type`，而不再依赖原始 `theme` prop 是否为字符串
- `hybrid-markdown-rendering`: 标题文本行新增稳定的 line decoration，并由 resolved theme 驱动标题源码态与渲染态的一致样式；关键 Markdown 语义样式需对常见宿主 CSS reset 保持稳健
- `structured-table-editing`: 结构化表格表头背景色从 resolved theme 读取，支持自定义主题覆盖

## Impact

- `src/types/editor.ts`: 定义面向外部的 `EditorTheme`、`EditorThemeContent`、`EditorThemeTable` 等类型
- `src/themes/editorThemes.ts`: 新增 light/dark 预置主题、主题合并与 `resolveEditorTheme()`
- `src/composables/useEditor.ts`: 统一 theme 解析流程，按 resolved theme 分别驱动 chrome/content/code block 自动主题
- `src/extensions/hybridMarkdown.ts`: 将静态 `HYBRID_THEME` 拆为 base theme 与动态 content theme，并补充 heading line decoration 与 reset-resilient selector ownership
- `src/components/UnaEditor.vue`: 容器级 CSS 变量改为从 resolved theme 读取
- `playground/`: 主题选择器保持 light/dark 正常工作，并增加自定义主题示例验证入口
- `test/`: 需要新增主题解析、部分覆盖继承、标题行装饰、运行时切换、宿主 reset 回归与 codeTheme auto 的回归测试
