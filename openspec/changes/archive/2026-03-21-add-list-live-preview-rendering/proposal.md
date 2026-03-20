## Why

当前 `livePreview` 已经覆盖标题、强调、链接、图片、引用和代码块等结构，但列表仍然保持纯源码显示。对于以笔记和文档写作为核心的场景，列表是高频块级结构；如果列表始终停留在源码态，整体编辑体验仍然很难接近 Obsidian 这类以“阅读态优先、源码可回退”为特征的 Markdown 编辑器。

现在补上列表的 live preview 时机已经成熟。一方面，现有 hybrid 渲染层已经具备基于语法树与 active scope 在“渲染态 / 源码态”之间切换的能力；另一方面，表格渲染已被明确排除在本轮范围之外，可以让本次变更聚焦在更高频、更可控的列表体验上。

## What Changes

- 在 `livePreview` 模式下，为标准 Markdown 列表提供保守的渲染增强，覆盖 CommonMark 的无序列表与有序列表语法。
- 在 `livePreview` 模式下，为 GFM task list 提供只读 checkbox 渲染，支持未完成和已完成两种状态。
- 支持主流且合法的标准列表 marker，包括 `-`、`*`、`+`、`1.`、`1)` 等写法，以及它们在嵌套列表中的组合。
- 当光标进入当前列表项时，该列表项恢复为 Markdown 源码显示，以保证用户可以直接编辑原始 marker 和 task 标记。
- 明确首页 `/#/` 的 Demo 以“最佳展示状态”呈现组件，只保留少量高价值主题控制，并要求其语言与主题切换保持完整一致。
- 明确 `/#/sandbox/` 以回归测试和自由试用为目标，保留更丰富的语法样例和完整功能控制项。
- 明确本轮不包含表格渲染、checkbox 点击切换、富交互列表控件和额外 Markdown 渲染引擎引入。

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `hybrid-markdown-rendering`: 扩展 live preview 的块级渲染范围，为标准列表和 GFM task list 提供保守渲染，并定义列表项进入激活态时的源码回退行为。
- `project-landing-page`: 明确首页 Demo 的展示职责、控件范围，以及主题和语言切换后的展示一致性要求。
- `playground-sandbox`: 明确 sandbox 的验证职责，需要保留更丰富的语法样例和完整控制项以支撑回归测试与用户试用。

## Impact

- 受影响代码主要集中在 `src/extensions/hybridMarkdown.ts` 及其相关测试，可能需要扩展列表作用域识别、marker 隐藏与替代渲染逻辑。
- `src/composables/useEditor.ts` 的扩展组合方式大概率无需新增对外 API，但需要确保列表渲染与现有导航、字体、主题、vim 行为兼容。
- `test/UnaEditor.test.ts`、导航相关测试以及 Playground 演示内容需要补充列表 live preview 的场景覆盖。
- 首页 Demo 与 sandbox 的内容组织、控件密度、语言切换和主题包裹层也会受到影响，需要同步更新相关 specs 以反映产品职责。
- 不计划新增运行时依赖；仍然以 `@codemirror/lang-markdown` 为解析基础，在现有 hybrid 渲染架构内完成本次能力扩展。
