## 1. 环境准备

- [x] 1.1 安装 CodeMirror 6 核心依赖 (@codemirror/state, @codemirror/view, @codemirror/commands)
- [x] 1.2 安装 CodeMirror 6 语言支持 (@codemirror/lang-markdown, @codemirror/language)
- [x] 1.3 安装 CodeMirror 6 主题包 (@codemirror/theme-one-dark)
- [x] 1.4 创建 src/components/ 目录结构
- [x] 1.5 创建 src/composables/ 目录结构
- [x] 1.6 创建 src/locales/ 目录结构
- [x] 1.7 创建 src/types/ 目录结构

## 2. 类型定义

- [x] 2.1 创建 src/types/editor.ts 并定义 EditorProps 接口
- [x] 2.2 在 src/types/editor.ts 中定义 EditorEvents 接口
- [x] 2.3 定义 EditorExposed 接口用于暴露的方法
- [x] 2.4 定义 Locale 类型和 CustomLocale 接口
- [x] 2.5 从 src/types/editor.ts 导出所有类型

## 3. 国际化

- [x] 3.1 创建 src/locales/zh-CN.ts 中文语言包
- [x] 3.2 创建 src/locales/en-US.ts 英文语言包
- [x] 3.3 创建 src/locales/index.ts 导出 locale 类型和默认值
- [x] 3.4 实现 defineLocale() 辅助函数用于类型安全的自定义语言包

## 4. Composables - useEditor

- [x] 4.1 创建 src/composables/useEditor.ts 文件
- [x] 4.2 在 onMounted 中实现 EditorView 初始化
- [x] 4.3 实现 v-model 同步：监听 modelValue prop 并更新 EditorView
- [x] 4.4 实现 v-model 同步：监听 EditorView 更新并触发 update:modelValue
- [x] 4.5 添加 updateListener 扩展处理 docChanged 事件
- [x] 4.6 基于 lineNumbers prop 实现行号扩展
- [x] 4.7 实现 Markdown 语言支持扩展
- [x] 4.8 实现主题切换（light/dark）扩展
- [x] 4.9 实现 placeholder 扩展
- [x] 4.10 通过 EditorState.readOnly 实现 disabled/readonly 状态
- [x] 4.11 实现 Mod-s 快捷键映射，包含 preventDefault 和 onSave 事件触发
- [x] 4.12 在 domEventHandlers 中实现图片拖拽处理器
- [x] 4.13 在 domEventHandlers 中实现图片粘贴处理器
- [x] 4.14 从 DataTransfer 提取图片文件并触发 onDrop 事件
- [x] 4.15 实现 focus 事件处理器并触发 focus 事件
- [x] 4.16 实现 blur 事件处理器并触发 blur 事件
- [x] 4.17 实现 focus() 方法用于编程式聚焦编辑器
- [x] 4.18 实现 getSelection() 方法返回选中文本
- [x] 4.19 在 onBeforeUnmount 中清理 EditorView
- [x] 4.20 从 useEditor 返回所有必要的 refs 和方法

## 5. Composables - useFullscreen

- [x] 5.1 创建 src/composables/useFullscreen.ts 文件
- [x] 5.2 实现 toggleFullscreen(mode) 方法用于浏览器全屏
- [x] 5.3 实现 toggleFullscreen(mode) 方法用于屏幕全屏（CSS）
- [x] 5.4 监听 fullscreenchange 事件同步状态
- [x] 5.5 实现 exitFullscreen() 方法
- [x] 5.6 从 useFullscreen 返回全屏状态和方法

## 6. Editor 组件

- [x] 6.1 创建 src/components/UnaEditor.vue 文件
- [x] 6.2 使用 defineProps 和 TypeScript 定义组件 props
- [x] 6.3 使用 defineEmits 和 TypeScript 定义组件 emits
- [x] 6.4 创建编辑器容器 ref 用于挂载 CodeMirror
- [x] 6.5 调用 useEditor composable 并传入所有 props 和 emits
- [x] 6.6 调用 useFullscreen composable
- [x] 6.7 通过 defineExpose 暴露 focus、getSelection、toggleFullscreen、exitFullscreen
- [x] 6.8 添加包含编辑器容器 div 的 template
- [x] 6.9 添加编辑器容器的 scoped 样式
- [x] 6.10 添加全屏样式（browser 模式使用 fixed 定位，screen 模式使用 Fullscreen API）

## 7. 导出配置

- [x] 7.1 更新 src/index.ts 导出 UnaEditor 组件
- [x] 7.2 从 src/types/editor.ts 导出所有类型
- [x] 7.3 从 src/locales/index.ts 导出 locale 工具函数

## 8. Playground 演示

- [x] 8.1 更新 playground/src/App.vue 导入 UnaEditor 组件
- [x] 8.2 添加基础 UnaEditor 使用示例（v-model）
- [x] 8.3 添加行号切换演示
- [x] 8.4 添加语言切换演示（zh-CN / en-US）
- [x] 8.5 添加主题切换演示（light / dark）
- [x] 8.6 添加全屏模式演示按钮
- [x] 8.7 添加图片拖拽处理演示
- [x] 8.8 添加保存事件处理演示
- [x] 8.9 添加 playground 演示布局样式

## 9. 测试

- [x] 9.1 创建 UnaEditor 组件测试文件
- [x] 9.2 添加 v-model 绑定测试
- [x] 9.3 添加 lineNumbers prop 测试
- [x] 9.4 添加 locale prop 测试
- [x] 9.5 添加 theme prop 测试
- [x] 9.6 添加暴露方法测试（focus、getSelection）
- [x] 9.7 运行所有测试并确保通过

## 10. 后续修复和优化

- [x] 10.1 配置 Playground 的 lint、format、typecheck 脚本
- [x] 10.2 修复 ESLint 配置，不忽略 playground 目录
- [x] 10.3 复用 tsconfig.json 用于类型声明生成
- [x] 10.4 使用 Compartment API 实现 theme、lineNumbers 等 props 的响应式更新
- [x] 10.5 修正全屏模式实现（browser=CSS viewport, screen=Fullscreen API）
- [x] 10.6 修复 vite.config.ts 的 lint 错误（path 和 __dirname）
- [x] 10.7 在 tsconfig.json 中添加 DOM 类型库配置
- [x] 10.8 组件重命名为 UnaEditor 以符合 Vue 3 多单词命名规范
