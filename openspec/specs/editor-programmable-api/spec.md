# editor-programmable-api

## Purpose
TBD

## Requirements

### Requirement: Expose Internal EditorView
The editor component SHALL expose a method `getEditorView()` that returns the underlying CodeMirror `EditorView` instance, or `undefined` if it is not yet initialized.

#### Scenario: Developer needs full CM6 access
- **WHEN** a developer calls `editorRef.value.getEditorView()`
- **THEN** they receive the actual CodeMirror `EditorView` instance currently mounted to the DOM

### Requirement: Insert Text Programmatically
The editor component SHALL expose a method `insertText(text: string)` that allows developers to programmatically insert text. If a selection exists, it MUST be replaced; otherwise, the text MUST be inserted at the current cursor position. The cursor MUST be moved to the end of the newly inserted text.

#### Scenario: Developer inserts text without selection
- **WHEN** there is no active selection and `insertText('hello')` is called
- **THEN** 'hello' is inserted at the cursor, and the cursor is placed after 'o'

#### Scenario: Developer replaces selected text
- **WHEN** the word 'world' is selected and `insertText('there')` is called
- **THEN** 'world' is replaced by 'there', and the selection is cleared with the cursor placed after 'e'

### Requirement: Extract Document Headings
The editor component SHALL expose a method `getHeadings()` that returns an array of objects representing the Markdown headings in the document. Each object MUST contain `text` (string), `level` (number 1-6), and `line` (number).

#### Scenario: Developer generates a TOC
- **WHEN** the document contains `# Title` on line 1 and `## Subtitle` on line 5
- **THEN** calling `getHeadings()` returns `[{ text: 'Title', level: 1, line: 1 }, { text: 'Subtitle', level: 2, line: 5 }]`

### Requirement: Scroll to Line Programmatically
The editor component SHALL expose a method `scrollToLine(lineNumber: number)` that smoothly scrolls the editor viewport so that the specified 1-based line number becomes visible at or near the top of the viewport.

#### Scenario: Developer navigates from TOC to content
- **WHEN** a developer calls `scrollToLine(50)`
- **THEN** the editor's scroll position adjusts to bring line 50 into the visible area
