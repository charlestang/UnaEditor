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

### Requirement: 行号在 livePreview 代码块阅读态中必须以代码块内部的 gutter-like leading column 呈现

当启用 `codeLineNumbers` 且 `livePreview=true` 时，围栏代码块的行号 MUST 作为代码块壳子内部的稳定 leading column 呈现，而不再继续依赖 `data-code-line-number` 配合 `::before` 伪元素作为唯一渲染方式。该 leading column SHALL 在 begin/body/end 行之间共享一致的宽度与对齐基准：正文行显示数字，opening / closing fence 行保留空槽但不显示数字。行号列 MUST NOT 参与文本选择或光标列位置计算。`livePreview=false` 时，编辑器 MAY 继续沿用源码态行号渲染策略。

leading column 与代码正文之间 MUST 保留稳定的水平间距，避免数字与代码内容紧贴。leading column SHOULD 与代码正文区拥有轻微但可感知的视觉区隔，例如弱背景差异或极细分界线，以避免其与编辑器全局 line number gutter 混在一起。

#### Scenario: livePreview 下正文行显示数字，fence 行保留空槽

- **WHEN** `codeLineNumbers` 为 `true`、`livePreview` 为 `true` 且文档包含 fenced code block
- **THEN** 代码正文行 MUST 显示从 `1` 开始的行号
- **AND** opening fence 与 closing fence 行 MUST 保留同宽的 leading slot
- **AND** opening fence 与 closing fence 行 MUST NOT 显示数字

#### Scenario: active 与 inactive 状态保持对齐稳定

- **WHEN** `codeLineNumbers` 为 `true`、`livePreview` 为 `true` 且光标在某个 fenced code block 内外切换
- **THEN** begin/body/end 行的正文起始列 MUST 保持稳定对齐
- **AND** 行号列 MUST NOT 因 header row 与 raw fence 切换而出现明显水平跳变

#### Scenario: 换行后的续行保持正文列对齐

- **WHEN** `codeLineNumbers` 为 `true`、`livePreview` 为 `true` 且全局 `lineWrap` 已启用，某一行代码发生视觉换行
- **THEN** 续行片段 MUST 从代码正文列继续对齐
- **AND** 续行片段 MUST NOT 回退到 faux gutter 之下

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
