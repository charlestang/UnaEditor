# 提案：代码块语法高亮

## 概述

为 Markdown 编辑器中的围栏代码块添加语法高亮支持，支持可配置的主题和独立于主编辑器主题的行号。

## 问题陈述

目前，编辑器中的围栏代码块仅具有：

- 等宽字体样式（`.cm-una-code-font`）
- 背景颜色区分
- 代码内容没有语法高亮
- 代码块内没有行号

这使得代码块的可读性较差，难以区分不同的代码元素（关键字、字符串、注释等）。

## 目标

1. **语法高亮**：为围栏代码块启用完整的语法高亮
   - 支持常见语言：TypeScript、JavaScript、Python、Go、Rust 等
   - 使用 CodeMirror 6 的嵌套解析器方法实现精确高亮

2. **丰富的配色方案支持**：为代码块提供流行的配色方案
   - 代码块主题独立于编辑器主题
   - 支持 9 种流行主题：Dracula、Monokai、Solarized、Nord、Tokyo Night 等
   - 示例：编辑器使用 One Dark，代码块使用 Dracula
   - 混合明暗：浅色编辑器配深色代码块（反之亦然）

3. **行号**：为代码块添加可选的行号
   - 通过属性配置
   - 独立于编辑器的主行号

4. **性能**：保持合理的包大小
   - 默认加载常用语言
   - 支持额外语言的懒加载

## 非目标

- 代码块编辑功能（自动完成、代码检查）- 保持块为纯文本
- 自定义语法定义 - 仅使用现有语言解析器
- 实时语言检测 - 依赖显式语言标签（```typescript）

## 用户体验

### API 设计

```vue
<UnaEditor v-model="content" theme="dark" code-theme="light" :code-line-numbers="true" />
```

### 属性

| 属性              | 类型                      | 默认值   | 描述                                    |
| ----------------- | ------------------------- | -------- | --------------------------------------- |
| `codeTheme`       | `'auto' \| CodeThemeName` | `'auto'` | 代码块的配色方案。'auto' 跟随编辑器主题 |
| `codeLineNumbers` | `boolean`                 | `false`  | 在代码块中显示行号                      |

**支持的配色方案：**

深色主题：

- `one-dark` - VSCode 的默认深色主题
- `dracula` - 流行的紫色/粉色主题
- `monokai` - 经典的 Sublime Text 主题
- `solarized-dark` - 精确的可读性颜色
- `nord` - 北极风格的蓝色调色板
- `tokyo-night` - 受东京启发的清爽深色主题

浅色主题：

- `github-light` - GitHub 的清爽浅色主题
- `solarized-light` - Solarized 的浅色变体
- `atom-one-light` - Atom 的默认浅色主题

### 使用示例

```typescript
// 场景 1：代码块跟随编辑器主题
<UnaEditor theme="dark" code-theme="auto" />
// → 代码块使用：one-dark

// 场景 2：代码块使用 Dracula 主题
<UnaEditor theme="dark" code-theme="dracula" />
// → 编辑器：one-dark，代码块：dracula

// 场景 3：浅色编辑器配深色代码块
<UnaEditor theme="light" code-theme="monokai" />
// → 编辑器：light，代码块：monokai（深色）

// 场景 4：Solarized 配行号
<UnaEditor theme="dark" code-theme="solarized-dark" :code-line-numbers="true" />
```

## 技术方案

### 架构

```
┌─────────────────────────────────────────────────────┐
│ useEditor.ts                                        │
│  ├─ markdown({ codeLanguages: languages })          │
│  ├─ codeThemeCompartment (动态)                     │
│  └─ codeLineNumbersCompartment (动态)               │
└─────────────────────────────────────────────────────┘
         │
         ├─ @codemirror/language-data (懒加载)
         ├─ @codemirror/lang-javascript
         ├─ @codemirror/lang-python
         └─ ... (其他语言)
```

### 实现策略

1. **启用嵌套解析**

   ````typescript
   import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
   import { languages } from '@codemirror/language-data';

   markdown({
     base: markdownLanguage,
     codeLanguages: languages, // 自动检测 ```typescript, ```python 等
   });
   ````

2. **代码块主题系统**
   - 为代码块创建主题扩展
   - 使用 CSS 自定义属性实现主题隔离
   - 仅将主题应用于 `.cm-fenced-code` 作用域

3. **代码块行号**
   - 扩展 `FencedCode` 装饰以包含行号
   - 与主编辑器行号分开样式

### 依赖项

需要的新依赖：

- `@codemirror/language-data` - 语言定义
- `@codemirror/lang-javascript` - JS/TS 支持
- `@codemirror/lang-python` - Python 支持
- （可选）根据需要添加其他语言包

预计包大小影响：核心语言 +50-80KB（gzipped）

## 成功标准

- [ ] 围栏代码块显示语法高亮
- [ ] 代码块主题可以独立于编辑器主题设置
- [ ] 可以为代码块启用行号
- [ ] 至少支持 5 种常见语言（TS、JS、Python、Go、Rust）
- [ ] 没有代码块的文档没有性能下降
- [ ] 包大小增加 < 100KB（gzipped）

## 待解决问题

1. **语言支持**：哪些语言应该默认打包，哪些应该懒加载？
   - 提议：打包 TS/JS/CSS/Markdown/Shell，懒加载其他语言（PHP、Go、Java、Python 等）

2. **默认主题行为**：当 `codeTheme="auto"` 时，使用哪些主题？
   - 提议：编辑器 dark → one-dark，编辑器 light → github-light

3. **行号样式**：代码块行号是否应该与编辑器行号有不同的样式？
   - 提议：是的，使其更微妙（更浅的颜色，更小的字体）

4. **主题自定义**：v1 是否应该支持自定义配色方案？
   - 提议：否，从 9 个预设开始，在 v2 中添加自定义主题

## 时间线

- 阶段 1：基础语法高亮（1-2 天）
- 阶段 2：独立主题支持（1 天）
- 阶段 3：代码块行号（1 天）
- 阶段 4：测试和完善（1 天）

总计：约 4-5 天
