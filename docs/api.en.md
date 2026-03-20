# Una Editor API Reference

[English](./api.en.md) | [简体中文](./api.md)

This document lists the properties, events, and exposed methods provided by the `UnaEditor` component.

## Properties (Props)

| Property                 | Type      | Default | Description                                                                                                |
| ------------------------ | --------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `modelValue` / `v-model` | `string`  | `''`    | The content of the editor.                                                                                 |
| `livePreview`            | `boolean` | `false` | Whether to enable hybrid rendering mode. Provides a WYSIWYG experience for headings, emphasis, links, etc. |
| `vimMode`                | `boolean` | `false` | Whether to enable Vim keymap mode. Supports classic Vim modal editing (`Mod-s` is still available).        |
| `lineNumbers`            | `boolean` | `true`  | Whether to show line numbers.                                                                              |
| `lineWrap`               | `boolean` | `true`  | Whether to enable line wrapping.                                                                           |
| `theme`                  | `'light' \| 'dark'` | `'light'` | Editor theme.                                                                                      |
| `locale`                 | `string \| CustomLocale` | `'zh-CN'` | Language setting. Supports `'zh-CN'`, `'en-US'`, or a custom locale object.                   |
| `placeholder`            | `string`  | —       | Placeholder text.                                                                                          |
| `disabled`               | `boolean` | —       | Whether editing is disabled.                                                                               |
| `readonly`               | `boolean` | —       | Whether the editor is read-only.                                                                           |
| `fontFamily`             | `string`  | —       | Custom font family for the editor.                                                                         |
| `codeFontFamily`         | `string`  | —       | Custom font family for code.                                                                               |
| `fontSize`               | `number`  | —       | Font size in pixels.                                                                                       |
| `codeTheme`              | `'auto' \| CodeThemeName` | `'auto'` | Code block color scheme. `'auto'` follows editor theme. Options: `'one-dark'`, `'dracula'`, `'monokai'`, `'solarized-dark'`, `'nord'`, `'tokyo-night'`, `'github-light'`, `'solarized-light'`, `'atom-one-light'`. |
| `codeLineNumbers`        | `boolean` | `false` | Whether to show line numbers in code blocks.                                                               |

## Events

| Event Name          | Callback Parameters | Description                                                                         |
| ------------------- | ------------------- | ----------------------------------------------------------------------------------- |
| `update:modelValue` | `(value: string)`   | Triggered when the editor content changes, used for two-way binding with `v-model`. |

<!-- More events can be added here later, such as focus, blur, change, etc. -->

## Methods & Expose / Refs

If you need to call the editor's built-in methods externally, you can add a `ref` to the component to get the instance object and call its exposed API.

| Method Name        | Type/Signature                                               | Description                                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `focus`            | `() => void`                                                 | Focuses the editor.                                                                                                                                                                                        |
| `getSelection`     | `() => string`                                               | Gets the currently selected text. Returns an empty string if nothing is selected.                                                                                                                          |
| `insertText`       | `(text: string) => void`                                     | Inserts text at the current cursor position. If a selection exists, it will be replaced. The cursor is moved to the end of the inserted text.                                                              |
| `getHeadings`      | `() => Array<{ text: string, level: number, line: number }>` | Extracts all Markdown headings from the document using internal AST parsing. Returns an array containing the text, level, and line number of each heading, perfect for building a Table of Contents (TOC). |
| `scrollToLine`     | `(lineNumber: number) => void`                               | Smoothly scrolls the editor viewport so that the specified 1-based line number becomes visible.                                                                                                            |
| `toggleFullscreen` | `(mode?: 'browser' \| 'screen') => void`                     | Toggles fullscreen mode (supports filling the browser viewport or the entire screen via native API).                                                                                                       |
| `exitFullscreen`   | `() => void`                                                 | Exits fullscreen mode.                                                                                                                                                                                     |
| `getEditorView`    | `() => EditorView \| undefined`                              | [Advanced] Gets the underlying CodeMirror 6 `EditorView` instance. Can be used for deep custom extensions (Note: manipulating the document directly may cause Vue's `v-model` state to desync).            |
