# Capability: playground-sandbox

## Purpose

TBD

## Requirements

### Requirement: Sandbox Routing

The application SHALL provide a pure development sandbox accessible at the `/sandbox` route (or equivalent development route).

#### Scenario: Developer visits the sandbox URL

- **WHEN** the developer navigates to the `/sandbox` URL
- **THEN** the application displays the Sandbox view without landing page styles interfering

### Requirement: Sandbox Isolation

The sandbox view SHALL contain the original raw `UnaEditor` playground components, isolated from the global styling or layout of the landing page.

#### Scenario: Developer tests editor features

- **WHEN** the developer uses the editor in the sandbox view
- **THEN** they can test the component exactly as they did before the introduction of the landing page

### Requirement: Default Local Development Routing

The local development server (`pnpm dev`) SHOULD allow developers to easily access the sandbox for iteration.

#### Scenario: Developer starts the dev server

- **WHEN** the developer runs `pnpm dev`
- **THEN** they can navigate to `/sandbox` to continue component development uninterrupted
