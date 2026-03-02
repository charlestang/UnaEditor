## ADDED Requirements

### Requirement: Editor supports switching between standard and Vim keybinding modes
The editor SHALL support two keybinding modes: standard and Vim. When Vim mode is disabled or unspecified, the editor MUST use the existing standard editing behavior. When Vim mode is enabled, the editor MUST activate Vim keybinding behavior for the focused editor instance.

#### Scenario: Standard mode by default
- **WHEN** the caller does not enable Vim mode
- **THEN** the editor uses the existing standard editing behavior
- **AND** the editor does not activate Vim keybindings

#### Scenario: Enable Vim mode
- **WHEN** the caller enables Vim mode
- **THEN** the editor activates Vim keybinding behavior for that editor instance
- **AND** the editor no longer uses standard text-input behavior as the active editing mode

### Requirement: Vim mode starts in non-insert modal editing behavior
When Vim mode is active, the editor SHALL use classic Vim modal behavior. The editor MUST treat normal mode as the default interaction state, so movement keys can be used without inserting text until the user explicitly enters insert mode.

#### Scenario: Typing in normal mode
- **WHEN** Vim mode is active and the user has not entered insert mode
- **THEN** ordinary character keys SHALL be interpreted according to Vim normal mode behavior
- **AND** the editor SHALL NOT insert typed characters as plain text by default

#### Scenario: Enter insert mode
- **WHEN** Vim mode is active and the user issues an insert command such as `i` or `a`
- **THEN** the editor enters insert mode
- **AND** subsequent text input SHALL insert content until the user exits insert mode

### Requirement: Arrow key navigation remains available in Vim mode
When Vim mode is active, the editor SHALL continue to allow arrow-key navigation so existing cursor movement expectations remain usable alongside Vim commands.

#### Scenario: Move with arrow keys in Vim mode
- **WHEN** Vim mode is active and the user presses an arrow key
- **THEN** the editor moves the cursor according to the current editor navigation rules
- **AND** the key press SHALL NOT be treated as text insertion

### Requirement: Save shortcut remains available when Vim mode is active
When Vim mode is active, the editor SHALL preserve the existing `Mod-s` save shortcut. Vim mode MUST NOT block the editor from emitting the save event when the user triggers the save shortcut while the editor is focused.

#### Scenario: Save shortcut in Vim insert mode
- **WHEN** Vim mode is active, the editor is focused, and the user presses `Mod-s` while in insert mode
- **THEN** the editor SHALL emit the save event
- **AND** the browser default save behavior SHALL remain prevented

#### Scenario: Save shortcut in Vim normal mode
- **WHEN** Vim mode is active, the editor is focused, and the user presses `Mod-s` while in normal mode
- **THEN** the editor SHALL emit the save event
- **AND** the browser default save behavior SHALL remain prevented
