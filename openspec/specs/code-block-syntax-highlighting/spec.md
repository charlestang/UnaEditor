# code-block-syntax-highlighting

## Purpose

定义围栏代码块的语法高亮能力，包括语言检测、嵌套解析、支持语言集合、性能边界以及在不同编辑模式下的一致表现。

## Requirements

### Requirement: 围栏代码块必须显示语法高亮

编辑器 MUST 根据指定的语言标识符对围栏代码块应用语法高亮。

#### Scenario: TypeScript 代码块的语法高亮

- **WHEN** 用户编写带有语言标识符 `typescript` 的围栏代码块
- **THEN** 关键字、字符串、数字、注释和其他标记 MUST 用适当的颜色高亮显示

#### Scenario: JavaScript 代码块的语法高亮

- **WHEN** 用户编写带有语言标识符 `javascript` 或 `js` 的围栏代码块
- **THEN** JavaScript 语法 MUST 正确高亮显示

#### Scenario: 没有语言标识符的代码块

- **WHEN** 用户编写围栏代码块但未指定语言
- **THEN** 代码 MUST 以等宽字体显示但 MUST NOT 进行语法高亮

### Requirement: 编辑器必须支持嵌套语言解析

编辑器 MUST 使用 CodeMirror 6 的嵌套解析器系统来解析围栏代码块内的代码。

#### Scenario: 嵌套解析器初始化

- **WHEN** 编辑器使用 Markdown 语言支持初始化
- **THEN** Markdown 解析器 MUST 配置为启用代码语言支持

#### Scenario: 从围栏标记检测语言

- **WHEN** 解析器遇到带有语言标识符的围栏代码块
- **THEN** 系统 MUST 加载并应用相应的语言解析器到代码内容

### Requirement: 编辑器必须支持多种编程语言

编辑器 MUST 支持常见编程语言的语法高亮，并识别既定语言别名。

#### Scenario: 核心语言立即可用

- **WHEN** 编辑器加载时
- **THEN** JavaScript、TypeScript、CSS、Markdown 和 Shell 语言 MUST 无需额外加载即可使用

#### Scenario: 扩展语言按需加载

- **WHEN** 用户创建 PHP、Go、Java 或 Python 代码块时
- **THEN** 系统 MUST 按需加载相应的语言解析器

#### Scenario: 识别语言别名

- **WHEN** 用户指定语言为 `js`、`javascript`、`ts` 或 `typescript`
- **THEN** 系统 MUST 应用正确的语言解析器

### Requirement: opening fence 中的语言标识符必须同时驱动高亮和 header label

围栏代码块 opening fence 中的语言标识符不仅 MUST 驱动语法高亮，还 MUST 作为代码块 header row 语言标签的数据来源。已支持的语言别名（如 `ts` / `typescript`、`js` / `javascript`）在高亮与标签层都 MUST 保持一致映射到同一个 canonical display label。若语言标识符非空但当前不受支持，编辑器 MUST 省略该语言标签，且 MUST NOT 伪装成某个已支持语言的规范标签。

#### Scenario: TypeScript 别名驱动标签

- **WHEN** 用户编写带有语言标识符 `ts` 的 fenced code block
- **THEN** 系统 MUST 正确高亮该代码块
- **AND** header row MUST 显示 `TypeScript` 语言标签

#### Scenario: JavaScript 别名驱动标签

- **WHEN** 用户编写带有语言标识符 `javascript` 或 `js` 的 fenced code block
- **THEN** 系统 MUST 正确高亮该代码块
- **AND** header row MUST 显示 `JavaScript` 语言标签

#### Scenario: 未知语言标识符不得被错误归一化

- **WHEN** 用户编写带有未知语言标识符 `foobar` 的 fenced code block
- **THEN** 系统 MUST NOT 将该标签错误显示为某个已支持语言的规范名称
- **AND** header row MUST NOT 显示 `foobar` 这一原始字符串

### Requirement: 语法高亮不得影响编辑器性能

语法高亮 MUST 增量应用，并且 MUST NOT 阻塞编辑器交互。

#### Scenario: 大型代码块

- **WHEN** 用户有超过 100 行的代码块
- **THEN** 语法高亮 MUST 仅应用于可见部分

#### Scenario: 没有代码块的文档

- **WHEN** 文档不包含围栏代码块
- **THEN** 系统 MUST NOT 在基础 Markdown 解析器之外加载任何语言解析器

### Requirement: 语法高亮必须在普通模式和实时预览模式下都能工作

无论编辑器模式如何，围栏代码块 MUST 显示语法高亮。

#### Scenario: 普通模式下的语法高亮

- **WHEN** 编辑器处于普通模式 (`livePreview=false`)
- **THEN** 代码块 MUST 显示语法高亮

#### Scenario: 实时预览模式下的语法高亮

- **WHEN** 编辑器处于实时预览模式 (`livePreview=true`)
- **THEN** 代码块 MUST 在保持实时预览样式的同时显示语法高亮
