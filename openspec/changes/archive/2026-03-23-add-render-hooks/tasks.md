## 1. 类型定义

- [x] 1.1 在 `src/types/editor.ts` 中新增 `ImageRenderContext`
- [x] 1.2 在 `src/types/editor.ts` 中新增 `ImageRenderResult`
- [x] 1.3 在 `src/types/editor.ts` 中新增 `LinkRenderContext`
- [x] 1.4 在 `src/types/editor.ts` 中新增 `LinkRenderResult`
- [x] 1.5 在 `src/types/editor.ts` 中新增 `RenderHooks`
- [x] 1.6 为 `EditorProps` 增加 `renderHooks` 字段
- [x] 1.7 在图片 / 链接上下文中补充可选 `title` 字段

## 2. 图片渲染扩展

- [x] 2.1 扩展 `ImageWidget` 构造参数，支持变换后的 `src`
- [x] 2.2 扩展 `ImageWidget` 构造参数，支持 `className`、`dataset`、`style`
- [x] 2.3 更新 `ImageWidget.eq()`，确保新增字段参与比较
- [x] 2.4 更新 `ImageWidget.toDOM()`，把自定义 class 应用到图片元素
- [x] 2.5 更新 `ImageWidget.toDOM()`，把自定义 dataset 应用到图片元素
- [x] 2.6 更新 `ImageWidget.toDOM()`，把 `style` 记录序列化并应用到图片元素

## 3. 链接上下文提取与属性构建

- [x] 3.1 基于语法树子节点提取链接 `href`
- [x] 3.2 基于语法树子节点提取链接可见 `text`
- [x] 3.3 基于语法树子节点提取可选 `title`
- [x] 3.4 沿用现有图片解析逻辑，并为图片上下文补充 `title` 提取逻辑
- [x] 3.5 实现链接装饰属性构建助手，负责合并 `className`、`dataset`、`style`
- [x] 3.6 为链接保留稳定系统字段，例如变换后的 `data-href`
- [x] 3.7 明确并实现系统保留字段与用户自定义 dataset 的冲突处理规则

## 4. Hook 安全调用

- [x] 4.1 实现 `safeCallImageHook`，在异常时回退到原始图片上下文
- [x] 4.2 实现 `safeCallLinkHook`，在异常时回退到原始链接上下文
- [x] 4.3 两类 hook 异常都通过 `console.warn` 输出告警
- [x] 4.4 `void` / `undefined` 返回值必须被视为“不做额外变换”

## 5. Decoration 集成

- [x] 5.1 更新 `buildDecorations` 签名，使其可接收 `renderHooks`
- [x] 5.2 图片节点在存在 `renderHooks.image` 时调用图片 hook
- [x] 5.3 图片节点把 hook 结果传给扩展后的 `ImageWidget`
- [x] 5.4 链接节点在不存在 `renderHooks.link` 时继续使用当前默认 `linkDecoration`
- [x] 5.5 链接节点在存在 `renderHooks.link` 时改用增强版 mark decoration，而不是引入 `LinkWidget`
- [x] 5.6 增强版链接 decoration 必须保留现有链接文本与嵌套行内样式
- [x] 5.7 active scope 中的链接 / 图片仍然跳过渲染替换，保持源码编辑态

## 6. 插件与扩展接线

- [x] 6.1 更新 `HybridMarkdownPlugin`，支持接收 `renderHooks`
- [x] 6.2 将 `renderHooks` 从插件实例传入 `buildDecorations`
- [x] 6.3 更新 `createLivePreviewExtensions`，使其可接收 `renderHooks`
- [x] 6.4 仅在 `livePreview` 开启时启用带 hooks 的 live preview 扩展

## 7. 组件与运行时重配置

- [x] 7.1 `UnaEditor.vue` 接收并透传 `renderHooks`
- [x] 7.2 `useEditor` 初始化 `EditorView` 时把 `renderHooks` 传入 live preview 扩展
- [x] 7.3 监听 `renderHooks` prop 变化，并在 `livePreview` 开启时通过 `Compartment.reconfigure(...)` 触发重建
- [x] 7.4 监听 `livePreview` 与 `renderHooks` 的组合变化，确保开关切换后行为一致

## 8. 测试与验证

- [x] 8.1 回归测试：图片地址可通过 hook 被代理或重写
- [x] 8.2 回归测试：图片可注入 `className`、`dataset`、`style`
- [x] 8.3 回归测试：链接目标可通过 hook 转换并写入稳定 DOM 属性
- [x] 8.4 回归测试：链接可注入 `className`、`dataset`、`style`
- [x] 8.5 回归测试：未提供任何 hooks 时，图片与链接默认行为保持不变
- [x] 8.6 回归测试：仅提供 `image` hook 时，链接行为保持默认
- [x] 8.7 回归测试：仅提供 `link` hook 时，图片行为保持默认
- [x] 8.8 回归测试：hook 抛错时回退到原始值并输出告警
- [x] 8.9 回归测试：hook 返回 `void` / `undefined` 时保持原始值
- [x] 8.10 回归测试：`renderHooks` 在运行时更新后会触发重新渲染
- [x] 8.11 回归测试：带 `**bold**` 等嵌套样式的链接在 link hook 存在时仍保持原有行内渲染
- [x] 8.12 回归测试：光标进入链接 / 图片 active scope 后仍显示原始 Markdown
- [x] 8.13 回归测试：hook 不能修改链接可见文本

## 9. 文档与示例

- [x] 9.1 在 playground 中增加 `renderHooks` 用法示例
- [x] 9.2 文档说明图片代理与相对路径解析用例
- [x] 9.3 文档说明链接目标暴露为稳定 DOM 属性的语义
- [x] 9.4 文档说明 hooks 必须同步、快速、纯函数
- [x] 9.5 为新增类型与关键辅助函数补充英文 JSDoc
