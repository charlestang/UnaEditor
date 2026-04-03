## 1. Types and Public API

- [x] 1.1 在 `src/types/editor.ts` 中新增 `contentMaxWidth?: number`，并更新相关导出类型
- [x] 1.2 在 `src/components/UnaEditor.vue` 中为 `contentMaxWidth` 提供默认值 `720`，并将其写入容器级 CSS 变量

## 2. Core Content Column Layout

- [x] 2.1 在 `src/composables/useEditor.ts` 的基础 layout theme 中引入内容版心布局，使 `.cm-content` 在 gutter 右侧区域内形成居中的正文列
- [x] 2.2 确保左侧全局 line number gutter 继续贴靠编辑器外框左侧，不被内容版心一起推向中间
- [x] 2.3 在 `contentMaxWidth` 运行时变化时触发编辑器重新测量，保证不重建实例且在 fullscreen / 非 fullscreen 下行为一致

## 3. Shared Width for Rich Blocks

- [x] 3.1 调整 `src/extensions/hybridMarkdown.ts` 中图片相关样式，使图片宽度跟随统一内容版心，而不是使用独立的固定上限
- [x] 3.2 调整 `src/extensions/codeBlockLivePreview.ts` 中代码块壳层布局，使源码态与 live preview 态代码块整体宽度服从统一内容版心
- [x] 3.3 调整 `src/extensions/structuredTable.ts` 中结构化表格容器布局，使表格整体宽度服从统一内容版心，并验证 overlay / handle 定位不偏移

## 4. Tests and Verification

- [x] 4.1 为默认 `720px` 内容版心、可配置 `contentMaxWidth`、窄容器收缩行为编写单元测试
- [x] 4.2 为“gutter 不计入内容版心宽度”的布局规则补充测试，验证行号仍贴左侧外框
- [x] 4.3 为图片、代码块、结构化表格跟随统一内容版心补充测试或可验证用例
- [x] 4.4 在 Playground 中手测普通模式、浏览器全屏、屏幕全屏下的内容版心表现与表格交互

## 5. Docs and Playground

- [x] 5.1 在 Playground 控件中新增 `contentMaxWidth` 调节入口，便于验证运行时响应式变化
- [x] 5.2 更新 `README.md`、`README.en.md` 与相关 API 文档，说明默认 `720px` 内容版心及 `contentMaxWidth` 的用途
