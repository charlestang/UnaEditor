# 架构修订：代码块语法高亮

## 评审发现的问题

### 问题 1: 主题隔离方案不成立 ⚠️ 严重

**问题描述：**
当前设计假设可以通过 CSS 选择器 `.cm-fenced-code .tok-keyword` 来隔离代码块主题，但这在 CodeMirror 的渲染模型下不成立：

1. 全局使用 `syntaxHighlighting(defaultHighlightStyle)` 给所有 token 添加 `.tok-*` 类
2. 代码块只有行级 class `.cm-hybrid-fenced-code-line`，没有容器包裹
3. Token 元素不在代码块容器内，CSS 选择器无法匹配

**后果：**

- 方案 A：`.tok-keyword { color: pink }` → 污染整个编辑器
- 方案 B：`.cm-fenced-code .tok-keyword` → 选择器打不到

**根本原因：**
CodeMirror 的语法高亮是通过 `syntaxHighlighting()` 扩展全局应用的，不是基于 DOM 容器的。

### 问题 2: livePreview 与 active-scope 冲突 ⚠️ 严重

**问题描述：**
`FencedCode` 在 `HYBRID_SCOPE_NODES` 中，当光标进入代码块时：

```typescript
// hybridMarkdown.ts line 87
const HYBRID_SCOPE_NODES = new Set([
  // ...
  'FencedCode', // ← 代码块是 active scope
]);

// line 368
if (isInActiveScope(node, activeScopes)) return; // ← 跳过装饰
```

**后果：**

- 光标进入代码块 → 装饰被跳过
- 背景色、行号会闪断
- 用户体验差

### 问题 3: 语言加载需求矛盾 ⚠️ 中等

**问题描述：**
三个互相矛盾的需求：

1. **Spec 需求 A**：核心语言"编辑器加载时立即可用" (spec.md line 37)
2. **Spec 需求 B**：无代码块时"不加载任何语言解析器" (spec.md line 57)
3. **Tasks 需求**：核心语言打包到主包 (tasks.md line 5)

**矛盾：**

- 需求 A + Tasks → 核心语言打包，编辑器启动就加载
- 需求 B → 无代码块时不加载
- **无法同时满足**

### 问题 4: 双重语言注册体系 ⚠️ 中等

**问题描述：**
设计了两套语言注册机制：

1. **Design 方案**：直接用 `codeLanguages: languages` (design.md line 104)
2. **Language-support 方案**：
   - `CORE_LANGUAGES` / `EXTENDED_LANGUAGES` (language-support.md line 61)
   - `LanguageDescription[]` (line 179)
   - `getLanguageSupport()` 函数

**后果：**

- 维护两套注册表
- Alias 定义分散
- 懒加载逻辑重复
- 文档容易失真

### 问题 5: 行号 inline widget 方案过脆 ⚠️ 严重

**问题描述：**
设计在每个代码行 `line.from` 前插入 widget (design.md line 191)，但这与当前导航/选择模型不匹配：

1. **现有问题**：仓库已因 decoration 影响光标映射，专门补了逻辑行导航 (hybridMarkdown.ts line 463)
2. **新增复杂度**：再往内容流里塞"伪 gutter"会导致：
   - 换行计算错误
   - 列对齐问题
   - 复制选择包含行号
   - livePreview 进入/退出代码块时行号闪烁

**与 spec 冲突：**

- Spec 要求"不可选择" (spec.md line 41)
- Spec 要求"右对齐"
- Spec 要求"即时切换"

**根本原因：**
Inline widget 是内容的一部分，不是真正的 gutter。CodeMirror 的 gutter 系统才是正确的解决方案。

### 问题 6: 未标注语言代码块行为定义冲突 ⚠️ 中等

**问题描述：**
Spec 和 Design 对无语言标识的代码块行为定义不一致：

1. **Spec 要求**："不进行语法高亮" (spec.md line 17)
2. **Design 建议**："通用语法高亮（关键字、字符串、注释）" (design.md line 446)

**影响范围：**

- Parser 配置（是否需要通用高亮器）
- 测试断言（如何验证行为）
- 文档描述（用户预期）
- 用户体验（一致性）

**需要决策：**
必须在两个方案中选择一个。

### 问题 7: 验收项和测试计划缺少落地手段 ⚠️ 严重

**问题描述：**
Tasks 要求验证多项指标，但缺少测试工具：

**要求的验收项：**

- 验证 9 个主题渲染 (tasks.md line 115)
- 视觉对比测试 (tasks.md line 128)
- 包体预算验证 (tasks.md line 143)
- 性能测试

**当前测试能力：**

- 仅有 vitest/jsdom (package.json line 19)
- 基础单元测试
- 无视觉回归测试
- 无包体积分析
- 无性能基准测试

**后果：**

- 验收项变成主观勾选
- 无法客观验证质量
- 容易引入回归问题

---

## 修订方案

### 方案 1: 主题隔离 - 使用 Facet 和 tagHighlighter

**核心思路：**
不依赖 CSS 容器选择器，而是在语法高亮扩展层面实现隔离。

**技术方案：**

```typescript
// 1. 创建代码块主题 Facet
import { Facet } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const codeBlockThemeFacet = Facet.define<CodeTheme, CodeTheme>({
  combine: (values) => values[0] || getDefaultCodeTheme('dark'),
});

// 2. 创建条件高亮器
function createCodeBlockHighlighter(theme: CodeTheme): Extension {
  const highlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color: theme.colors.keyword },
    { tag: tags.function(tags.variableName), color: theme.colors.function },
    { tag: tags.string, color: theme.colors.string },
    // ... 其他 tags
  ]);

  return syntaxHighlighting(highlightStyle, {
    // 关键：只在 FencedCode 节点内应用
    scope: (node) => {
      // 向上查找，判断是否在 FencedCode 内
      let parent = node.parent;
      while (parent) {
        if (parent.name === 'FencedCode') return true;
        parent = parent.parent;
      }
      return false;
    },
  });
}
```

**优点：**

- ✅ 真正的主题隔离
- ✅ 不依赖 CSS 选择器
- ✅ 不污染全局

**缺点：**

- ⚠️ 需要检查 CodeMirror 是否支持 `scope` 选项
- ⚠️ 如果不支持，需要自定义 ViewPlugin

**替代方案（如果 scope 不支持）：**

```typescript
// 使用自定义 ViewPlugin 包装语法树
class CodeBlockHighlightPlugin {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildHighlights(view);
  }

  buildHighlights(view: EditorView): DecorationSet {
    const decorations: Range<Decoration>[] = [];
    const tree = syntaxTree(view.state);
    const theme = view.state.facet(codeBlockThemeFacet);

    tree.iterate({
      enter: (node) => {
        if (node.name === 'FencedCode') {
          // 在 FencedCode 内部应用主题
          this.highlightCodeBlock(view, node, theme, decorations);
        }
      },
    });

    return Decoration.set(decorations, true);
  }

  highlightCodeBlock(
    view: EditorView,
    codeNode: SyntaxNode,
    theme: CodeTheme,
    decorations: Range<Decoration>[],
  ) {
    // 遍历代码块内的 tokens
    codeNode.cursor().iterate((node) => {
      const tokenType = getTokenType(node.name);
      if (tokenType) {
        decorations.push(
          Decoration.mark({
            class: `cm-code-token-${tokenType}`,
            attributes: {
              style: `color: ${theme.colors[tokenType]}`,
            },
          }).range(node.from, node.to),
        );
      }
    });
  }
}
```

### 方案 2: livePreview 集成 - 从 HYBRID_SCOPE_NODES 移除 FencedCode

**核心思路：**
代码块不应该是 active scope，因为我们希望装饰始终存在。

**修改：**

```typescript
// hybridMarkdown.ts
const HYBRID_SCOPE_NODES = new Set([
  'ATXHeading1',
  'ATXHeading2',
  'ATXHeading3',
  'ATXHeading4',
  'ATXHeading5',
  'ATXHeading6',
  'SetextHeading1',
  'SetextHeading2',
  'Emphasis',
  'StrongEmphasis',
  'Link',
  'InlineCode',
  'Image',
  'Blockquote',
  // 'FencedCode',  // ← 移除！
]);
```

**理由：**

- 代码块的装饰（背景、行号、语法高亮）应该始终显示
- 不需要在光标进入时隐藏
- 与其他 active scope（如 Emphasis）的行为不同

**影响：**

- ✅ 背景色不会闪断
- ✅ 行号不会消失
- ✅ 语法高亮保持稳定

### 方案 3: 语言加载 - 明确优先级

**决策：性能优先**

**修订后的需求：**

1. **核心语言按需加载**（修改 spec）
   - 编辑器启动时不加载任何语言解析器
   - 当遇到代码块时，才加载对应语言
   - 核心语言（JS/TS/CSS）加载速度快（已打包）

2. **包大小优化**
   - 核心语言打包到主包（体积小，~25KB）
   - 扩展语言懒加载（按需下载）

3. **用户体验**
   - 首次遇到代码块时可能有短暂延迟（< 100ms）
   - 后续使用缓存，无延迟

**修改 spec：**

```markdown
### 需求：编辑器必须支持多种编程语言

编辑器必须支持常见编程语言的语法高亮。

#### 场景：核心语言快速加载

- **当** 用户创建 JavaScript、TypeScript 或 CSS 代码块时
- **则** 必须在 100ms 内加载并应用相应的语言解析器

#### 场景：扩展语言按需加载

- **当** 用户创建 PHP、Go、Java 或 Python 代码块时
- **则** 必须按需加载相应的语言解析器

#### 场景：无代码块时的性能

- **当** 文档不包含围栏代码块时
- **则** 除基础 markdown 解析器外不得加载任何语言解析器
```

### 方案 4: 语言注册 - 统一为单一体系

**核心思路：**
只使用 CodeMirror 原生的 `LanguageDescription` 机制，不自建注册表。

**统一方案：**

```typescript
// src/extensions/languageSupport.ts

import { LanguageDescription } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { python } from '@codemirror/lang-python';
// ... 其他核心语言

// 唯一的语言注册表
export const codeLanguages: LanguageDescription[] = [
  // 核心语言（打包）
  LanguageDescription.of({
    name: 'JavaScript',
    alias: ['javascript', 'js', 'jsx'],
    support: javascript({ jsx: true }),
  }),
  LanguageDescription.of({
    name: 'TypeScript',
    alias: ['typescript', 'ts', 'tsx'],
    support: javascript({ jsx: true, typescript: true }),
  }),
  LanguageDescription.of({
    name: 'CSS',
    alias: ['css'],
    support: css(),
  }),

  // 扩展语言（懒加载）
  LanguageDescription.of({
    name: 'Python',
    alias: ['python', 'py'],
    load: async () => {
      const { python } = await import('@codemirror/lang-python');
      return python();
    },
  }),
  LanguageDescription.of({
    name: 'PHP',
    alias: ['php'],
    load: async () => {
      const { php } = await import('@codemirror/lang-php');
      return php();
    },
  }),
  // ... 其他扩展语言
];

// 在 useEditor.ts 中使用
markdown({
  base: markdownLanguage,
  codeLanguages, // 直接使用
});
```

**优点：**

- ✅ 单一数据源
- ✅ Alias 集中管理
- ✅ 懒加载逻辑清晰
- ✅ 易于维护和文档化

**移除：**

- ❌ `CORE_LANGUAGES` / `EXTENDED_LANGUAGES` 映射
- ❌ `getLanguageSupport()` 函数
- ❌ 自定义缓存机制（CodeMirror 内置）

### 方案 5: 行号 - 使用 Gutter 而非 Inline Widget

**核心思路：**
使用 CodeMirror 的 gutter 系统，而不是 inline widget。

**问题分析：**
Inline widget 的问题：

- Widget 是内容的一部分，会影响选择
- 影响光标位置计算
- 影响换行和列对齐
- 与现有逻辑行导航冲突

**正确方案：使用条件 Gutter**

````typescript
// src/extensions/codeLineNumbers.ts

import { gutter, GutterMarker } from '@codemirror/view';
import { RangeSet } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

class CodeLineNumberMarker extends GutterMarker {
  constructor(private lineNum: number) {
    super();
  }

  eq(other: CodeLineNumberMarker): boolean {
    return this.lineNum === other.lineNum;
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-code-line-number';
    span.textContent = String(this.lineNum);
    return span;
  }
}

function codeBlockLineNumbers(view: EditorView): RangeSet<GutterMarker> {
  const markers: Range<GutterMarker>[] = [];
  const tree = syntaxTree(view.state);

  // 找到所有 FencedCode 节点
  tree.iterate({
    enter: (node) => {
      if (node.name === 'FencedCode') {
        const startLine = view.state.doc.lineAt(node.from);
        const endLine = view.state.doc.lineAt(node.to);

        let lineNum = 1;
        for (let lineNo = startLine.number; lineNo <= endLine.number; lineNo++) {
          const line = view.state.doc.line(lineNo);

          // 跳过围栏标记
          const lineText = line.text.trim();
          if (lineText.startsWith('```')) continue;

          // 在 gutter 中添加行号
          markers.push(new CodeLineNumberMarker(lineNum++).range(line.from));
        }
      }
    },
  });

  return RangeSet.of(markers, true);
}

export function createCodeLineNumbersExtension(): Extension {
  return gutter({
    class: 'cm-code-line-numbers-gutter',
    markers: codeBlockLineNumbers,
    // 只在代码块行显示
    lineMarker: (view, line) => {
      // 检查该行是否在代码块内
      const tree = syntaxTree(view.state);
      let inCodeBlock = false;

      tree.iterate({
        from: line.from,
        to: line.to,
        enter: (node) => {
          if (node.name === 'FencedCode') {
            inCodeBlock = true;
          }
        },
      });

      return inCodeBlock ? {} : null;
    },
  });
}
````

**CSS 样式：**

```css
/* 代码行号 gutter */
.cm-code-line-numbers-gutter {
  /* 只在代码块行显示 */
  background: transparent;
  border-right: none;
}

.cm-code-line-number {
  display: inline-block;
  min-width: 2.5em;
  padding-right: 0.5em;
  text-align: right;
  color: rgba(128, 128, 128, 0.6);
  font-size: 0.9em;
  user-select: none;
}

/* 深色主题 */
.cm-theme-dark .cm-code-line-number {
  color: rgba(255, 255, 255, 0.3);
}

/* 浅色主题 */
.cm-theme-light .cm-code-line-number {
  color: rgba(0, 0, 0, 0.3);
}
```

**优点：**

- ✅ 真正的 gutter，不影响内容流
- ✅ 不可选择（gutter 默认行为）
- ✅ 不影响光标位置
- ✅ 不影响复制选择
- ✅ 与现有导航系统兼容
- ✅ 可以独立显示/隐藏

**缺点：**

- ⚠️ 需要条件渲染（只在代码块行显示）
- ⚠️ 实现稍复杂

**替代方案（更简单）：**

如果条件 gutter 太复杂，可以使用 line decoration：

````typescript
// 使用 line decoration 而非 inline widget
function buildLineNumbers(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const tree = syntaxTree(view.state);

  tree.iterate({
    enter: (node) => {
      if (node.name === 'FencedCode') {
        const startLine = view.state.doc.lineAt(node.from);
        const endLine = view.state.doc.lineAt(node.to);

        let lineNum = 1;
        for (let lineNo = startLine.number; lineNo <= endLine.number; lineNo++) {
          const line = view.state.doc.line(lineNo);

          if (line.text.trim().startsWith('```')) continue;

          // 使用 line decoration 而非 widget
          decorations.push(
            Decoration.line({
              attributes: {
                'data-line-number': String(lineNum++),
                class: 'cm-code-block-line-with-number',
              },
            }).range(line.from),
          );
        }
      }
    },
  });

  return Decoration.set(decorations, true);
}
````

**CSS（使用 ::before 伪元素）：**

```css
.cm-code-block-line-with-number::before {
  content: attr(data-line-number);
  display: inline-block;
  min-width: 2.5em;
  margin-right: 0.5em;
  text-align: right;
  color: rgba(128, 128, 128, 0.6);
  font-size: 0.9em;
  user-select: none;
  pointer-events: none;
}
```

**这个方案的优点：**

- ✅ 更简单
- ✅ 不影响内容流（::before 伪元素）
- ✅ 不可选择（user-select: none）
- ✅ 不影响光标位置
- ✅ 与现有系统兼容

**推荐：使用 line decoration + ::before 方案**

---

## 修订后的架构

### 新的扩展栈

```
┌──────────────────────────────────────────────────────┐
│ 层 5: 代码块主题 (CodeBlockHighlightPlugin)         │
│  - 使用 Facet 或自定义 ViewPlugin                    │
│  - 仅在 FencedCode 节点内应用主题                    │
│  - 不依赖 CSS 容器选择器                             │
├──────────────────────────────────────────────────────┤
│ 层 4: 代码行号 (Line Decoration + ::before)         │
│  - 使用 line decoration 而非 inline widget          │
│  - 通过 ::before 伪元素显示行号                     │
│  - 不影响内容流和光标位置                            │
│  - 装饰始终存在（FencedCode 不是 active scope）     │
├──────────────────────────────────────────────────────┤
│ 层 3: 嵌套语言解析器                                │
│  - 通过 LanguageDescription 统一注册                │
│  - 核心语言打包，扩展语言懒加载                      │
├──────────────────────────────────────────────────────┤
│ 层 2: Markdown 解析器                               │
│  - markdown({ codeLanguages })                      │
│  - 识别 FencedCode 节点                             │
├──────────────────────────────────────────────────────┤
│ 层 1: 基础编辑器                                    │
│  - CodeMirror 6 核心                                │
│  - 全局 syntaxHighlighting (仅用于非代码块内容)     │
└──────────────────────────────────────────────────────┘
```

### 关键变更

1. **主题系统**：从 CSS 选择器改为 Facet/ViewPlugin
2. **Active Scope**：从 `HYBRID_SCOPE_NODES` 移除 `FencedCode`
3. **语言加载**：明确"性能优先"，核心语言也按需加载
4. **语言注册**：统一使用 `LanguageDescription[]`
5. **行号系统**：从 inline widget 改为 line decoration + ::before

---

## 需要更新的文档

### 1. design.md

- [ ] 更新主题隔离方案（Facet/ViewPlugin）
- [ ] 移除 CSS 选择器假设
- [ ] 更新行号方案（line decoration + ::before）
- [ ] 更新扩展栈图示

### 2. specs/

- [ ] 修改语言加载需求（核心语言也按需）
- [ ] 明确性能优先级
- [ ] 更新行号需求（不使用 inline widget）

### 3. language-support.md

- [ ] 移除双重注册体系
- [ ] 统一为 `LanguageDescription[]`
- [ ] 更新代码示例

### 4. tasks.md

- [ ] 移除重复的语言注册任务
- [ ] 添加 Facet/ViewPlugin 实现任务
- [ ] 更新 hybridMarkdown.ts 修改任务（移除 FencedCode from active scope）
- [ ] 更新行号实现任务（line decoration 方案）

---

## 风险评估

### 高风险

- ⚠️ CodeMirror 可能不支持 `syntaxHighlighting` 的 `scope` 选项
  - **缓解**：使用自定义 ViewPlugin 替代

### 中风险

- ⚠️ 自定义高亮 ViewPlugin 可能影响性能
  - **缓解**：只在可见范围内应用，使用增量更新

### 低风险

- ⚠️ 移除 `FencedCode` 的 active scope 可能影响其他行为
  - **缓解**：仔细测试 livePreview 模式

---

## 下一步行动

1. **验证技术可行性**
   - 测试 CodeMirror 的 `syntaxHighlighting` API
   - 确认是否支持 `scope` 选项
   - 如不支持，验证 ViewPlugin 方案

2. **更新设计文档**
   - 修订 design.md
   - 修订 specs
   - 修订 language-support.md
   - 修订 tasks.md

3. **原型验证**
   - 实现主题隔离的 POC
   - 测试 active scope 移除的影响
   - 验证性能指标

4. **重新评审**
   - 确认架构问题已解决
   - 检查是否引入新问题
