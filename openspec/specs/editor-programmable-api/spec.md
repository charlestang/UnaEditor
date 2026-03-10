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
The editor component SHALL expose a method `scrollToLine(lineNumber: number)` that scrolls the editor viewport so that the specified 1-based line number is positioned at the top of the viewport with minimal top margin. The method MUST respect the editor's current focus state and MUST NOT change it.

#### Scenario: Developer navigates from TOC to content
- **WHEN** a developer calls `scrollToLine(50)`
- **THEN** the editor's scroll position adjusts to bring line 50 to the top of the viewport with 5px top margin

#### Scenario: Scroll to line with editor focused
- **GIVEN** the editor has focus and the cursor is on line 20
- **WHEN** `scrollToLine(5)` is called
- **THEN** the viewport scrolls so line 5 appears at the top with 5px margin
- **AND** the cursor moves to the beginning of line 5
- **AND** the editor remains focused

#### Scenario: Scroll to line with editor not focused
- **GIVEN** the editor does not have focus
- **WHEN** `scrollToLine(5)` is called
- **THEN** the viewport scrolls so line 5 appears at the top with 5px margin
- **AND** the cursor position does not change
- **AND** the editor does not gain focus

#### Scenario: Scroll to line in Hybrid Markdown mode
- **GIVEN** the editor is in Hybrid Markdown mode with a large heading on line 1
- **WHEN** `scrollToLine(1)` is called
- **THEN** line 1 is positioned at the top with 5px margin
- **AND** the line number "1" in the gutter aligns with the top of the heading
- **AND** the entire heading is visible in the viewport

#### Scenario: Scroll to line number out of bounds
- **GIVEN** the document has 100 lines
- **WHEN** `scrollToLine(0)` is called
- **THEN** the viewport scrolls to line 1
- **WHEN** `scrollToLine(150)` is called
- **THEN** the viewport scrolls to line 100

#### Scenario: Scroll to last line when viewport is larger than remaining content
- **GIVEN** the document has 10 lines and the viewport can display 15 lines
- **WHEN** `scrollToLine(10)` is called
- **THEN** the viewport scrolls as far as possible to bring line 10 toward the top
- **AND** the behavior degrades gracefully without error
