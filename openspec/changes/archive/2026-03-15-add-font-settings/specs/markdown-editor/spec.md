## MODIFIED Requirements

### Requirement: Content editing with v-model binding

The Editor component SHALL support Vue 3 v-model for two-way content binding.

The Editor component SHALL accept optional `fontFamily` (string), `codeFontFamily` (string), and `fontSize` (number, in px) props. These props SHALL be converted to CSS variables (`--una-font-family`, `--una-code-font-family`, `--una-font-size`) on the editor container element.

#### Scenario: External content update

- **WHEN** parent component updates the v-model value
- **THEN** the editor content SHALL update to reflect the new value

#### Scenario: Internal content edit

- **WHEN** user types in the editor
- **THEN** the v-model value SHALL update with the new content
- **AND** the update:modelValue event SHALL be emitted

## ADDED Requirements

### Requirement: 非 livePreview 模式下代码结构使用代码字体

无论 livePreview 是否开启，编辑器 SHALL 为 inline code 和 fenced code block 添加 decoration class，使代码字体在两种模式下一致生效。

#### Scenario: 非 livePreview 模式下 inline code 使用代码字体

- **WHEN** `livePreview` 为 `false` 且文档包含 inline code
- **THEN** 编辑器 SHALL 为 inline code 添加 decoration class，使其使用代码字体渲染

#### Scenario: 非 livePreview 模式下 fenced code block 使用代码字体

- **WHEN** `livePreview` 为 `false` 且文档包含 fenced code block
- **THEN** 编辑器 SHALL 为 fenced code block 行添加 decoration class，使其使用代码字体渲染
