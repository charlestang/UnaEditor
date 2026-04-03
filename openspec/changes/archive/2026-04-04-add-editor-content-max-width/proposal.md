## Why

当宿主容器足够宽时，Una Editor 当前会让正文内容直接铺满整个可用宽度。对于写作型场景，这会导致单行过长、阅读和编辑负担上升，图片、表格和代码块也会显得松散失控。

Una Editor 需要内建一个稳定的“内容版心”模型：外层编辑器外框继续跟随宿主容器伸缩，但中间书写区保持合理的最大宽度，并让图片、表格、代码块与正文共享同一条版心约束。

## What Changes

- 新增编辑器内部内容版心能力，默认将正文内容列最大宽度限制为 `720px`
- 新增 `contentMaxWidth` prop，允许调用方覆盖默认版心宽度
- 明确内容版心只约束正文内容列，不包含全局行号 gutter 或其他左侧附属 UI
- 图片、结构化表格、代码块等块级内容统一遵守同一条内容版心宽度约束
- `lineWrap` 的折行基准从“整个编辑器容器宽度”调整为“当前内容列可用宽度”
- 在浏览器全屏、屏幕全屏和普通嵌入场景下保持一致的内容版心行为

## Capabilities

### New Capabilities

- `editor-content-layout`: 编辑器内部内容版心与最大书写宽度能力，包括默认 720px 内容列、居中排版、块级内容跟随版心以及可配置的 `contentMaxWidth`

### Modified Capabilities

- `editor-line-wrap`: 长文本折行的宽度基准改为内容列可用宽度，而不是整个编辑器外框宽度
- `markdown-editor`: 新增 `contentMaxWidth` prop，并将其纳入核心编辑器显示配置

## Impact

- `src/types/editor.ts`: `EditorProps` 新增 `contentMaxWidth?: number`
- `src/components/UnaEditor.vue`: 容器样式新增内容版心相关 CSS 变量
- `src/composables/useEditor.ts`: 编辑器基础 theme 和运行时 reconfigure 逻辑需要支持内容列宽度
- `src/extensions/hybridMarkdown.ts`: 图片与正文类内容需要对齐统一版心
- `src/extensions/codeBlockLivePreview.ts`: 代码块 live preview 壳层需要服从内容列宽度
- `src/extensions/structuredTable.ts`: 结构化表格容器需要服从内容列宽度，同时保持附属操作 UI 正常定位
- `README.md`、`README.en.md`、`playground/`: 需要补充内容版心默认行为和可配置示例
