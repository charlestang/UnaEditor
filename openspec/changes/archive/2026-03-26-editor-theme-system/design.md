## Context

当前编辑器的主题相关能力分散在四个层面：

- `theme: 'light' | 'dark'` 只负责主编辑区的大致明暗外观，dark 模式复用 `@codemirror/theme-one-dark`，light 模式基本依赖默认样式
- Markdown 内容区样式硬编码在 `hybridMarkdown.ts` 的 `HYBRID_THEME` 中，不可定制，也不会随 `theme` 的细粒度变化而变化
- 结构化表格表头背景色通过容器 CSS 变量 `--una-table-header-bg` 单独分支计算
- 代码块通过独立的 `codeTheme` 体系控制，`auto` 模式目前依赖原始 `theme` 字符串值

这导致了三个问题：

1. 调用方无法在不覆写内部 CSS 选择器的情况下定制 Markdown 内容样式
2. 自定义主题如果直接暴露底层 `Extension`，公共 API 会过度耦合 CodeMirror
3. 标题在 live preview 与源码态之间缺少统一的级别锚点，容易出现字号/字重/行高跳变

## Goals / Non-Goals

**Goals**

- 为组件库定义一个稳定、可演进的公共主题 API
- 支持 `'light' | 'dark'` 预置主题和“基于 preset 的部分覆盖对象”
- 让 `codeTheme='auto'` 在字符串主题和自定义主题下都保持一致行为
- 用 heading line decoration 统一标题在 live preview / 源码态之间的视觉基线
- 让关键 Markdown 语义样式在常见宿主 CSS reset 下仍由编辑器自己稳定承载
- 让主题切换在运行时立即生效，无需重建编辑器实例

**Non-Goals**

- 不把任意 CodeMirror `Extension` 暴露为公共主题 API 的一部分
- 不在本次变更中开放所有 editor chrome 细节给集成方逐项配置
- 不重做 `codeTheme` 的独立体系，代码块仍保持单独 capability
- 不在本次变更中移除 live preview 下已有的 `tok-heading` 输出结构
- 不提供主题编辑器 UI 或可视化配置工具
- 不承诺对带有 `!important`、`all: unset` 或全量元素清空的极端宿主样式做绝对隔离

## Decisions

### Decision 1: 公共主题对象采用“preset + overrides”，不直接暴露底层 Extension

公共 API 使用高层 token 对象，内部再解析为完整主题：

```typescript
interface EditorThemeContent {
  heading1: { fontSize: string; fontWeight: string; lineHeight: string };
  heading2: { fontSize: string; fontWeight: string; lineHeight: string };
  heading3: { fontSize: string; fontWeight: string; lineHeight: string };
  heading4: { fontWeight: string; lineHeight: string };
  heading5: { fontWeight: string; lineHeight: string };
  heading6: { fontWeight: string; lineHeight: string };
  link: { color: string; textDecoration: string; textUnderlineOffset: string };
  emphasis: { fontStyle: string };
  strong: { fontWeight: string };
  inlineCode: { backgroundColor: string; borderRadius: string; padding: string };
  blockquote: { borderColor: string; backgroundColor: string; paddingLeft: string; fontStyle: string };
  syntaxMark: { color: string };
  listMarker: { color: string };
  taskCheckbox: { accentColor: string };
}

interface EditorThemeTable {
  headerBackground: string;
}

interface EditorTheme {
  name?: string;
  type: 'light' | 'dark';
  content?: Partial<EditorThemeContent>;
  table?: Partial<EditorThemeTable>;
}

interface ResolvedEditorTheme {
  name: string;
  type: 'light' | 'dark';
  chrome: Extension;
  content: EditorThemeContent;
  table: EditorThemeTable;
}
```

其中：

- `EditorTheme` 是面向外部的“覆盖对象”
- `ResolvedEditorTheme` 是内部使用的完整结果，不需要暴露给调用方
- `type` 既决定默认 preset，也决定 `codeTheme='auto'` 时应跟随 light 还是 dark

**Rationale**

- 组件库暴露 token 对象比暴露底层 CM 扩展更稳定
- 允许“只改自己关心的一小部分样式”，避免未来新增 token 时把用户自定义主题全部打成 breaking change
- 内部仍可以自由决定如何把 resolved theme 拆成 CodeMirror extension、CSS 变量和其他衍生配置

### Decision 2: 首期开放的主题范围收敛到 content token 和 table token

本次 change 的主题 API 不承诺“所有 editor chrome 都可由外部逐项配置”。首期稳定暴露的主题范围为：

- Markdown 内容区 token
  - 标题 h1-h6
  - 链接
  - 强调 / 加粗
  - inline code
  - blockquote
  - syntax mark
  - list marker / task checkbox accent
- 结构化表格 token
  - 表头背景色

以下内容仍然属于 preset-owned internal styling，不作为首期公共 API：

- 选区高亮色
- active line / gutter 颜色
- 编辑器背景、光标、行号等低层 chrome 细节
- 图片圆角、阴影、最大尺寸等更偏布局表现的样式

**Rationale**

- 当前需求的核心是“内容阅读感受”和“主题一致性”，不是开放整套 CM 皮肤引擎
- 先把最容易形成稳定公共契约的 token 暴露出来，后续再按需要扩容

### Decision 3: 预置主题负责 chrome，custom theme 只选择基线并覆盖 token

内部提供两套 resolved preset：

```typescript
const LIGHT_THEME: ResolvedEditorTheme = {
  name: 'Light',
  type: 'light',
  chrome: [],
  content: { ... },
  table: { ... },
};

const DARK_THEME: ResolvedEditorTheme = {
  name: 'Dark',
  type: 'dark',
  chrome: oneDark,
  content: { ... },
  table: { ... },
};
```

解析流程：

```typescript
function resolveEditorTheme(theme: 'light' | 'dark' | EditorTheme): ResolvedEditorTheme {
  if (theme === 'light') return LIGHT_THEME;
  if (theme === 'dark') return DARK_THEME;

  const base = theme.type === 'dark' ? DARK_THEME : LIGHT_THEME;
  return mergeTheme(base, theme);
}
```

**Rationale**

- 保留现有 light/dark 的简单使用路径
- 让自定义主题天然拥有合理默认值
- 保证自定义主题不需要知道 oneDark 或其他 CM theme extension 的内部细节

### Decision 4: `codeTheme='auto'` 基于 resolved theme 的 `type` 决策

当前 `codeTheme='auto'` 的逻辑依赖原始 `theme` prop 是 `'light'` 还是 `'dark'`。在支持对象主题后，这个判断必须切换到 resolved theme：

```typescript
const resolvedTheme = resolveEditorTheme(props.theme ?? 'light');
const resolvedCodeTheme = resolveCodeTheme(props.codeTheme, resolvedTheme.type);
```

**Rationale**

- 避免 `theme` 是对象时 `auto` 失去依据
- 让“dark 外观 + 局部覆盖”的自定义主题继续默认获得 dark code theme

### Decision 5: 将 hybrid theme 拆为 base theme 与 content theme

当前 `HYBRID_THEME` 同时承担三类职责：

- 与主题无关的基础 class 样式，如 `.cm-una-code-font`
- 与 Markdown 内容 token 相关的样式，如标题、链接、inline code、blockquote
- 与 live preview 展现有关的若干结构类样式

本次拆分为：

```typescript
const HYBRID_BASE_THEME = EditorView.theme({
  '.cm-una-code-font': { ... },
});

function createContentTheme(content: EditorThemeContent): Extension {
  return EditorView.theme({
    '.cm-hybrid-heading-1': { ... },
    '.cm-heading-line-1 .tok-heading': { ... },
    '.cm-heading-line-1 .tok-meta': { ... },
    '.cm-hybrid-link': { ... },
    '.cm-line.cm-hybrid-blockquote-line': { ... },
    // ...
  });
}
```

挂载方式：

- `livePreview` 路径：`HYBRID_BASE_THEME + createContentTheme(...) + hybrid plugin`
- 非 `livePreview` 路径：`HYBRID_BASE_THEME + code decoration plugin`

**Rationale**

- 避免非 `livePreview` 模式因为 content theme 重构而失去代码字体相关样式
- 将“稳定基础样式”和“可重配主题样式”分离，更适合 compartment reconfigure

### Decision 6: heading line decoration 适用于标题文本行，并覆盖 ATX / Setext

在 `buildDecorations()` 中，为标题文本所在行添加 `Decoration.line({ class: 'cm-heading-line-{level}' })`，且该装饰不受 active scope 影响。

语义定义：

- ATX heading：标题所在行添加 `cm-heading-line-{level}`
- Setext heading：仅内容行添加 `cm-heading-line-{level}`，下划线分隔行不添加

样式通过后代选择器应用：

```css
.cm-heading-line-1 .tok-heading { font-size: ... }
.cm-heading-line-1 .tok-meta { color: ... }
```

这样可以覆盖两种状态：

```text
非激活: cm-line.cm-heading-line-2 > span.cm-hybrid-heading-2 > span.tok-heading
激活后: cm-line.cm-heading-line-2 > span.tok-heading.tok-meta + span.tok-heading
```

**Rationale**

- `cm-line` 上的稳定 class 是源码态和渲染态共享的级别锚点
- 这样能把字号、字重、行高统一约束在“行级”语义上，而不是依赖某一种 DOM 包裹形态

### Decision 7: 关键 Markdown 语义样式的 ownership 必须落在编辑器拥有的稳定 selector 上

当前 hybrid 渲染里的 DOM 结构天然存在“两层”：

- 内层：CodeMirror / Lezer 语法高亮生成的 `tok-*` span
- 外层：我们通过 decoration 或 line decoration 注入的稳定 class

为了降低宿主 CSS reset 的破坏面，关键视觉语义必须由“编辑器自己拥有”的 selector 承担，而不能把最终效果托付给内层 token span 的默认样式继承。换句话说：

- `tok-*` 的职责是语法分段与局部标记
- `cm-hybrid-*` / `cm-heading-line-*` 的职责是组件承诺给调用方的最终视觉语义

实现约束：

```typescript
EditorView.theme({
  '.cm-hybrid-strong, .cm-hybrid-strong span': {
    fontWeight: content.strong.fontWeight,
  },
  '.cm-hybrid-emphasis, .cm-hybrid-emphasis span': {
    fontStyle: content.emphasis.fontStyle,
  },
  '.cm-hybrid-link, .cm-hybrid-link span': {
    color: content.link.color,
    textDecoration: content.link.textDecoration,
    textUnderlineOffset: content.link.textUnderlineOffset,
  },
  '.cm-una-code-font, .cm-una-code-font span': {
    fontFamily: 'var(--una-code-font-family, ui-monospace, SFMono-Regular, Menlo, monospace)',
  },
});
```

标题仍然以行级锚点为主：

```css
.cm-heading-line-2 .tok-heading { font-size: ... }
.cm-heading-line-2 .tok-meta { color: ... }
```

这样做的目的不是与宿主样式“抢所有权”，而是确保组件对自己公开承诺的 Markdown 语义有明确、稳定的落点。

**Rationale**

- 外层 decoration class 是我们可以长期维护的契约，`tok-*` 只是解析输出细节
- 常见的 reset 往往会命中 `span`、`em`、`strong`、`code` 等标签，单靠内层 token 很脆弱
- 相比 inline style 或 Shadow DOM，这种方案仍保留了运行时重配 theme、测试可见性和实现简洁性

**Trade-off**

- 我们只承诺对“常见宿主 reset”保持稳健，例如统一的 `font-style` / `font-weight` / `text-decoration` / `font-family` 重设
- 对 `all: unset !important` 这类极端样式清空，不在本次 change 的保证范围内；那已经是更高层的样式隔离问题

## Risks / Trade-offs

**[Theme scope intentionally narrowed]**

本次 change 不再承诺“所有 chrome 都可配置”。这是有意收敛，而不是能力缺失。代价是部分低层样式仍由 preset 内部控制；收益是公共 API 更稳定。

**[Partial merge needs strict defaults]**

一旦允许部分覆盖，`resolveEditorTheme()` 的 merge 逻辑就必须稳定、可预测。需要避免浅合并导致整组 token 被误清空。Mitigation: 按 token group 做受控 merge，并为 light/dark preset 提供完整默认值。

**[Theme switching touches multiple layers]**

运行时切换主题会同时影响：

- editor chrome preset
- content theme extension
- code block auto theme
- container CSS variables

Mitigation: 所有消费者统一基于同一个 `ResolvedEditorTheme` 结果派生，避免各处各算一份。

**[Heading DOM may evolve later]**

如果未来移除 live preview 下某些 `tok-heading` 包裹，`.cm-heading-line-*` 依然可以继续作为级别锚点；但届时需要同步清理或调整后代选择器。Mitigation: 把 heading line class 设为长期稳定语义，把具体子选择器视为可替换实现细节。
