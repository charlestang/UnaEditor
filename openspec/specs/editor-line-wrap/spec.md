## ADDED Requirements

### Requirement: configurable line wrapping

The `UnaEditor` component SHALL accept a boolean prop `lineWrap` to control the text wrapping behavior.

#### Scenario: Line wrap is enabled (default)

- **WHEN** the `UnaEditor` component is rendered without explicitly specifying the `lineWrap` prop, or when `lineWrap` is true
- **THEN** long lines of text in the editor SHALL wrap automatically to fit the width of the editor container, without displaying a horizontal scrollbar.

#### Scenario: Line wrap is disabled

- **WHEN** the `UnaEditor` component is rendered with the `lineWrap` prop explicitly set to false
- **THEN** long lines of text in the editor SHALL NOT wrap, and a horizontal scrollbar SHALL be displayed when text exceeds the container width.

#### Scenario: Dynamic toggling of line wrap

- **WHEN** the value of the `lineWrap` prop changes dynamically during the component's lifecycle
- **THEN** the editor SHALL immediately update its line wrapping behavior to reflect the new prop value without requiring a full re-render or losing editor state.
