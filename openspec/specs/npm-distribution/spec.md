# Capability: npm-distribution

## Purpose

TBD - Requirements for publishing and distributing the npm package.

## Requirements

### Requirement: Package Metadata completeness

The `package.json` file SHALL contain complete and accurate metadata for npm publishing, including `name`, `version`, `description`, `author`, `repository`, `bugs`, `keywords`, and `license`.

#### Scenario: User inspects the package on npm

- **WHEN** a user views the `una-editor` package on npmjs.com
- **THEN** they can see a clear description, author information, GitHub repository link, and issue tracker link

### Requirement: Module Exports Configuration

The package SHALL provide correct entry points for both ESM and CommonJS environments, along with TypeScript declarations, via the `exports` field in `package.json`.

#### Scenario: Consumer imports the component

- **WHEN** a consumer imports `UnaEditor` using `import { UnaEditor } from 'una-editor'` in a Vite or modern Webpack environment
- **THEN** the bundler resolves to the ESM build (`dist/index.mjs`)
- **WHEN** a consumer imports `UnaEditor` using `require('una-editor')` in a Node.js environment
- **THEN** the bundler resolves to the CommonJS build (`dist/index.cjs`)

### Requirement: TypeScript Support

The package SHALL expose its TypeScript declarations correctly so that editors and compilers can provide type checking and autocompletion.

#### Scenario: Consumer uses the package in a TypeScript project

- **WHEN** a consumer writes `import { UnaEditor } from 'una-editor'`
- **THEN** their IDE automatically loads the type definitions from `dist/types/index.d.ts`

### Requirement: Clean Publish Payload

The published npm package SHALL only contain files necessary for consuming the library.

#### Scenario: Running npm pack

- **WHEN** the `npm pack --dry-run` command is executed
- **THEN** the resulting archive contents only include `package.json`, `README.md`, `README.en.md`, `LICENSE`, and the contents of the `dist/` directory, omitting `src/`, `playground/`, `docs/`, `test/`, and `.github/`.
