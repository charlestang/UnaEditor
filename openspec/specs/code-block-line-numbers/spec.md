# code-block-line-numbers

## Purpose

定义围栏代码块的可选行号能力，包括编号规则、渲染方式、视觉样式、主题适配，以及它与语法高亮和文本选择行为之间的协同约束。

## Requirements

### Requirement: 代码块必须支持可选的行号

当启用 `codeLineNumbers` 属性时，代码块 MUST 显示行号；未启用时 MUST NOT 显示行号。

#### Scenario: 启用行号

- **WHEN** `codeLineNumbers` 属性为 `true`
- **THEN** 代码块中的每一行 MUST 显示行号

#### Scenario: 默认禁用行号

- **WHEN** `codeLineNumbers` 属性未设置或为 `false`
- **THEN** 代码块 MUST NOT 显示行号

### Requirement: 行号必须从 1 开始并按代码块独立计数

代码块中的行号 MUST 始终从 1 开始，且每个代码块 MUST 独立计数。

#### Scenario: 第一行行号

- **WHEN** 代码块启用行号
- **THEN** 第一行代码 MUST 编号为 `1`

#### Scenario: 多个代码块

- **WHEN** 文档包含多个带行号的代码块
- **THEN** 每个代码块 MUST 独立地从 `1` 开始编号

### Requirement: 行号必须排除围栏标记

行号 MUST 仅显示实际代码内容，不得包含起始或结束围栏标记。

#### Scenario: 围栏标记不编号

- **WHEN** 代码块以 ``` 和语言标识符开始
- **THEN** 起始围栏标记行 MUST NOT 获得行号

#### Scenario: 结束围栏不编号

- **WHEN** 代码块以结束的 ``` 结束
- **THEN** 结束围栏标记行 MUST NOT 获得行号

### Requirement: 行号必须具有独特的视觉样式

行号 MUST 在视觉上与代码内容区分开来，并保持不可选择。

#### Scenario: 行号外观

- **WHEN** 显示行号时
- **THEN** 行号 MUST 使用比代码文本更浅的颜色
- **AND** 行号 MUST 右对齐
- **AND** 行号 MUST 与代码内容保持适当间距

#### Scenario: 行号不可选择

- **WHEN** 用户选择代码文本时
- **THEN** 行号 MUST NOT 包含在选择中

### Requirement: 行号必须通过 CSS 伪元素渲染

行号 MUST 使用 `data-code-line-number` 属性配合 `::before` 伪元素渲染，而不是作为独立 widget 节点插入文本流。

#### Scenario: 行号实现方式

- **WHEN** 启用行号时
- **THEN** 代码行 MUST 具有 `data-code-line-number` 属性
- **AND** 行号 MUST 通过 CSS `::before` 伪元素显示
- **AND** 行号 MUST NOT 作为 widget 或其他 DOM 节点插入文本流

#### Scenario: 行号不影响文本流

- **WHEN** 用户定位光标或选择代码文本时
- **THEN** 行号 MUST NOT 影响光标列位置计算
- **AND** 行号 MUST NOT 被包含在文本选择中

### Requirement: 行号必须适应主题并与语法高亮协同工作

行号颜色 MUST 尊重当前代码块主题，并且与语法高亮同时启用时不得发生冲突。

#### Scenario: 深色主题中的行号

- **WHEN** 代码块使用深色主题
- **THEN** 行号 MUST 使用适当的浅色以确保可见性

#### Scenario: 浅色主题中的行号

- **WHEN** 代码块使用浅色主题
- **THEN** 行号 MUST 使用适当的深色以确保可见性

#### Scenario: 组合行号和高亮

- **WHEN** `codeLineNumbers` 为 `true` 且语法高亮处于活动状态
- **THEN** 代码 MUST 正确显示行号和语法颜色

### Requirement: 行号更改必须立即生效

对 `codeLineNumbers` 属性的更改 MUST 立即生效，无需重新加载编辑器。

#### Scenario: 动态切换行号

- **WHEN** `codeLineNumbers` 属性从 `false` 更改为 `true`
- **THEN** 行号 MUST 立即出现在所有代码块中

#### Scenario: 禁用行号

- **WHEN** `codeLineNumbers` 属性从 `true` 更改为 `false`
- **THEN** 行号 MUST 立即从所有代码块中消失
