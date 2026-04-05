# editor-theming

## Purpose

定义编辑器主题解析与内容 token 主题系统，包括预置主题、自定义覆盖对象、运行时切换，以及关键 Markdown 语义样式的稳定样式承载约束。

## Requirements

### Requirement: 编辑器必须支持预置主题和自定义主题覆盖对象

编辑器 SHALL 接受 `'light'`、`'dark'` 以及自定义主题对象作为 `theme` prop。自定义主题对象 MUST 至少声明 `type: 'light' | 'dark'` 作为外观基线；未覆盖的主题 token MUST 从对应的预置主题继承。

#### Scenario: 使用预置主题名称

- **WHEN** `theme` prop 设置为 `'light'` 或 `'dark'`
- **THEN** 编辑器 MUST 使用对应的预置主题渲染编辑器内容与相关派生样式

#### Scenario: 使用自定义主题覆盖对象

- **WHEN** `theme` prop 传入 `{ type: 'dark', content: { link: { color: '#8ab4f8' } } }`
- **THEN** 编辑器 MUST 以 dark 预置主题作为基线
- **AND** 链接颜色 MUST 使用 `#8ab4f8`
- **AND** 未显式覆盖的其它 token MUST 继续继承 dark 预置主题的默认值

### Requirement: 公共主题对象必须是高层 token 数据，而不是底层 CodeMirror 扩展

集成方提供的主题对象 MUST 通过稳定的高层 token 字段表达主题意图。调用方 SHALL NOT 被要求构造底层 CodeMirror `Extension` 才能完成自定义主题。

#### Scenario: 调用方仅覆盖内容 token

- **WHEN** 调用方希望只调整标题和链接样式
- **THEN** 调用方 MUST 能仅通过主题对象中的内容 token 完成配置
- **AND** 不需要直接依赖 CodeMirror 的主题扩展 API

### Requirement: 首期主题系统必须覆盖内容区 token 与表格表头 token

首期 `EditorTheme` MUST 支持配置以下主题 token：

- 标题 h1-h6 的字号、字重和行高
- 链接的颜色、装饰和下划线偏移
- 强调和加粗的样式
- inline code 的背景色、圆角和内边距
- blockquote 的边框色、背景色、缩进和字体样式
- syntax mark 的颜色
- list marker / task checkbox 的主题化颜色
- 结构化表格表头背景色

#### Scenario: 标题样式由主题控制

- **WHEN** 主题对象定义 `heading2: { fontSize: '1.5em', fontWeight: '700', lineHeight: '1.3' }`
- **THEN** 二级标题在 live preview 和标题源码态 MUST 均以该字号、字重和行高显示

#### Scenario: 表格表头背景色由主题控制

- **WHEN** 主题对象定义 `table: { headerBackground: 'rgba(99, 102, 241, 0.12)' }`
- **THEN** 结构化表格表头 MUST 使用该背景色渲染

### Requirement: 编辑器必须内置 light 和 dark 两套完整预置主题

编辑器 MUST 内置 `light` 和 `dark` 两套完整预置主题。两套预置主题 MUST 覆盖首期公开主题 token 的全部字段，并分别适配浅色与深色外观。

#### Scenario: 预置 light 主题

- **WHEN** `theme` 设置为 `'light'`
- **THEN** 编辑器 MUST 使用适合浅色背景的预置主题 token

#### Scenario: 预置 dark 主题

- **WHEN** `theme` 设置为 `'dark'`
- **THEN** 编辑器 MUST 使用适合深色背景的预置主题 token

### Requirement: 主题更改必须立即生效

当 `theme` prop 在运行时发生变化时，编辑器 MUST 立即更新所有受影响的主题消费者，而不重新创建编辑器实例。

#### Scenario: 从预置主题切换到另一套预置主题

- **WHEN** `theme` prop 从 `'light'` 切换为 `'dark'`
- **THEN** 编辑器 MUST 立即以 dark 主题重新渲染受影响样式

#### Scenario: 从预置主题切换为自定义主题对象

- **WHEN** `theme` prop 从 `'light'` 切换为 `{ type: 'dark', content: { link: { color: '#8ab4f8' } } }`
- **THEN** 编辑器 MUST 立即应用解析后的 dark 自定义主题

### Requirement: 主题消费者必须共享同一份解析后的主题结果

对于每个已挂载的编辑器实例，组件壳层中的表面样式消费者、结构化表格相关主题消费者、CodeMirror chrome theme、内容主题以及任何依赖主题基线的派生默认值（例如 `codeTheme='auto'`）MUST 共享同一份解析后的主题结果。运行时主题更新 MUST NOT 依赖多个层次分别重复解析原始 `theme` 输入。

#### Scenario: 自定义主题与自动代码主题共享同一基线

- **WHEN** `theme` prop 设置为自定义 dark 主题对象，且 `codeTheme` 为 `'auto'`
- **THEN** 壳层与运行时的所有主题消费者 SHALL 基于同一份 dark 解析结果工作
- **AND** 自动代码主题 SHALL 跟随这同一份解析结果的明暗基线

#### Scenario: 运行时主题切换保持跨消费者同步

- **WHEN** `theme` prop 在运行时发生变化
- **THEN** 组件壳层与编辑器运行时中的所有受影响主题消费者 SHALL 在同一已挂载实例内完成更新
- **AND** 不得出现部分消费者仍停留在旧主题解析结果上的状态分裂

### Requirement: 主题系统必须把关键 Markdown 语义样式绑定到组件拥有的稳定 selector

主题系统 MUST 通过编辑器自身拥有的稳定 decoration class、line-level selector 或等价机制承载关键 Markdown 视觉语义，而不是仅依赖内层语法高亮 token span 的默认样式。这里的关键语义至少包括标题、强调、加粗、链接和行内代码。

#### Scenario: 宿主应用对常见内联标签做 reset

- **WHEN** 宿主应用对编辑器内的常见内联标签或 `span` 施加统一 reset，并重设 `font-style`、`font-weight`、`text-decoration` 或 `font-family`
- **THEN** 编辑器 MUST 仍通过自身 selector 保持主题定义的强调、加粗、链接与行内代码样式

#### Scenario: 标题源码态不依赖单一 token span 的默认样式

- **WHEN** 标题进入源码显示状态
- **THEN** 编辑器 MUST 仍通过稳定的行级或外层 selector 约束标题字号、字重、行高与 syntax mark 颜色
- **AND** 不得要求宿主应用额外编写补丁 CSS 才能恢复这些样式

### Requirement: 自定义主题对象必须受到 TypeScript 类型约束

集成方提供的自定义主题对象 MUST 受到 TypeScript 类型系统约束。缺少必需字段或字段类型错误时，TypeScript 编译器 MUST 报告类型错误。

#### Scenario: 缺少 `type`

- **WHEN** 集成方传入一个缺少 `type` 的主题对象
- **THEN** TypeScript 编译器 MUST 报告类型错误
