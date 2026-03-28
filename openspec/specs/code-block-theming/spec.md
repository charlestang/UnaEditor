# code-block-theming

## Purpose

定义代码块主题系统，包括独立主题配置、自动主题跟随、内置主题集合、动态切换、样式隔离性以及整体可读性要求。

## Requirements

### Requirement: 代码块必须支持独立的主题配置

代码块 MUST 拥有独立于主编辑器主题的主题配置。

#### Scenario: 代码块主题与编辑器主题不同

- **WHEN** 编辑器主题为 `dark` 且 `codeTheme` 属性为 `dracula`
- **THEN** 编辑器 MUST 使用 `dark` 主题
- **AND** 代码块 MUST 使用 Dracula 配色方案

#### Scenario: 深色编辑器中的浅色代码块

- **WHEN** 编辑器主题为 `dark` 且 `codeTheme` 属性为 `github-light`
- **THEN** 代码块 MUST 以浅色背景和浅色主题颜色显示

#### Scenario: 浅色编辑器中的深色代码块

- **WHEN** 编辑器主题为 `light` 且 `codeTheme` 属性为 `monokai`
- **THEN** 代码块 MUST 以深色背景和 Monokai 颜色显示

### Requirement: 编辑器必须支持自动主题模式

当 `codeTheme` 设置为 `auto` 时，代码块 MUST 跟随 resolved editor theme 的 `type`，而不是只依赖原始 `theme` prop 是否为字符串。

#### Scenario: 深色编辑器的自动主题

- **WHEN** 编辑器主题为 `dark` 且 `codeTheme` 为 `auto`
- **THEN** 代码块 MUST 使用 `one-dark` 主题

#### Scenario: 浅色编辑器的自动主题

- **WHEN** 编辑器主题为 `light` 且 `codeTheme` 为 `auto`
- **THEN** 代码块 MUST 使用 `github-light` 主题

#### Scenario: 自定义 dark 主题的自动代码块主题

- **WHEN** 编辑器 `theme` 为 `{ type: 'dark', content: { link: { color: '#8ab4f8' } } }` 且 `codeTheme` 为 `auto`
- **THEN** 代码块 MUST 使用 `one-dark` 主题

#### Scenario: 自定义 light 主题的自动代码块主题

- **WHEN** 编辑器 `theme` 为 `{ type: 'light', content: { link: { color: '#0b57d0' } } }` 且 `codeTheme` 为 `auto`
- **THEN** 代码块 MUST 使用 `github-light` 主题

### Requirement: 编辑器必须支持预定义配色方案

编辑器 MUST 为代码块提供预定义的深色与浅色主题选项。

#### Scenario: 深色主题选项

- **WHEN** 用户将 `codeTheme` 设置为 `one-dark`、`dracula`、`monokai`、`solarized-dark`、`nord` 或 `tokyo-night`
- **THEN** 代码块 MUST 以所选深色主题颜色显示

#### Scenario: 浅色主题选项

- **WHEN** 用户将 `codeTheme` 设置为 `github-light`、`solarized-light` 或 `atom-one-light`
- **THEN** 代码块 MUST 以所选浅色主题颜色显示

### Requirement: 主题必须覆盖常见语法标记并保持可读性

每个主题 MUST 为常见语法标记提供颜色定义，并且 MUST 保持足够的前景背景对比度。

#### Scenario: 完整的标记覆盖

- **WHEN** 代码块使用任何主题
- **THEN** 主题 MUST 为关键字、函数、字符串、数字、注释、运算符、变量、类型、常量、属性、标签、正则表达式和转义序列定义颜色

#### Scenario: 最低对比度要求

- **WHEN** 应用任何主题时
- **THEN** 前景色和背景色 MUST 具有足够的对比度以确保可读性

### Requirement: 主题更改必须立即生效且仅隔离到代码块

主题更改 MUST 立即生效，且代码块主题 MUST NOT 影响主编辑器内容的样式。

#### Scenario: 动态主题切换

- **WHEN** 用户更改 `codeTheme` 属性值时
- **THEN** 代码块 MUST 立即更新以显示新主题颜色

#### Scenario: 编辑器主题更改影响自动模式

- **WHEN** `codeTheme` 为 `auto` 且编辑器 `theme` 属性更改时
- **THEN** 代码块 MUST 立即更新以匹配新的编辑器主题

#### Scenario: 主题隔离

- **WHEN** 代码块使用与编辑器不同的主题时
- **THEN** 代码块外的 Markdown 内容 MUST 保持编辑器主题样式

### Requirement: 无效的主题名称必须优雅降级

当提供无效的主题名称时，编辑器 MUST 使用默认主题。

#### Scenario: 未知主题名称

- **WHEN** `codeTheme` 属性设置为无法识别的值
- **THEN** 编辑器 MUST 记录警告
- **AND** 系统 MUST 根据编辑器主题使用默认主题（`dark` 用 `one-dark`，`light` 用 `github-light`）
