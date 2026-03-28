## 1. 类型与主题解析

- [x] 1.1 在 `src/types/editor.ts` 中定义面向外部的 `EditorThemeContent`、`EditorThemeTable`、`EditorTheme` 类型
- [x] 1.2 将 `EditorProps.theme` 从 `'light' | 'dark'` 扩展为 `'light' | 'dark' | EditorTheme`
- [x] 1.3 在主题模块中定义内部 `ResolvedEditorTheme` 类型，明确其不作为公共 API 暴露
- [x] 1.4 设计并实现受控 merge 逻辑，确保自定义主题对象按 token group 继承 preset 默认值，而不是浅合并

## 2. 预置主题与主题注册表

- [x] 2.1 创建 `src/themes/editorThemes.ts`，提供完整的 light / dark resolved preset
- [x] 2.2 将当前内容区硬编码样式迁移到 light preset 的 content token 中，保证默认视觉尽量不变
- [x] 2.3 为 dark preset 提供与深色背景匹配的 content token 和 table token
- [x] 2.4 实现 `resolveEditorTheme()`，统一解析字符串主题与自定义覆盖对象
- [x] 2.5 在 `src/index.ts` 中导出公共主题类型与可公开使用的预置主题常量

## 3. Hybrid 扩展重构

- [x] 3.1 将当前 `HYBRID_THEME` 拆分为稳定的 `HYBRID_BASE_THEME` 和动态的 `createContentTheme(content)` 工厂
- [x] 3.2 确保 `.cm-una-code-font` 等非主题相关基础样式保留在 base theme 中，并同时服务 `livePreview` / 非 `livePreview` 路径
- [x] 3.3 在 `buildDecorations()` 中为标题文本行添加始终存在的 `cm-heading-line-{level}` line decoration
- [x] 3.4 明确实现 Setext heading 的 line decoration 只挂在内容行，不挂在 underline 分隔行
- [x] 3.5 在 `createContentTheme()` 中生成 `.cm-hybrid-heading-*` 与 `.cm-heading-line-* .tok-heading` 的统一样式，保证标题在渲染态与源码态字号、字重、行高一致
- [x] 3.6 在 `createContentTheme()` 中生成 `.cm-heading-line-* .tok-meta`、链接、强调、加粗、inline code、blockquote、list marker、task checkbox 等主题样式
- [x] 3.7 调整 active scope 的 decoration 策略，使强调、加粗、链接、inline code 在源码态下仍保留接近渲染态的视觉样式；合法图片语法在源码态下继续显示并存预览

## 4. 编辑器集成

- [x] 4.1 在 `useEditor.ts` 中统一先解析 `ResolvedEditorTheme`，再把结果分发给 chrome、content、code block auto theme
- [x] 4.2 新增 `contentThemeCompartment`，让主题切换时只重配内容主题 extension，而不重建编辑器实例
- [x] 4.3 将 `themeCompartment` 的 chrome 切换改为基于 resolved theme，而不是直接判断原始 prop 是否等于 `'dark'`
- [x] 4.4 将 `resolveCodeTheme()` 的 `auto` 跟随逻辑改为依赖 resolved theme 的 `type`
- [x] 4.5 更新 `UnaEditor.vue` 中的容器 CSS 变量，让结构化表格表头背景色从 resolved theme.table 读取

## 5. Playground 与文档验证

- [x] 5.1 保持 playground 中 light / dark 主题切换行为不变
- [x] 5.2 增加一个最小自定义主题示例，验证“基于 dark preset 仅覆盖 link / table header”等部分覆盖路径
- [x] 5.3 确认 README 或后续文档可以清楚表达“自定义主题是覆盖对象，不需要用户构造 CodeMirror Extension”

## 6. 测试

- [x] 6.1 为 `resolveEditorTheme()` 编写单元测试，覆盖字符串主题、对象主题、部分覆盖继承和未知字段不影响默认值的路径
- [x] 6.2 为 `createContentTheme()` 编写单元测试，验证关键选择器和 token 映射结果
- [x] 6.3 增加运行时主题切换测试，验证 content theme、table header CSS 变量和相关渲染结果会同步更新
- [x] 6.4 增加 `codeTheme='auto'` 与自定义主题对象联动测试，验证 `type: 'dark'` / `type: 'light'` 的自动跟随行为
- [x] 6.5 增加标题进出激活态不跳行高的测试，并覆盖 ATX heading 与 Setext heading 两种路径
- [x] 6.6 验证非 `livePreview` 模式在主题重构后仍保留代码字体相关样式
- [x] 6.7 跑通现有相关测试，确认主题重构没有破坏 hybrid markdown、structured table 与 code block theming 的既有能力
- [x] 6.8 增加 active scope 下强调、加粗、inline code 与图片并存预览的回归测试，并覆盖图片加载失败占位提示

## 7. 宿主 CSS Reset 稳健性补充

- [x] 7.1 在 `src/extensions/hybridMarkdown.ts` 中明确关键 Markdown 语义样式的 selector ownership，为 `.cm-hybrid-strong`、`.cm-hybrid-emphasis`、`.cm-hybrid-link`、`.cm-hybrid-inline-code`、`.cm-una-code-font` 等补充后代兜底选择器，避免常见宿主 reset 清空关键视觉语义
- [x] 7.2 保持标题源码态继续由 `cm-heading-line-*` 等稳定锚点承载字号、字重、行高和 syntax mark 颜色，不把关键标题样式退回为仅依赖内层 `tok-*` span
- [x] 7.3 增加宿主 reset 场景的回归测试，模拟对编辑器内 `span` 或常见内联标签的统一样式重设，验证强调、加粗、链接、行内代码与标题源码态仍保留主题语义
