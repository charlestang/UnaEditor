## MODIFIED Requirements

### Requirement: Expose Internal EditorView

The editor component SHALL expose a method `getEditorView()` that returns the underlying CodeMirror `EditorView` instance, or `undefined` if it is not yet initialized. During this refactor, `getEditorView()` MUST remain available as an advanced compatibility escape hatch. Standard editor integrations SHALL continue to rely on the component's stable high-level methods rather than requiring direct `EditorView` access.

#### Scenario: Developer needs full CM6 access

- **WHEN** a developer calls `editorRef.value.getEditorView()`
- **THEN** they receive the actual CodeMirror `EditorView` instance currently mounted to the DOM

#### Scenario: Developer uses stable high-level commands without EditorView access

- **WHEN** a developer calls exposed component methods such as `focus()`, `insertText()`, `getHeadings()`, `scrollToLine()`, `undoHistory()` or `redoHistory()`
- **THEN** these capabilities SHALL work without requiring a direct call to `getEditorView()`
