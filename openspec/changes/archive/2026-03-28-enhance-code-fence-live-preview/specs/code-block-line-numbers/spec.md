## MODIFIED Requirements

### Requirement: 行号在 livePreview 代码块阅读态中必须以代码块内部的 gutter-like leading column 呈现

当启用 `codeLineNumbers` 且 `livePreview=true` 时，围栏代码块的行号 MUST 作为代码块壳子内部的稳定 leading column 呈现，而不再继续依赖 `data-code-line-number` 配合 `::before` 伪元素作为唯一渲染方式。该 leading column SHALL 在 begin/body/end 行之间共享一致的宽度与对齐基准：正文行显示数字，opening / closing fence 行保留空槽但不显示数字。行号列 MUST NOT 参与文本选择或光标列位置计算。`livePreview=false` 时，本 change 不要求改写当前源码态行号渲染策略。
leading column 与代码正文之间 MUST 保留稳定的水平间距，避免数字与代码内容紧贴。
leading column SHOULD 与代码正文区拥有轻微但可感知的视觉区隔，例如弱背景差异或极细分界线，以避免其与编辑器全局 line number gutter 混在一起。

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
