## MODIFIED Requirements

### Requirement: 编辑器必须支持自动主题模式

当 `codeTheme` 设置为 `auto` 时，代码块 MUST 跟随 resolved editor theme 的 `type`，而不是只依赖原始 `theme` prop 是否为字符串。

#### Scenario: 自定义 dark 主题的自动代码块主题

- **WHEN** 编辑器 `theme` 为 `{ type: 'dark', content: { link: { color: '#8ab4f8' } } }` 且 `codeTheme` 为 `auto`
- **THEN** 代码块 MUST 使用 `one-dark` 主题

#### Scenario: 自定义 light 主题的自动代码块主题

- **WHEN** 编辑器 `theme` 为 `{ type: 'light', content: { link: { color: '#0b57d0' } } }` 且 `codeTheme` 为 `auto`
- **THEN** 代码块 MUST 使用 `github-light` 主题
