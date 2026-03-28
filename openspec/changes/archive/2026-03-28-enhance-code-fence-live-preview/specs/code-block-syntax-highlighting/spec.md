## ADDED Requirements

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
