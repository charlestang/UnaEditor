## Why

UnaEditor 需要一个核心的编辑器组件来提供 Markdown 编辑功能。这是组件库的基础能力，将基于 CodeMirror 6 构建，提供现代化的编辑体验。

## What Changes

- 添加 `UnaEditor` 组件，集成 CodeMirror 6
- 实现 v-model 双向绑定支持内容编辑
- 添加国际化支持（内置中文和英文，支持自定义语言包）
- 实现全屏模式（浏览器页面全屏和整个屏幕全屏）
- 添加图片拖拽和粘贴事件处理（onDrop）
- 实现键盘快捷键支持（Mod-s 保存，屏蔽浏览器默认行为）
- 提供组件方法：focus、getSelection、toggleFullscreen、exitFullscreen
- 支持行号显示切换
- 支持主题配置

## Capabilities

### New Capabilities

- `markdown-editor`: 基于 CodeMirror 6 的 Markdown 编辑器组件，提供完整的编辑、事件、国际化和全屏功能

### Modified Capabilities

<!-- 无现有能力需要修改 -->

## Impact

**新增依赖**:
- CodeMirror 6 核心包和 Markdown 语言支持
- 可能需要的 CodeMirror 扩展（行号、快捷键、主题等）

**新增文件**:
- `src/components/UnaEditor.vue` - 主编辑器组件
- `src/composables/useEditor.ts` - 编辑器逻辑复用
- `src/composables/useFullscreen.ts` - 全屏功能复用
- `src/locales/` - 国际化语言包（zh-CN, en-US）
- `src/types/editor.ts` - 编辑器相关类型定义

**影响范围**:
- Playground 需要添加 UnaEditor 组件的演示页面
- Playground 需要配置 eslint、format、typecheck 脚本
- package.json 需要添加 CodeMirror 6 相关依赖
- 导出入口 src/index.ts 需要导出新组件
- tsconfig.json 需要添加 DOM 类型库支持
