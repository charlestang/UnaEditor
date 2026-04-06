## MODIFIED Requirements

### Requirement: 编辑器必须支持多种编程语言

编辑器 MUST 支持常见编程语言的语法高亮，并识别既定语言别名。

#### Scenario: 核心语言立即可用

- **WHEN** 编辑器加载时
- **THEN** JavaScript、TypeScript、CSS、HTML 和 Shell 语言 MUST 无需额外加载即可使用

#### Scenario: 扩展语言按需加载

- **WHEN** 用户创建 PHP、Go、Java 或 Python 代码块时
- **THEN** 系统 MUST 按需加载相应的语言解析器

#### Scenario: 识别语言别名

- **WHEN** 用户指定语言为 `js`、`javascript`、`ts` 或 `typescript`
- **THEN** 系统 MUST 应用正确的语言解析器

#### Scenario: 识别 HTML 语言标识符

- **WHEN** 用户编写带有语言标识符 `html` 的 fenced code block
- **THEN** 系统 MUST 将其识别为受支持语言并应用 HTML 语法高亮

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

#### Scenario: HTML 语言标识符驱动标签

- **WHEN** 用户编写带有语言标识符 `html` 的 fenced code block
- **THEN** 系统 MUST 正确高亮该代码块
- **AND** header row MUST 显示 `HTML` 语言标签

#### Scenario: 未知语言标识符不得被错误归一化

- **WHEN** 用户编写带有未知语言标识符 `foobar` 的 fenced code block
- **THEN** 系统 MUST NOT 将该标签错误显示为某个已支持语言的规范名称
- **AND** header row MUST NOT 显示 `foobar` 这一原始字符串
