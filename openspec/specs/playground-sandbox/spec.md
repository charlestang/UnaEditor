# Capability: playground-sandbox

## Purpose

Define a dedicated local sandbox route for regression testing and exploratory editor development without landing-page presentation constraints.

## Requirements

### Requirement: Sandbox Routing

The application SHALL provide a pure development sandbox accessible at the `/sandbox` route (or equivalent development route).

#### Scenario: Developer visits the sandbox URL

- **WHEN** the developer navigates to the `/sandbox` URL
- **THEN** the application displays the Sandbox view without landing page styles interfering

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

#### Scenario: Developer validates transaction-sensitive editor behavior in sandbox

- **WHEN** the developer validates transaction-sensitive interactions such as structured-table editing in `/sandbox`
- **THEN** the sandbox SHALL provide explicit undo and redo entry points for the current editor instance instead of relying on a single platform shortcut path
- **AND** those entry points SHALL allow continued manual regression testing without forcing the developer to leave the current validation context

### Requirement: Default Local Development Routing

The local development server (`pnpm dev`) SHALL allow developers to easily access the sandbox for iteration.

#### Scenario: Developer starts the dev server

- **WHEN** the developer runs `pnpm dev`
- **THEN** they can navigate to `/sandbox` to continue component development uninterrupted
