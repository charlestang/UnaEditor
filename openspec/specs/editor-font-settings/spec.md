# editor-font-settings

## Purpose

定义编辑器正文字体、代码字体与字号的可配置行为，以及这些设置在运行时变化后如何保持稳定测量、光标定位和滚动表现。

## Requirements

### Requirement: 正文字体可配置

编辑器 SHALL 提供 `fontFamily` prop，允许调用方指定正文字体。正文字体应用于所有非代码内容，包括段落、标题、引用、列表等。

#### Scenario: 指定正文字体

- **WHEN** 调用方将 `fontFamily` prop 设置为 `"Georgia, serif"`
- **THEN** 编辑器中所有非代码文本 SHALL 使用 `Georgia, serif` 字体渲染

#### Scenario: 未指定正文字体

- **WHEN** 调用方未设置 `fontFamily` prop
- **THEN** 编辑器 SHALL 使用默认的 sans-serif 字体渲染正文

### Requirement: 代码字体可配置

编辑器 SHALL 提供 `codeFontFamily` prop，允许调用方指定代码字体。代码字体仅应用于 inline code 和 fenced code block 的代码内容本身，无论 livePreview 是否开启。编辑器全局 line number gutter、源码态代码块行号以及 `livePreview` faux gutter 的数字列 MUST NOT 因 `codeFontFamily` 而切换到相同字体。

#### Scenario: 指定代码字体

- **WHEN** 调用方将 `codeFontFamily` prop 设置为 `"Fira Code, monospace"`
- **THEN** 编辑器中所有 inline code 和 fenced code block SHALL 使用 `Fira Code, monospace` 字体渲染

#### Scenario: 未指定代码字体

- **WHEN** 调用方未设置 `codeFontFamily` prop
- **THEN** 编辑器 SHALL 使用默认的 monospace 字体渲染代码内容

#### Scenario: 非 livePreview 模式下代码字体生效

- **WHEN** `livePreview` 为 `false` 且调用方设置了 `codeFontFamily`
- **THEN** 编辑器中的 inline code 和 fenced code block SHALL 使用指定的代码字体渲染

#### Scenario: 代码字体不外溢到行号列

- **WHEN** 调用方将 `codeFontFamily` prop 设置为 `"Fira Code, monospace"`
- **THEN** 编辑器全局 line number gutter MUST NOT 跟随切换到 `Fira Code, monospace`
- **AND** fenced code block 的源码态行号与 `livePreview` faux gutter 数字列 MUST NOT 跟随切换到 `Fira Code, monospace`

### Requirement: 正文字号可配置

编辑器 SHALL 提供 `fontSize` prop（类型为 `number`，单位为 px），允许调用方指定正文字号。livePreview 模式下标题字号 SHALL 相对于正文字号自动缩放。

#### Scenario: 指定字号

- **WHEN** 调用方将 `fontSize` prop 设置为 `16`
- **THEN** 编辑器正文 SHALL 以 16px 字号渲染
- **AND** livePreview 模式下标题字号 SHALL 按比例缩放（h1 约 1.875em，h2 约 1.5em，h3 约 1.25em）

#### Scenario: 未指定字号

- **WHEN** 调用方未设置 `fontSize` prop
- **THEN** 编辑器 SHALL 使用默认字号（14px）渲染

### Requirement: 运行时字体变化后编辑器正确重新测量

当 `fontFamily`、`codeFontFamily` 或 `fontSize` prop 在运行时变化时，编辑器 SHALL 确保 CodeMirror 的内部度量缓存（行高、字符宽度等）与实际渲染一致，不出现光标错位或滚动跳跃。这保持了与现有 props（theme、lineNumbers、vimMode）的行为一致性。

#### Scenario: 运行时修改字号

- **WHEN** 调用方在运行时将 `fontSize` 从 `14` 改为 `18`
- **THEN** 编辑器 SHALL 以 18px 字号渲染，且光标定位和滚动行为正常

#### Scenario: 运行时修改字体族触发字体加载

- **WHEN** 调用方在运行时将 `fontFamily` 改为一个尚未加载的 web font
- **THEN** 编辑器 SHALL 在字体加载完成后重新测量，确保度量值基于最终字体而非 fallback 字体
