## MODIFIED Requirements

### Requirement: Content editing with v-model binding

The Editor component SHALL support Vue 3 v-model for two-way content binding.

The Editor component SHALL accept optional `fontFamily` (string), `codeFontFamily` (string), `fontSize` (number, in px), and `contentMaxWidth` (number, in px) props. These props SHALL be converted to CSS variables (`--una-font-family`, `--una-code-font-family`, `--una-font-size`, `--una-content-max-width`) on the editor container element.

#### Scenario: External content update

- **WHEN** parent component updates the v-model value
- **THEN** the editor content SHALL update to reflect the new value

#### Scenario: Internal content edit

- **WHEN** user types in the editor
- **THEN** the v-model value SHALL update with the new content
- **AND** the update:modelValue event SHALL be emitted
