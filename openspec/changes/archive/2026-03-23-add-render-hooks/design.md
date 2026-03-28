## Context

当前 `livePreview` 渲染链路如下：

- `UnaEditor.vue`
- `useEditor`
- `createLivePreviewExtensions`
- `HybridMarkdownPlugin`
- `buildDecorations`

其中：

- 图片节点当前通过 `ImageWidget` 被替换为真实 `<img>`
- 链接节点当前仍走 `Decoration.mark(...)`，只负责视觉样式，不创建独立 widget
- active scope 机制会在光标进入链接、图片、强调等结构时回退到原始 Markdown 编辑态

这意味着：

1. 图片天然适合在 widget 层扩展自定义属性
2. 链接如果直接整体改成 widget，会改变当前编辑、点击、光标映射和嵌套行内样式的行为边界
3. CodeMirror 的 `MarkDecorationSpec` 实际支持 `attributes` / `class` / `tagName`，因此链接并不一定要通过 widget 才能承载扩展属性

此外，我额外核对了当前 Markdown 语法树结构：`Link` / `Image` 节点内部已经包含 `URL`、`LinkTitle` 和正文子区间，但两者的可提取粒度并不完全对称。链接的 `href` / `title` / 可见文本更适合直接从语法树提取；图片则更适合继续复用现有 `parseImage` 路径来获取 `alt` 与 `src`，再结合语法树补齐可选 `title`。因此，本次 change 不应追求“图片与链接完全共用一套解析策略”，而应采用更保守的混合方案。

## Goals / Non-Goals

**Goals**

- 允许用户在渲染前同步转换图片地址与链接目标
- 支持为图片和链接注入 `className`、`dataset`、`style`
- 保持未提供 hooks 时的默认行为不变
- 保留现有 active scope 编辑体验
- 对复杂链接内容尽量复用当前 decoration 体系，避免破坏粗体、斜体等嵌套行内渲染
- 支持 `renderHooks` prop 在运行时更新后重新渲染

**Non-Goals**

- 不支持通过 hook 修改链接可见文本
- 不支持用户自定义完整 widget 渲染器
- 不在 hook 内做异步流程或网络请求编排
- 不为非 `livePreview` 模式引入 hook 行为
- 不在本次 change 中引入“编辑器内默认可点击跳转链接”的新交互

## Decisions

### 决策 1：使用统一的 `renderHooks` API

**选择**

对外暴露单个 `renderHooks` prop，内部包含 `image` 与 `link` 两个可选钩子。

**原因**

- 比多个离散 prop 更容易扩展
- 调用方能把渲染定制集中放在一个对象里管理
- 保持类型定义清晰，避免“一个函数处理多种元素类型”的分支型 API

### 决策 2：图片继续使用 widget，链接继续使用 mark decoration

**选择**

- 图片保留 `ImageWidget` 路径，只扩展其可配置属性
- 链接保留当前 `Decoration.mark(...)` 路径；只有在存在 `renderHooks.link` 时，才创建带额外属性的增强版 link decoration
- 本次 change 不新增 `LinkWidget`

**原因**

- 这能直接满足“默认行为不变”的兼容性要求
- 链接继续走 mark decoration，能最大限度复用现有粗体、斜体、inline code 等嵌套行内渲染结果
- 避免把“支持自定义属性”误升级成“彻底重做链接渲染模型”

**结果**

- 没有 `renderHooks.link` 时，继续使用当前 `.cm-hybrid-link` 样式路径
- 有 `renderHooks.link` 时，链接仍然显示为当前可编辑文本语义，只是在渲染 DOM 上追加变换后的目标地址和用户提供的元数据

### 决策 3：链接目标通过稳定 DOM 属性暴露，而不是默认引入浏览器导航

**选择**

当存在 `renderHooks.link` 时，渲染层会把“变换后的目标地址”写入稳定的 DOM 属性，例如保留为 `data-href`，并合并用户返回的自定义 `dataset` / `className` / `style`。

**原因**

- 当前编辑器中的链接本来就不是“可直接点击跳转”的浏览器 anchor 体验
- 本次目标是提供渲染定制和 DOM 元数据，不是新增导航交互
- 如果贸然在编辑区里引入真实 `<a href>` 行为，会牵涉焦点、选区、默认点击行为等额外回归风险

**结果**

- hook 使用方可以从渲染后的 DOM 中读取稳定的目标地址与元数据
- 后续如果要支持真正的链接跳转或悬浮卡交互，可以在独立 change 中基于这些稳定属性继续扩展

### 决策 4：链接优先走语法树提取，图片沿用现有解析并补充 title

**选择**

采用混合提取策略：

- 链接上下文优先从语法树子节点提取
- 图片上下文继续复用现有图片 Markdown 解析逻辑获取 `alt` / `src`
- 图片与链接都可以结合 `LinkTitle` 补充可选 `title`
- `raw` 仍提供完整原始 Markdown 片段作为兜底调试信息

**原因**

- 链接的语法树信息已经足够完整，没必要再发明一套不稳定的字符串解析器
- 图片当前已有工作中的解析路径，继续复用比强行统一方案更稳妥
- 这能避免为了“统一实现形式”而引入额外回归

**结果**

- `ImageRenderContext` 至少提供 `src`、`alt`、`title`、`raw`、`position`
- `LinkRenderContext` 至少提供 `href`、`text`、`title`、`raw`、`position`

### 决策 5：`renderHooks` 必须支持运行时重配置

**选择**

`renderHooks` 被视为标准 Vue prop。只要 `livePreview` 处于开启状态，`renderHooks` 变化后就必须通过 `Compartment.reconfigure(...)` 触发 live preview 扩展重建。

**原因**

- 调用方很可能在运行时切换路径解析规则、代理配置或项目上下文
- 既然 `theme`、`livePreview`、`codeTheme` 都支持动态更新，`renderHooks` 不应成为例外

**结果**

- 初次挂载会读取 `renderHooks`
- 后续 prop 变化会触发可见区域重新渲染
- `livePreview` 为 `false` 时，不会调用 hooks

### 决策 6：错误处理采用“告警 + 回退到原始值”

**选择**

图片与链接 hook 都通过安全调用助手包装：

- `try/catch`
- `console.warn`
- 单项字段失败时回退到原始上下文

**原因**

- 用户扩展逻辑不应该把编辑器打崩
- 渲染失败时，最保守的行为就是继续显示原始内容

### 决策 7：hook 返回值使用 `Partial<Result> | void`

**选择**

允许 hook 返回 `void` / `undefined`，表示“不做额外变换”；否则返回 `Partial<Result>`，只覆盖需要变更的字段。

**原因**

- 这和现有 JavaScript 使用习惯一致
- 便于用户只改 `src` / `href`，或者只加 `dataset`

### 决策 8：保留“链接文本不可变”，并显式保护嵌套行内格式

**选择**

- hook 不能修改链接的可见文本
- 即使存在 link hook，链接内部已有的粗体、斜体等行内装饰仍应保持现状

**原因**

- 修改文本会破坏 WYSIWYG 预期
- 保护现有行内格式是“继续走 mark decoration”这条路线的核心收益

## Risks / Trade-offs

**[Risk]** hooks 会在 decoration 重建时频繁执行  
→ **Mitigation**：明确要求 hooks 同步、纯函数、快速返回；文档中提醒用户自行缓存昂贵计算结果

**[Risk]** 用户可能误以为 link hook 会让编辑区里的链接变成可直接跳转的浏览器链接  
→ **Mitigation**：在 spec 和文档中明确说明，本次只保证暴露变换后的目标地址与元数据，不引入默认导航行为

**[Risk]** 用户自定义 `dataset` 与系统保留字段冲突  
→ **Mitigation**：保留稳定字段名（如 `data-href`），系统保留字段优先级高于用户同名字段，并在文档中说明

**[Trade-off]** 链接目标暴露为稳定 DOM 属性，而不是浏览器原生导航  
→ **Accepted**：这是为了优先保护编辑体验与兼容性，后续若要支持点击跳转，应单独设计交互

**[Trade-off]** `style` 支持会鼓励部分调用方写出较难维护的样式逻辑  
→ **Accepted**：保留该能力，但文档中应强调 `className` 优先，`style` 作为补充
