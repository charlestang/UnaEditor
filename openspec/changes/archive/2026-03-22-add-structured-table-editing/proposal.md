## Why

Markdown 表格一直是 `UnaEditor` 当前体验里最接近“源码编辑器”而最远离“写作编辑器”的区域。随着 hybrid Markdown 渲染已经覆盖标题、列表、图片和代码块，表格成为最明显的体验缺口，尤其在长表格场景下，整块源码会显著降低可读性和可编辑性。

## What Changes

- 将编辑器的 Markdown 解析基线提升到 GFM，使合法 Markdown 表格在源码态和 `livePreview` 态下都能被稳定识别。
- 新增 `structured-table-editing` 能力：在 `livePreview` 开启时，将合法 Markdown 表格渲染为真实表格视图，并允许用户直接在单元格内编辑内容。
- 重写单元格交互模型：单个 cell 不再存在“整格被选中但没有文本光标”的独立状态；用户进入 cell 后，看到的必须是 cell 内容中的文本光标或文本选区。
- 为非 Vim 模式定义直接编辑语义：鼠标点击 cell 时立即把光标放入点击位置附近；从表格外按 `ArrowUp` / `ArrowDown` 进入表格时，光标进入边界行第一列的 cell 内容，并继续以文本光标语义在表格内导航。
- 为 Vim 模式定义“进入 cell 但保持当前 mode”的语义：从普通文本进入表格后，若原本处于 normal mode，则继续保持 normal mode 并在 cell 内容中拥有可移动的文本光标；若原本处于 insert mode，则继续保持 insert mode 并进入当前 cell 的编辑会话。`i` / `a` 等进入插入态命令必须在当前 cell 文本光标位置生效。
- 为活动 cell 定义事务驱动的编辑会话，明确 IME、撤销、粘贴、选区与焦点同步语义；所有单元格编辑都必须回写到底层 Markdown 文档，而不是停留在独立临时模型中。
- 为表格补充显式的结构操作 affordance，包括行/列 hover handle、整行/整列选中、右键菜单删除，以及通过 `+` handle 增加行列；行列 handle 保留为唯一的结构选中入口，单个 cell 不提供独立的结构选中态。
- 在表格单元格内支持现有 hybrid 行内渲染能力的复用，包括粗体、斜体、链接、行内代码、图片，以及显式输入的 `<br>` / `<br/>` 换行标记。
- 修改 `livePreview` 的表格回退策略：当 `livePreview` 关闭时，表格 MUST 完全退化为 Markdown 源码编辑态，仅保留源码高亮，作为结构化表格编辑出现异常时的兜底路径。
- 修改 Vim 模式在表格内的局部行为，使 `h` / `l`、`j` / `k`、`w` / `b`、`i` / `a`、`dd` 等命令遵循“cell 内文本光标优先”的表格语义，而不是单纯的格子跳转或整格选中。
- 补充 `/sandbox` 的回归验证入口：为了稳定验证表格 cell 编辑的撤销顺序与相关事务行为，sandbox 需要提供不依赖单一快捷键路径的直接触发入口，例如显式的撤销 / 重做控制项。

## Capabilities

### New Capabilities

- `structured-table-editing`: 定义 `livePreview` 下合法 GFM 表格的结构化渲染、单元格编辑、导航、行列选择，以及增删行列的 UI affordance 与安全规则。

### Modified Capabilities

- `hybrid-markdown-rendering`: 修改表格在 `livePreview` 下保持源码态的现有要求，改为结构化表格渲染；同时明确 `livePreview=false` 时必须回退为原始 Markdown 源码态。
- `vim-keybinding-mode`: 修改 Vim 模式在表格区域内的导航与删行规则，以匹配结构化表格编辑体验。
- `playground-sandbox`: 修改 sandbox 的验证控制面要求，明确它需要暴露可直接触发撤销 / 重做等回归验证动作的控制入口。

## Impact

- 受影响代码主要包括 [src/composables/useEditor.ts](/Users/charles/Projects/una-editor/src/composables/useEditor.ts) 的 Markdown 语言配置，以及 [src/extensions/hybridMarkdown.ts](/Users/charles/Projects/una-editor/src/extensions/hybridMarkdown.ts) 的渲染与导航扩展。
- 预计需要继续重构表格专用的 block plugin / 状态映射 / command 层 / 键盘处理 / 行列选择与上下文菜单模块，重点修正 cell 文本光标、overlay 生命周期、Vim mode 同步与结构选中边界，并补充 `test/` 下的表格导航、撤销、粘贴规范化、删行删列、Vim 行为和回退路径测试。
- Playground `/sandbox` 的控制项与示例内容也会受到影响，需要补充针对撤销 / 重做验证入口的定义，确保手工验证不依赖单一平台快捷键。
- 对外不新增新的组件 props，但会改变 `livePreview` 开启时 Markdown 表格的交互模型。
