## Context

当前编辑器的 fenced code block 语法高亮通过 Markdown `codeLanguages` 接入 `createLanguageDescriptions()`，再由语言注册表决定哪些语言可以被识别和加载。现有实现已经覆盖 JavaScript、TypeScript、CSS、Shell 以及若干按需加载语言，但没有把 `html` 纳入支持集合，导致 ` ```html ` 代码块在编辑器内只能以纯文本显示。

这个问题不是主题样式缺失。现有代码块主题层已经为 `tagName`、`attributeName` 等常见标记提供了样式位点，因此修复重点应放在语言注册与嵌套解析接入，而不是重写 code block 渲染层或主题层。

## Goals / Non-Goals

**Goals:**

- 让 `html` fenced code block 在普通模式与 `livePreview` 模式下都能触发语法高亮。
- 让 `html` 与现有语言体系保持一致，具备支持检测、规范化标识与展示标签能力。
- 用最小改动补齐能力缺口，不改变现有公开 API、事件语义或 code block 壳层结构。

**Non-Goals:**

- 不在本次变更中扩展 `xml`、`vue`、`astro` 等其他标记语言支持。
- 不重构语言注册架构，也不改写代码块主题系统。
- 不调整未知语言的退化策略；未受支持语言仍保持纯文本显示。

## Decisions

### Decision: 复用现有 `languageSupport` 注册表，只补 `html` 语言项

沿用当前 `CORE_LANGUAGES` / `EXTENDED_LANGUAGES`、`LANGUAGE_DISPLAY_LABELS`、`LANGUAGE_CANONICAL_IDS` 的注册机制，把 `html` 接入这套统一路径，而不是为单个语言做特判。

这样可以保证以下几件事继续由同一份语言元数据驱动：

- Markdown `codeLanguages` 的语言识别
- 支持检测 `isLanguageSupported`
- 语言标签 `getLanguageDisplayLabel`
- 别名与规范化 `normalizeLanguageIdentifier`

备选方案是直接在编辑器装配层对 `html` 做手写分支，但那会绕开现有语言体系，让高亮与 header label 的来源再次分叉，不值得。

### Decision: 将 HTML 作为同步可用的核心语言接入

HTML 属于前端文档与示例代码中的高频语言，而且依赖体量与现有语言支持模式兼容，适合放入核心同步可用语言集合，而不是按需懒加载。

这样可以避免首次渲染 `html` code fence 时出现额外异步切换，也能与 `css`、`javascript` 一起形成更完整的前端基础语言体验。

备选方案是按需加载 `html`，优点是理论上减少初始注册量，但对这个项目的实际收益很小，反而会让常见语言体验不稳定。

### Decision: 通过测试固定语言注册与渲染行为

本次修复不仅要验证 `isLanguageSupported('html')` 这类注册结果，还要验证编辑器中的 fenced code block 确实出现 HTML token class，以覆盖从语言注册到编辑器渲染的完整路径。

只测注册表会遗漏编辑器装配问题；只测 DOM 着色结果又难以精确定位回归来源。两类测试都需要保留。

## Risks / Trade-offs

- [Risk] HTML 语言接入后，现有 code theme 对标签和属性的配色可能与预期不完全一致。  
  → Mitigation：优先复用现有 `tok-tagName` / `tok-attributeName` 样式，并用回归测试确认至少存在稳定 token class；如果视觉上仍需微调，再单独处理主题层。

- [Risk] 后续用户可能继续期待 `xml`、`vue` 等相近语言支持。  
  → Mitigation：在本次 change 中明确范围只覆盖 `html`，避免把小修复扩展成多语言规划。

- [Risk] 如果 `html` 只补高亮而未补 label 映射，header row 仍可能表现不一致。  
  → Mitigation：将语言支持、规范化映射与 display label 一并纳入本次修复范围。
