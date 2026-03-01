## Context

UnaEditor 是一个基于 Vue 3 的编辑器组件库，需要提供一个核心的 Markdown 编辑器组件。当前项目已完成基础脚手架搭建，包括 TypeScript、Vite、ESLint、Prettier 和 Vitest 配置。

**技术栈约束**:
- Vue 3.5.25+ (Composition API)
- TypeScript 5.9.3+ (strict mode)
- CodeMirror 6 (现代化编辑器内核)
- Vite 7.3.1+ (构建工具)

**当前状态**: 项目结构已就绪，但尚未添加任何组件实现。

## Goals / Non-Goals

**Goals:**
- 创建一个可复用的 Vue 3 编辑器组件，封装 CodeMirror 6
- 支持 v-model 双向绑定，符合 Vue 3 最佳实践
- 提供完整的事件系统（onChange、onSave、onFocus、onBlur、onDrop）
- 实现国际化支持（内置中英文，可扩展）
- 支持全屏模式（浏览器页面全屏和整个屏幕全屏）
- 处理图片拖拽和粘贴事件
- 实现 Mod-s 快捷键并屏蔽浏览器默认行为

**Non-Goals:**
- 不实现预览组件（Preview）- 未来可能添加
- 不实现复杂的快捷键系统 - 初期仅支持 Mod-s
- 不处理图片上传逻辑 - 仅触发事件，由用户处理
- 不实现工具栏 - 专注于核心编辑功能

## Decisions

### 1. CodeMirror 6 集成方式

**决策**: 使用 Composition API 创建 `useEditor` composable 来封装 CodeMirror 6 实例。

**理由**:
- CodeMirror 6 是命令式 API，需要在 Vue 的响应式系统中妥善管理
- Composable 模式允许逻辑复用和测试隔离
- 在 `onMounted` 中初始化 EditorView，在 `onBeforeUnmount` 中销毁

**替代方案**:
- 直接在组件中管理 - 会导致组件代码臃肿，难以测试
- 使用 class 封装 - 不符合 Vue 3 Composition API 风格

### 2. v-model 实现

**决策**: 使用 `modelValue` prop 和 `update:modelValue` event 实现 v-model。

**实现细节**:
- 监听 `modelValue` prop 变化，同步到 CodeMirror EditorView
- 监听 CodeMirror 的 `updateListener` 扩展，触发 `update:modelValue`
- 使用 `EditorView.update` 事件的 `docChanged` 标志避免循环更新

**理由**:
- 符合 Vue 3 v-model 规范
- 支持外部控制和内部编辑的双向同步

### 3. 国际化架构

**决策**: 创建独立的 locale 系统，内置中英文，支持用户传入自定义语言包。

**结构**:
```
src/locales/
  ├── index.ts       # 导出 locale 类型和默认语言
  ├── zh-CN.ts       # 中文语言包
  └── en-US.ts       # 英文语言包
```

**API 设计**:
- `locale` prop 接受 `'zh-CN' | 'en-US' | CustomLocale` 类型
- 提供 `defineLocale()` 辅助函数用于类型安全的自定义语言包

**理由**:
- 简单直接，无需引入 vue-i18n 等重型库
- 类型安全，支持 IDE 自动补全
- 用户可以完全自定义语言包

### 4. 全屏模式实现

**决策**: 支持两种全屏模式，通过 `toggleFullscreen(mode)` 方法切换。

**模式**:
1. **Browser Fullscreen** (默认): 使用 CSS (`position: fixed; inset: 0; z-index: 9999`) 填充浏览器视口
2. **Screen Fullscreen**: 使用 Fullscreen API (`element.requestFullscreen()`) 填充整个屏幕

**实现**:
- 使用 `useFullscreen` composable 封装全屏逻辑
- Browser 模式通过添加 CSS 类实现视口填充
- Screen 模式使用 Fullscreen API 实现真正的全屏
- 监听 `fullscreenchange` 事件同步状态
- 提供 `exitFullscreen()` 方法退出全屏

**理由**:
- Browser Fullscreen 适合在浏览器内的全屏编辑，无需用户权限
- Screen Fullscreen 提供真正的全屏体验，适合专注写作场景
- 两种模式满足不同使用场景

**风险**: Fullscreen API 在某些浏览器中可能被阻止，需要提供降级提示。

### 5. 图片拖拽和粘贴处理

**决策**: 监听 `drop` 和 `paste` 事件，提取图片文件，触发 `onDrop` 事件。

**实现**:
- 在 CodeMirror 的 `domEventHandlers` 中注册 `drop` 和 `paste` 处理器
- 从 `DataTransfer` 中提取 `image/*` 类型的文件
- 触发 `onDrop(files: File[])` 事件，由用户处理上传逻辑
- 阻止默认行为，避免图片被插入为 base64

**理由**:
- 组件不应该处理上传逻辑（需要服务器端配合）
- 用户可以自由选择上传方式（OSS、本地服务器等）
- 统一 drag 和 paste 的处理逻辑，简化 API

### 6. 键盘快捷键系统

**决策**: 初期仅实现 Mod-s (Ctrl/Cmd-s) 快捷键，触发 `onSave` 事件。

**实现**:
- 使用 CodeMirror 的 `keymap` 扩展注册快捷键
- 使用 `Mod-s` 语法自动适配 macOS (Cmd) 和 Windows/Linux (Ctrl)
- 在快捷键处理器中 `preventDefault()` 阻止浏览器默认保存行为
- 触发 `onSave` 事件

**理由**:
- Mod-s 是最常用的保存快捷键，优先实现
- CodeMirror 的 keymap 系统已经很完善，无需自己实现
- 未来可以轻松扩展更多快捷键

**替代方案**:
- 使用浏览器原生 `keydown` 事件 - 无法与 CodeMirror 的快捷键系统集成

### 7. 动态配置响应式更新

**决策**: 使用 CodeMirror 6 的 Compartment API 实现 props 的响应式更新。

**实现**:
- 为 theme、lineNumbers、placeholder、readonly 等配置创建独立的 Compartment
- 使用 Vue 的 `watch` 监听 props 变化
- 通过 `editorView.dispatch({ effects: compartment.reconfigure(...) })` 动态更新配置

**理由**:
- CodeMirror 6 的扩展在初始化后是不可变的
- Compartment API 是官方推荐的动态配置方案
- 实现真正的响应式，符合 Vue 3 的使用习惯

**替代方案**:
- 重新创建 EditorView - 性能差，会丢失编辑状态
- 不支持动态更新 - 用户体验差

### 8. 组件 Props 和 Events 设计

**Props**:
- `modelValue: string` - 编辑器内容（v-model）
- `language?: string` - 语言模式，默认 'markdown'
- `lineNumbers?: boolean` - 是否显示行号，默认 true
- `locale?: string | CustomLocale` - 语言包，默认 'zh-CN'
- `placeholder?: string` - 占位符文本
- `disabled?: boolean` - 是否禁用
- `readonly?: boolean` - 是否只读
- `theme?: 'light' | 'dark'` - 主题，默认 'light'

**Events**:
- `update:modelValue(value: string)` - 内容变化
- `change(value: string)` - 内容变化（语义化别名）
- `save()` - Mod-s 触发
- `focus()` - 获得焦点
- `blur()` - 失去焦点
- `drop(files: File[])` - 图片拖拽/粘贴

**Exposed Methods** (通过 `defineExpose`):
- `focus(): void` - 聚焦编辑器
- `getSelection(): string` - 获取选中文本
- `toggleFullscreen(mode?: 'browser' | 'screen'): void` - 切换全屏
- `exitFullscreen(): void` - 退出全屏

**理由**:
- Props 设计遵循 Vue 3 最佳实践
- Events 提供完整的生命周期钩子
- Exposed methods 允许父组件控制编辑器行为

### 9. 组件命名规范

**决策**: 组件命名为 `UnaEditor` 而非 `Editor`。

**理由**:
- Vue 3 风格指南要求组件名必须是多个单词
- 避免与 HTML 元素或未来的 Web 标准冲突
- 提高代码可读性和可维护性

### 10. 依赖选择

**CodeMirror 6 核心包**:
- `@codemirror/state` - 状态管理
- `@codemirror/view` - 视图层
- `@codemirror/commands` - 基础命令
- `@codemirror/lang-markdown` - Markdown 语言支持
- `@codemirror/language` - 语言系统
- `@codemirror/theme-one-dark` - 暗色主题（可选）

**理由**:
- CodeMirror 6 采用模块化设计，按需引入
- Markdown 是主要定位，优先支持
- 未来可以轻松添加其他语言支持

### 11. TypeScript 配置

**决策**: 在 `tsconfig.json` 中显式配置 `lib: ["ES2020", "DOM", "DOM.Iterable"]`。

**理由**:
- 当 `types` 字段存在时，TypeScript 不会自动包含 DOM 类型库
- 组件需要使用 `HTMLElement` 等浏览器 API 类型
- 显式声明避免类型错误

### 12. Playground 开发环境

**决策**: 为 Playground 配置独立的 lint、format、typecheck 脚本。

**实现**:
- 在 `playground/package.json` 中添加开发脚本
- 更新 ESLint 配置，不忽略 playground 目录
- 创建 `tsconfig.build.json` 用于类型声明生成

**理由**:
- Playground 是独立的开发环境，需要完整的工具链
- 保证 Playground 代码质量
- 方便开发时快速验证组件功能

## Risks / Trade-offs

**[风险] CodeMirror 6 学习曲线** → 提供清晰的 composable 封装，隐藏复杂性

**[风险] Fullscreen API 兼容性** → 提供 Screen Fullscreen 降级方案

**[权衡] 不处理图片上传** → 保持组件职责单一，但用户需要自己实现上传逻辑

**[权衡] 初期仅支持 Mod-s 快捷键** → 简化实现，未来可扩展

**[权衡] 内置仅两种语言** → 减小包体积，但用户可以自定义语言包

## Migration Plan

**部署步骤**:
1. 安装 CodeMirror 6 依赖
2. 实现 `useEditor` composable（包含 Compartment API 支持）
3. 实现 `useFullscreen` composable
4. 实现 `UnaEditor.vue` 组件
5. 添加类型定义
6. 配置 TypeScript DOM 类型库
7. 在 `src/index.ts` 中导出组件
8. 配置 Playground 开发环境
9. 在 Playground 中添加演示页面
10. 运行测试确保功能正常

**回滚策略**: 由于是新增功能，回滚只需删除相关文件和依赖即可。

## Open Questions

- 是否需要支持更多 CodeMirror 扩展的配置（如 linter、autocomplete）？
- 主题系统是否需要支持自定义主题？
- 是否需要提供 `EditorView` 实例的直接访问（高级用户场景）？
