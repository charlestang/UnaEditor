## Context

UnaEditor 是一个固定为 Markdown 模式的 CodeMirror 6 编辑器组件。当前 API 有两处设计缺陷：

1. `language` prop 存在于类型定义和组件 props 中，但 `useEditor.ts` 从未读取该值，编辑器始终加载 Markdown 扩展。这是一个对用户撒谎的 API。
2. `hybridMarkdown` prop 将渲染装饰与导航修复捆绑在同一开关下。导航修复的存在是因为 livePreview 的 decoration 会干扰 CodeMirror/Vim 的默认导航行为，应当只在 livePreview 开启时生效，而非始终生效。

## Goals / Non-Goals

**Goals:**

- 删除 `language` prop，消除误导性 API
- 将 `hybridMarkdown` prop 重命名为 `livePreview`，语义准确
- 明确导航修复的触发条件：仅在 `livePreview: true` 时加载，用于还原被 decoration 干扰的默认行为
- 明确各模式的期望导航行为（见决策二）
- Markdown 语法高亮始终开启

**Non-Goals:**

- 不改变任何现有的渲染行为或视觉效果
- 不重构 `hybridMarkdown.ts` 的内部逻辑
- 不新增功能

## Decisions

### 决策一：直接删除 `language`，不做兼容层

`language` 从未实际生效，加兼容层（如 deprecation warning）没有意义。直接从 `EditorProps` 和组件 defaults 中移除。

**替代方案**：保留 `language` 并标记 `@deprecated`
**拒绝原因**：该 prop 从未工作过，没有用户依赖实际行为，兼容层只会增加维护负担。

---

### 决策二：导航修复随 livePreview 一同加载，不独立存在

各模式下的期望导航行为：

```
vim: false + livePreview: false
  → Arrow Up/Down 按视觉行移动（CodeMirror 默认，lineWrapping 下的自然行为）
  → 无需任何修复代码

vim: false + livePreview: true
  → Arrow Up/Down 被 Decoration.replace 干扰，CM 坐标映射将光标放在替换范围之后（如 "## " 后的 col 4 而非 col 1）
  → 需要自定义 ArrowUp/Down handler，按逻辑行移动并保持文档列位置
  → 期望行为：光标在 col 1 按下后仍落在目标行的 col 1（即 "## " 之前），scope 激活后光标在行首无视觉跳变

vim: true + livePreview: false
  → Arrow/j/k 按逻辑行移动（Vim 默认约定）
  → 无需任何修复代码

vim: true + livePreview: true
  → Arrow/j/k 被 decoration 干扰，偏离 Vim 默认行为
  → 需要修复，使其还原为逻辑行移动（Vim 约定）
```

因此，导航修复代码**只在 `livePreview: true` 时加载**，目的是还原被 decoration 干扰的默认行为，而非引入新的导航语义。

```
livePreviewExtensions() = 渲染装饰 + 非 vim 逻辑行导航 handler（捆绑，因为修复是为了对抗装饰的副作用）
vim 模式的逻辑行导航 = 在 vim 初始化时通过 Vim.defineMotion 注册（独立于 livePreview 扩展）
```

**实测结论**：`livePreview: true` 时 ArrowUp 和 ArrowDown 均受影响。根因是 `Decoration.replace({})` 使隐藏字符成为零宽替换范围，CM 的坐标映射默认将光标放在替换范围之后。修复方案是在 livePreview 扩展中注册 `Prec.highest` 的 ArrowUp/Down keymap，按逻辑行移动并保持文档列位置（goal column 机制）。

**替代方案**：导航修复始终生效
**拒绝原因**：非 livePreview 模式下导航行为本来正确，无需干预；强制覆盖反而可能改变用户期望的默认体验。

---

### 决策三：`hybridMarkdown` → `livePreview`，默认值保持 `false`

重命名 prop，语义从"混合模式"变为"实时预览"，与业界通用概念对齐（Typora Live Preview、Obsidian Live Preview）。默认 `false` 保持不变，即默认是源码编辑模式。

## Risks / Trade-offs

- **Breaking change** → 下游使用了 `language` 或 `hybridMarkdown` prop 的用户需要手动迁移。缓解：版本号遵循 semver，在 minor 版本中发布并在 changelog 中注明。
- **非 vim 模式下 livePreview 使用逻辑行导航而非 CM 默认的坐标映射导航** → 在 lineWrapping 场景下，长行折行后 ArrowUp/Down 会跳过整个逻辑行而非按视觉行移动。这是为了保证光标列位置一致性（col 1 → col 1）的权衡，优先解决 decoration 导致的光标跳变问题。

## Migration Plan

下游迁移指引（写入 changelog）：

```
// Before
<UnaEditor language="markdown" hybridMarkdown />

// After
<UnaEditor livePreview />
```
