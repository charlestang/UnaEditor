# markdown-editor

## Purpose

定义 `UnaEditor` 组件的核心编辑器能力，包括内容绑定、显示选项、交互事件、程序化方法和基础可配置项。

## Requirements

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

### Requirement: Line numbers display

The Editor component SHALL support toggling line numbers display.

#### Scenario: Line numbers enabled

- **WHEN** lineNumbers prop is true
- **THEN** the editor SHALL display line numbers on the left side

#### Scenario: Line numbers disabled

- **WHEN** lineNumbers prop is false or undefined
- **THEN** the editor SHALL NOT display line numbers

### Requirement: Internationalization support

The Editor component SHALL support multiple languages with built-in Chinese and English.

#### Scenario: Using built-in Chinese locale

- **WHEN** locale prop is set to 'zh-CN'
- **THEN** all UI text SHALL be displayed in Chinese

#### Scenario: Using built-in English locale

- **WHEN** locale prop is set to 'en-US'
- **THEN** all UI text SHALL be displayed in English

#### Scenario: Using custom locale

- **WHEN** locale prop is set to a custom locale object
- **THEN** the editor SHALL use the custom locale for UI text

### Requirement: Fullscreen mode support

The Editor component SHALL support two types of fullscreen modes.

#### Scenario: Browser fullscreen mode

- **WHEN** toggleFullscreen() is called without arguments or with 'browser'
- **THEN** the editor SHALL enter browser fullscreen using CSS positioning
- **AND** the editor SHALL fill the entire browser viewport with fixed positioning

#### Scenario: Screen fullscreen mode

- **WHEN** toggleFullscreen('screen') is called
- **THEN** the editor SHALL enter screen fullscreen using the Fullscreen API
- **AND** the entire screen SHALL be in fullscreen mode

#### Scenario: Exit fullscreen

- **WHEN** exitFullscreen() is called
- **THEN** the editor SHALL exit fullscreen mode
- **AND** return to normal display

### Requirement: Image drag and paste handling

The Editor component SHALL handle image drag and paste events.

#### Scenario: Image drag and drop

- **WHEN** user drags an image file and drops it on the editor
- **THEN** the onDrop event SHALL be emitted with the image file
- **AND** the default browser behavior SHALL be prevented

#### Scenario: Image paste

- **WHEN** user pastes an image from clipboard
- **THEN** the onDrop event SHALL be emitted with the image file
- **AND** the default browser behavior SHALL be prevented

### Requirement: Keyboard shortcut support

The Editor component SHALL support keyboard shortcuts with browser default prevention.

#### Scenario: Save shortcut on macOS

- **WHEN** user presses Cmd-s on macOS
- **THEN** the onSave event SHALL be emitted
- **AND** the browser's default save dialog SHALL NOT appear

#### Scenario: Save shortcut on Windows/Linux

- **WHEN** user presses Ctrl-s on Windows or Linux
- **THEN** the onSave event SHALL be emitted
- **AND** the browser's default save dialog SHALL NOT appear

### Requirement: Component method exposure

The Editor component SHALL expose methods for programmatic control.

#### Scenario: Focus editor

- **WHEN** focus() method is called via component ref
- **THEN** the editor SHALL receive keyboard focus

#### Scenario: Get selected text

- **WHEN** getSelection() method is called via component ref
- **THEN** the method SHALL return the currently selected text as a string

### Requirement: Theme support

The Editor component SHALL support light and dark themes.

#### Scenario: Light theme

- **WHEN** theme prop is set to 'light' or undefined
- **THEN** the editor SHALL display with light theme colors

#### Scenario: Dark theme

- **WHEN** theme prop is set to 'dark'
- **THEN** the editor SHALL display with dark theme colors

### Requirement: Editor state control

The Editor component SHALL support placeholder, disabled, and readonly states.

#### Scenario: Placeholder text

- **WHEN** editor is empty and placeholder prop is set
- **THEN** the placeholder text SHALL be displayed in the editor

#### Scenario: Disabled state

- **WHEN** disabled prop is true
- **THEN** the editor SHALL be non-interactive
- **AND** user SHALL NOT be able to edit content

#### Scenario: Readonly state

- **WHEN** readonly prop is true
- **THEN** the editor SHALL display content but prevent editing
- **AND** user SHALL be able to select and copy text

### Requirement: Event emission

The Editor component SHALL emit events for content changes and user interactions.

#### Scenario: Content change event

- **WHEN** user modifies the editor content
- **THEN** the change event SHALL be emitted with the new content value

#### Scenario: Focus event

- **WHEN** editor receives keyboard focus
- **THEN** the focus event SHALL be emitted

#### Scenario: Blur event

- **WHEN** editor loses keyboard focus
- **THEN** the blur event SHALL be emitted

### Requirement: 非 livePreview 模式下代码结构使用代码字体

无论 livePreview 是否开启，编辑器 SHALL 为 inline code 和 fenced code block 添加 decoration class，使代码字体在两种模式下一致生效。

#### Scenario: 非 livePreview 模式下 inline code 使用代码字体

- **WHEN** `livePreview` 为 `false` 且文档包含 inline code
- **THEN** 编辑器 SHALL 为 inline code 添加 decoration class，使其使用代码字体渲染

#### Scenario: 非 livePreview 模式下 fenced code block 使用代码字体

- **WHEN** `livePreview` 为 `false` 且文档包含 fenced code block
- **THEN** 编辑器 SHALL 为 fenced code block 行添加 decoration class，使其使用代码字体渲染
