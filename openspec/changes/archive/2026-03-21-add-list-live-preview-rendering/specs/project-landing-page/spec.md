## MODIFIED Requirements

### Requirement: Interactive Demo

The landing page SHALL include an interactive demonstration of the `UnaEditor` component. This demo SHALL prioritize presentation quality and first impression, showing the editor in a well-tuned state with curated sample content that highlights rich Markdown rendering quality. The landing page demo MUST keep its controls intentionally minimal, limited to high-value appearance options such as editor theme and code theme.

#### Scenario: User interacts with the landing page demo

- **WHEN** the user interacts with the editor in the Demo section
- **THEN** the editor responds normally while presenting a curated showcase of rich Markdown rendering
- **AND** the available controls SHALL stay limited to a minimal set suitable for a product showcase rather than a full testing console

#### Scenario: User switches showcase themes

- **WHEN** the user changes the editor theme or code theme in the landing page demo
- **THEN** the demo SHALL update its visible presentation accordingly
- **AND** switching to light theme SHALL present the editor on a visually coherent light surface rather than leaving the showcase container in a dark appearance

### Requirement: Multi-language Support

The landing page SHALL support switching between English and Simplified Chinese via an i18n mechanism. All translatable interface text within the landing page, including the interactive demo controls, SHALL update immediately to the selected language without a full page reload.

#### Scenario: User switches language

- **WHEN** the user clicks the language toggle button in the header
- **THEN** the interface text updates immediately to the selected language without a full page reload
- **AND** the interactive demo control labels SHALL stay consistent with the selected language
