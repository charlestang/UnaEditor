# 设计：代码块语法高亮

## 架构概览

````
组件层次结构
┌──────────────────────────────────────────────────────┐
│ UnaEditor.vue                                        │
│  属性: codeTheme, codeLineNumbers                    │
│  └─ useEditor(props)                                 │
│      ├─ 带嵌套解析器的 Markdown                      │
│      ├─ 代码块装饰插件 (始终开启)                    │
│      ├─ 代码主题 compartment                         │
│      └─ hybridMarkdown (不含代码块)                  │
└──────────────────────────────────────────────────────┘

扩展栈
┌──────────────────────────────────────────────────────┐
│ 层 6: hybridMarkdown 装饰                           │
│  - 标题、强调、链接等的 active-scope 渲染            │
│  - 不包含代码块（已拆分到独立插件）                  │
├──────────────────────────────────────────────────────┤
│ 层 5: 代码块主题 (codeThemeCompartment)             │
│  - 通过行级 class 作用域应用主题                     │
│  - 与编辑器主题隔离                                  │
├──────────────────────────────────────────────────────┤
│ 层 4: 代码块装饰插件 (始终开启)                     │
│  - 给代码块的每一行打上 cm-code-block-line class     │
│  - 添加代码块背景样式                                │
│  - 可选添加行号装饰                                  │
│  - 不依赖 active-scope，光标进入后样式持续保留       │
├──────────────────────────────────────────────────────┤
│ 层 3: 嵌套语言解析器                                │
│  - TypeScript, Python, Go 等                        │
│  - 通过 @codemirror/language-data 加载              │
├──────────────────────────────────────────────────────┤
│ 层 2: Markdown 解析器                               │
│  - 识别 FencedCode 节点                             │
│  - 提取语言信息 (```typescript)                     │
├──────────────────────────────────────────────────────┤
│ 层 1: 基础编辑器                                    │
│  - CodeMirror 6 核心                                │
└──────────────────────────────────────────────────────┘
````

## 关键架构决策

### 代码块装饰与 hybridMarkdown 的职责分离

**设计原则**：代码块增强功能（语法高亮、主题、行号）不依赖 hybridMarkdown 的 active-scope 机制。

**原因**：

1. **样式稳定性**：光标进入代码块时，代码块的背景、主题、行号应该持续保留，不应该因为进入 active-scope 而消失
2. **职责清晰**：hybridMarkdown 专注于需要"源码态/渲染态切换"的结构（标题、强调、链接），代码块不需要这种切换
3. **性能优化**：代码块装饰始终开启，避免频繁的装饰重建

**实现方式**：

- 新增独立的 `CodeBlockDecoratorPlugin`，始终开启
- 从 `hybridMarkdown.ts` 的 `HYBRID_SCOPE_NODES` 中移除 `FencedCode`
- 代码块的行 class、背景、行号由独立插件负责
- hybridMarkdown 继续负责标题、强调、链接等需要切换的结构

## 组件变更

### 1. 类型定义 (`src/types/editor.ts`)

```typescript
export interface EditorProps {
  // ... 现有属性

  /**
   * 代码块主题
   * - 'auto': 跟随编辑器主题
   * - CodeThemeName: 使用指定的配色方案
   * @default 'auto'
   */
  codeTheme?: 'auto' | CodeThemeName;

  /**
   * 在代码块中显示行号
   * @default false
   */
  codeLineNumbers?: boolean;
}

type CodeThemeName =
  // 深色主题
  | 'one-dark'
  | 'dracula'
  | 'monokai'
  | 'solarized-dark'
  | 'nord'
  | 'tokyo-night'
  // 浅色主题
  | 'github-light'
  | 'solarized-light'
  | 'atom-one-light';
```

### 2. 编辑器组件 (`src/components/UnaEditor.vue`)

```typescript
const props = withDefaults(defineProps<EditorProps>(), {
  // ... 现有默认值
  codeTheme: 'auto',
  codeLineNumbers: false,
});
```

### 3. 编辑器 Composable (`src/composables/useEditor.ts`)

#### 3.1 添加 Compartments

```typescript
// 代码块功能的新 compartments
const codeThemeCompartment = new Compartment();
const codeLineNumbersCompartment = new Compartment();
```

#### 3.2 配置带嵌套解析器的 Markdown

```typescript
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';

// 在扩展数组中
markdown({
  base: markdownLanguage,
  codeLanguages: languages, // 启用嵌套语言解析
}),
```

#### 3.3 添加代码主题扩展

```typescript
// 辅助函数获取代码主题扩展
function resolveCodeTheme(codeTheme: 'auto' | string, editorTheme: 'light' | 'dark'): CodeTheme {
  if (codeTheme === 'auto') {
    return getDefaultCodeTheme(editorTheme);
  }

  const theme = getCodeTheme(codeTheme);
  if (!theme) {
    console.warn(`未知代码主题: ${codeTheme}，回退到默认主题`);
    return getDefaultCodeTheme(editorTheme);
  }

  return theme;
}

// 在扩展数组中
const codeTheme = resolveCodeTheme(props.codeTheme || 'auto', props.theme);
codeThemeCompartment.of(createCodeThemeExtension(codeTheme));
```

#### 3.4 监听代码主题变更

```typescript
watch(
  () => [props.codeTheme, props.theme] as const,
  ([codeThemeName, editorTheme]) => {
    if (!editorView.value) return;
    const theme = resolveCodeTheme(codeThemeName || 'auto', editorTheme);
    editorView.value.dispatch({
      effects: codeThemeCompartment.reconfigure(createCodeThemeExtension(theme)),
    });
  },
);
```

## 代码块装饰插件

### 方法：统一的行级装饰

代码块装饰插件负责两件事：

1. 给代码块的每一行打上 `cm-code-block-line` class（用于主题作用域）
2. 可选地添加 `data-code-line-number` 属性（用于 CSS 伪元素渲染行号）

````typescript
class CodeBlockDecoratorPlugin {
  decorations: DecorationSet;

  constructor(
    view: EditorView,
    private showLineNumbers: boolean,
  ) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const decorations: Range<Decoration>[] = [];
    const tree = syntaxTree(view.state);

    for (const { from, to } of view.visibleRanges) {
      tree.iterate({
        from,
        to,
        enter: (node) => {
          if (node.name === 'FencedCode') {
            const startLine = view.state.doc.lineAt(node.from);
            const endLine = view.state.doc.lineAt(node.to);

            let lineNum = 1;
            for (let lineNo = startLine.number; lineNo <= endLine.number; lineNo++) {
              const line = view.state.doc.line(lineNo);
              const lineText = line.text.trim();

              // 跳过围栏标记 (```)
              if (lineText.startsWith('```')) continue;

              // 添加行级装饰：class + 可选的行号属性
              const attributes: Record<string, string> = {};
              if (this.showLineNumbers) {
                attributes['data-code-line-number'] = String(lineNum);
              }

              decorations.push(
                Decoration.line({
                  class: 'cm-code-block-line',
                  attributes,
                }).range(line.from),
              );

              lineNum++;
            }
          }
        },
      });
    }

    return Decoration.set(decorations, true);
  }
}
````

### 样式

```css
/* 代码块行基础样式（主题会覆盖） */
.cm-line.cm-code-block-line {
  /* 主题会在这里添加背景色和前景色 */
}

/* 行号通过 ::before 伪元素渲染 */
.cm-line.cm-code-block-line[data-code-line-number]::before {
  content: attr(data-code-line-number);
  display: inline-block;
  min-width: 2.5em;
  padding-right: 0.5em;
  margin-right: 0.5em;
  text-align: right;
  color: rgba(128, 128, 128, 0.6);
  user-select: none;
  font-size: 0.9em;
  border-right: 1px solid rgba(128, 128, 128, 0.2);
}

/* 主题可以覆盖行号颜色 */
.cm-line.cm-code-block-line[data-code-line-number]::before {
  /* 主题会设置 color 属性 */
}
```

### 优势

使用 `data-*` 属性 + CSS `::before` 伪元素的方案优于 widget：

1. **不进入文本流**：行号不是 DOM 节点，不会影响文本选择
2. **光标定位准确**：不会影响光标列位置计算
3. **性能更好**：无需创建和管理 widget DOM 节点
4. **主题切换简单**：只需更新 CSS，无需重建装饰
5. **自动不可选**：`user-select: none` 在伪元素上天然生效

## 主题系统设计

### 主题隔离策略

使用行级装饰 class 隔离代码块主题。由独立的代码块装饰插件给每一行打上稳定的 class（如 `cm-code-block-line` 和 `cm-code-theme-{themeName}`），主题 CSS 通过后代选择器作用于这些行内的 token：

```typescript
const codeBlockDarkTheme = EditorView.theme({
  // 代码块行的背景和前景色
  '.cm-line.cm-code-block-line': {
    backgroundColor: '#282c34',
    color: '#abb2bf',
  },
  // Token 颜色只作用于代码块行内
  '.cm-line.cm-code-block-line .tok-keyword': {
    color: '#c678dd',
  },
  '.cm-line.cm-code-block-line .tok-string': {
    color: '#98c379',
  },
  '.cm-line.cm-code-block-line .tok-comment': {
    color: '#5c6370',
    fontStyle: 'italic',
  },
});
```

### 主题预设

```typescript
const CODE_THEMES = {
  light: {
    bg: '#ffffff',
    fg: '#24292e',
    keyword: '#d73a49',
    string: '#032f62',
    comment: '#6a737d',
  },
  dark: {
    bg: '#282c34',
    fg: '#abb2bf',
    keyword: '#c678dd',
    string: '#98c379',
    comment: '#5c6370',
  },
} as const;

function createCodeTheme(preset: keyof typeof CODE_THEMES) {
  const colors = CODE_THEMES[preset];
  return EditorView.theme({
    // 应用颜色...
  });
}
```

## 与现有功能的集成

### 与实时预览模式的交互

```
┌─────────────────────────────────────────────────────┐
│ 实时预览模式 (hybridMarkdown)                      │
│  ├─ 标题: WYSIWYG 渲染 (active-scope 切换)        │
│  ├─ 强调: 样式文本 (active-scope 切换)            │
│  └─ 链接: 渲染链接 (active-scope 切换)            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 代码块增强 (独立插件，始终开启)                    │
│  ├─ 行级 class 标记 (cm-code-block-line)          │
│  ├─ 语法高亮 (嵌套语言解析器)                      │
│  ├─ 主题隔离 (独立主题系统)                        │
│  ├─ 行号 (可选)                                    │
│  └─ 背景样式 (始终保留，不受光标影响)              │
└─────────────────────────────────────────────────────┘
```

**关键特性**：

1. 代码块装饰不依赖 hybridMarkdown 的 active-scope 机制
2. 光标进入代码块后，背景、主题、行号持续保留
3. hybridMarkdown 只负责标题、强调、链接等需要切换的结构
4. 代码块的 FencedCode 节点已从 HYBRID_SCOPE_NODES 中移除

### 与代码字体系列的交互

当前行为：

- `codeFontFamily` 属性设置 `--una-code-font-family`
- 应用于 `.cm-una-code-font` 类

新行为：

- 代码块仍将遵守 `codeFontFamily`
- 语法高亮添加颜色，不改变字体

## 性能考虑

### 包大小

```
基础（当前）:                ~120 KB (gzipped)
+ @codemirror/language-data:  ~15 KB
+ @codemirror/lang-javascript: ~25 KB
+ @codemirror/lang-python:     ~20 KB
+ 代码主题系统:                ~5 KB
─────────────────────────────────────
总计:                        ~185 KB (gzipped)
增加:                        ~65 KB (54%)
```

### 懒加载策略

```typescript
// 急切加载常用语言
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';

// 懒加载其他语言
const languageLoaders = {
  rust: () => import('@codemirror/lang-rust'),
  go: () => import('@codemirror/lang-go'),
  // ...
};
```

### 渲染性能

- 语法高亮是增量的（仅可见范围）
- 行号装饰是轻量级 widgets
- 没有代码块的文档没有性能影响

## 测试策略

### 单元测试

````typescript
describe('代码块语法高亮', () => {
  it('应该高亮 TypeScript 代码', () => {
    const content = '```typescript\nconst x = 1;\n```';
    // 断言存在语法标记
  });

  it('应该应用独立主题', () => {
    // 编辑器 dark，代码 light
    // 断言代码块具有 light 主题样式
  });

  it('启用时应该显示行号', () => {
    // 断言渲染了行号 widgets
  });
});
````

### 视觉测试

- 不同主题的截图对比
- 在实时预览和普通模式下测试
- 测试各种语言

## 迁移路径

### 向后兼容性

- 新属性是可选的，具有合理的默认值
- 现有代码块继续工作
- API 没有破坏性更改

### 升级指南

```typescript
// 之前（没有语法高亮）
<UnaEditor v-model="content" />

// 之后（带语法高亮，自动主题）
<UnaEditor v-model="content" code-theme="auto" />

// 之后（带行号）
<UnaEditor
  v-model="content"
  code-theme="dark"
  :code-line-numbers="true"
/>
```

## 开放设计问题

### 1. 行号起始位置

代码块中的行号应该：

- A) 始终从 1 开始
- B) 允许自定义起始编号（例如，````typescript:5`）
- C) 从上一个代码块继续

**建议**：从 (A) 开始，如果需要稍后添加 (B)

### 2. 主题自定义

是否应该允许自定义主题对象？

```typescript
<UnaEditor
  :code-theme="{
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    keyword: '#569cd6',
    // ...
  }"
/>
```

**建议**：从预设开始，在 v2 中添加自定义主题

### 3. 语言检测回退

当未指定或未知语言时该怎么办？

```markdown

```

没有语言的代码

```

```

**建议**：应用通用语法高亮（关键字、字符串、注释）

## 实现阶段

### 阶段 1：基础语法高亮（MVP）

- 启用嵌套解析器
- 支持 TS/JS/Python
- 自动主题（跟随编辑器）

### 阶段 2：独立主题

- 添加 `codeTheme` 属性
- 实现主题隔离
- 支持 light/dark 预设

### 阶段 3：行号

- 添加 `codeLineNumbers` 属性
- 实现行号插件
- 样式行号

### 阶段 4：完善

- 添加更多语言
- 优化包大小
- 性能测试
