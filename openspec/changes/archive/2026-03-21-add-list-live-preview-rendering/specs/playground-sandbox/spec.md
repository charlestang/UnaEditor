## MODIFIED Requirements

### Requirement: Sandbox Isolation

The sandbox view SHALL contain the original raw `UnaEditor` playground components, isolated from the global styling or layout of the landing page. The sandbox SHALL prioritize regression testing and exploratory interaction, so it MUST expose a richer control surface and richer sample content than the landing page demo.

#### Scenario: Developer tests editor features

- **WHEN** the developer uses the editor in the sandbox view
- **THEN** they can test the component exactly as they did before the introduction of the landing page
- **AND** they SHALL have access to a broader set of configuration controls suitable for regression testing and feature exploration

#### Scenario: User explores syntax support in sandbox

- **WHEN** the sandbox view loads
- **THEN** its sample content SHALL include a richer mix of Markdown syntax and editor features than the landing page demo
- **AND** that content SHALL be suitable for manually validating rendering, interaction, and option combinations
