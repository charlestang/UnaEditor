# Una Editor API Reference

[English](./api.en.md) | [简体中文](./api.md)

This document lists the properties, events, and exposed methods provided by the `UnaEditor` component.

## Properties (Props)

| Property                 | Type                      | Default   | Description                                                                                                                                                                                                        |
| ------------------------ | ------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `modelValue` / `v-model` | `string`                  | `''`      | The content of the editor.                                                                                                                                                                                         |
| `livePreview`            | `boolean`                 | `false`   | Whether to enable hybrid rendering mode. Provides a WYSIWYG experience for headings, emphasis, links, images, task lists, structured tables, and more.                                                             |
| `vimMode`                | `boolean`                 | `false`   | Whether to enable Vim keymap mode. Supports classic Vim modal editing (`Mod-s` is still available).                                                                                                                |
| `lineNumbers`            | `boolean`                 | `true`    | Whether to show line numbers.                                                                                                                                                                                      |
| `lineWrap`               | `boolean`                 | `true`    | Whether to enable line wrapping.                                                                                                                                                                                   |
| `theme`                  | `'light' \| 'dark'`       | `'light'` | Editor theme.                                                                                                                                                                                                      |
| `locale`                 | `string \| CustomLocale`  | `'zh-CN'` | Language setting. Supports `'zh-CN'`, `'en-US'`, or a custom locale object.                                                                                                                                        |
| `placeholder`            | `string`                  | —         | Placeholder text.                                                                                                                                                                                                  |
| `disabled`               | `boolean`                 | —         | Disables user-initiated editing and image drag/paste intake. External `modelValue` updates still sync into the mounted instance.                                                                                   |
| `readonly`               | `boolean`                 | —         | Makes the editor read-only while preserving focus, selection, copy, and other non-mutating interactions.                                                                                                           |
| `fontFamily`             | `string`                  | —         | Custom font family for the editor.                                                                                                                                                                                 |
| `codeFontFamily`         | `string`                  | —         | Custom font family for code.                                                                                                                                                                                       |
| `fontSize`               | `number`                  | —         | Font size in pixels.                                                                                                                                                                                               |
| `contentMaxWidth`        | `number`                  | `720`     | Maximum width of the prose content column in pixels. It constrains body content, images, tables, and code blocks, but does not include the left line-number gutter.                                                |
| `renderHooks`            | `RenderHooks`             | —         | Live-preview-only render hooks for synchronously transforming image URLs, exposing resolved link targets, and injecting custom classes, `data-*` attributes, and inline styles.                                    |
| `codeTheme`              | `'auto' \| CodeThemeName` | `'auto'`  | Code block color scheme. `'auto'` follows editor theme. Options: `'one-dark'`, `'dracula'`, `'monokai'`, `'solarized-dark'`, `'nord'`, `'tokyo-night'`, `'github-light'`, `'solarized-light'`, `'atom-one-light'`. |
| `codeLineNumbers`        | `boolean`                 | `false`   | Whether to show line numbers in code blocks.                                                                                                                                                                       |

### `contentMaxWidth`

- Defaults to `720`
- The value only measures the prose content column, not the left line-number gutter
- When the host container is narrower than this value, the content column shrinks automatically instead of creating extra horizontal scrolling
- Images, structured tables, and code blocks follow the same shared content-column width constraint

## `renderHooks`

`renderHooks` provides a lightweight customization point during `livePreview` rendering. It never mutates the underlying Markdown source. Instead, it adjusts the rendered URL and DOM metadata for the currently visible content.

### Image proxy example

```ts
const renderHooks = {
  image: ({ src }) => ({
    src: `https://img-proxy.example.com/?url=${encodeURIComponent(src)}`,
    dataset: {
      assetKind: 'proxy-image',
    },
    className: 'is-proxied-image',
  }),
};
```

### Link classification example

```ts
const renderHooks = {
  link: ({ href }) => ({
    href: href.startsWith('./') ? `/resolved${href}` : href,
    dataset: {
      linkKind: /^https?:\/\//.test(href) ? 'external' : 'internal',
    },
    className: /^https?:\/\//.test(href) ? 'is-external-link' : 'is-internal-link',
  }),
};
```

### Runtime semantics

- Hooks are only invoked when `livePreview` is `true`.
- Updating the `renderHooks` prop at runtime triggers a re-render of the visible region.
- For links, the transformed target is exposed through a stable DOM attribute such as `data-href`; this reserved field cannot be overwritten by user-provided `dataset` values.
- Hooks cannot change the visible link label, and the editor still falls back to raw Markdown source when the cursor enters a link or image.

### Performance guidance

- Hooks must stay synchronous, fast, and pure.
- Do not perform network requests inside hooks.
- If path resolution or classification is expensive in your app, cache those results outside the editor.

## Events

| Event Name          | Callback Parameters | Description                                                                                                                    |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `update:modelValue` | `(value: string)`   | Triggered when the editor content changes, used for two-way binding with `v-model`.                                            |
| `change`            | `(value: string)`   | Triggered after the editor document actually changes.                                                                          |
| `save`              | `()`                | Triggered when the user invokes the save shortcut such as `Mod-s`.                                                             |
| `focus`             | `()`                | Triggered when the editor receives focus.                                                                                      |
| `blur`              | `()`                | Triggered when the editor loses focus.                                                                                         |
| `drop`              | `(files: File[])`   | Triggered when image files are dropped or pasted into the editor. It remains the compatibility event surface for both sources. |

<!-- More events can be added here later, such as focus, blur, change, etc. -->

## Methods & Expose / Refs

If you need to call the editor's built-in methods externally, you can add a `ref` to the component to get the instance object and call its exposed API.

| Method Name        | Type/Signature                                               | Description                                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `focus`            | `() => void`                                                 | Focuses the editor.                                                                                                                                                                                                    |
| `getSelection`     | `() => string`                                               | Gets the currently selected text. Returns an empty string if nothing is selected.                                                                                                                                      |
| `insertText`       | `(text: string) => void`                                     | Inserts text at the current cursor position. If a selection exists, it will be replaced. The cursor is moved to the end of the inserted text. The method becomes a no-op when the editor is `readonly` or `disabled`.  |
| `getHeadings`      | `() => Array<{ text: string, level: number, line: number }>` | Extracts all Markdown headings from the document using internal AST parsing. Returns an array containing the text, level, and line number of each heading, perfect for building a Table of Contents (TOC).             |
| `scrollToLine`     | `(lineNumber: number) => void`                               | Smoothly scrolls the editor viewport so that the specified 1-based line number becomes visible.                                                                                                                        |
| `undoHistory`      | `() => boolean`                                              | Performs one undo step; returns `false` when there is no undo history available, or when the editor is `readonly` / `disabled`.                                                                                        |
| `redoHistory`      | `() => boolean`                                              | Performs one redo step; returns `false` when there is no redo history available, or when the editor is `readonly` / `disabled`.                                                                                        |
| `toggleFullscreen` | `(mode?: 'browser' \| 'screen') => void`                     | Toggles fullscreen mode (supports filling the browser viewport or the entire screen via native API).                                                                                                                   |
| `exitFullscreen`   | `() => void`                                                 | Exits fullscreen mode.                                                                                                                                                                                                 |
| `getEditorView`    | `() => EditorView \| undefined`                              | [Advanced compatibility API] Gets the underlying CodeMirror 6 `EditorView` instance. Prefer the component's stable high-level methods for standard integrations. Direct document mutations may desync Vue's `v-model`. |
