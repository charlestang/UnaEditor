## MODIFIED Requirements

### Requirement: Theme support

The Editor component SHALL support light and dark preset themes, and SHALL also support custom theme override objects.

#### Scenario: Light preset theme

- **WHEN** `theme` prop is set to `'light'` or omitted
- **THEN** the editor SHALL display with the light preset theme

#### Scenario: Dark preset theme

- **WHEN** `theme` prop is set to `'dark'`
- **THEN** the editor SHALL display with the dark preset theme

#### Scenario: Custom theme override object

- **WHEN** `theme` prop is set to a custom theme object with `type: 'dark'`
- **THEN** the editor SHALL resolve it against the dark preset theme
- **AND** the editor SHALL apply the resolved result without recreating the editor instance
