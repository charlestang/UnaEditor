## MODIFIED Requirements

### Requirement: 代码字体可配置

编辑器 SHALL 提供 `codeFontFamily` prop，允许调用方指定代码字体。代码字体仅应用于 inline code 和 fenced code block 的代码内容本身，无论 livePreview 是否开启。编辑器全局 line number gutter、源码态代码块行号以及 `livePreview` faux gutter 的数字列 MUST NOT 因 `codeFontFamily` 而切换到相同字体。

#### Scenario: 指定代码字体

- **WHEN** 调用方将 `codeFontFamily` prop 设置为 `"Fira Code, monospace"`
- **THEN** 编辑器中所有 inline code 和 fenced code block 的代码内容 SHALL 使用 `Fira Code, monospace` 字体渲染

#### Scenario: 代码字体不外溢到行号列

- **WHEN** 调用方将 `codeFontFamily` prop 设置为 `"Fira Code, monospace"`
- **THEN** 编辑器全局 line number gutter MUST NOT 跟随切换到 `Fira Code, monospace`
- **AND** fenced code block 的源码态行号与 `livePreview` faux gutter 数字列 MUST NOT 跟随切换到 `Fira Code, monospace`
