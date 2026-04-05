## MODIFIED Requirements

### Requirement: Content editing with v-model binding

The Editor component SHALL support Vue 3 v-model for two-way content binding.

The Editor component SHALL accept optional `fontFamily` (string), `codeFontFamily` (string), `fontSize` (number, in px), and `contentMaxWidth` (number, in px) props. These props SHALL be converted to CSS variables (`--una-font-family`, `--una-code-font-family`, `--una-font-size`, `--una-content-max-width`) on the editor container element.

External `modelValue` updates MUST be applied to the mounted editor instance without recreating the editor runtime. In this refactor phase, the synchronization strategy MAY continue using whole-document replacement, but it MUST preserve the mounted editor instance and current runtime configuration.

#### Scenario: External content update

- **WHEN** parent component updates the v-model value
- **THEN** the editor content SHALL update to reflect the new value
- **AND** the mounted editor instance SHALL be preserved

#### Scenario: Internal content edit

- **WHEN** user types in the editor
- **THEN** the v-model value SHALL update with the new content
- **AND** the update:modelValue event SHALL be emitted

### Requirement: Image drag and paste handling

The Editor component SHALL handle image drag and paste events. In this refactor phase, the public compatibility surface SHALL remain the `drop` event for both input sources, even if the internal runtime distinguishes drag and paste as separate source kinds.

#### Scenario: Image drag and drop

- **WHEN** user drags an image file and drops it on the editor
- **THEN** the `drop` event SHALL be emitted with the image file
- **AND** the default browser behavior SHALL be prevented

#### Scenario: Image paste

- **WHEN** user pastes an image from clipboard
- **THEN** the `drop` event SHALL be emitted with the image file
- **AND** the default browser behavior SHALL be prevented

### Requirement: Editor state control

The Editor component SHALL support placeholder, disabled, and readonly states. `disabled` and `readonly` MUST remain distinct semantic states. `disabled` represents a non-interactive editing surface for user-initiated editing operations. `readonly` represents a focusable and selectable surface that prevents document mutation while preserving non-mutating interactions.

#### Scenario: Placeholder text

- **WHEN** editor is empty and placeholder prop is set
- **THEN** the placeholder text SHALL be displayed in the editor

#### Scenario: Disabled state

- **WHEN** disabled prop is true
- **THEN** the editor SHALL reject user-initiated content mutation
- **AND** user SHALL NOT be able to trigger drag/paste file intake through normal editor interaction
- **AND** content-changing events SHALL NOT be emitted from blocked user input

#### Scenario: Readonly state

- **WHEN** readonly prop is true and disabled prop is false
- **THEN** the editor SHALL display content but prevent editing
- **AND** user SHALL be able to focus, select, and copy text
- **AND** non-mutating component methods SHALL remain available

#### Scenario: Disabled takes precedence over readonly

- **WHEN** disabled prop is true and readonly prop is also true
- **THEN** the editor SHALL follow disabled semantics for user interaction
- **AND** the component SHALL NOT downgrade to readonly-only behavior
