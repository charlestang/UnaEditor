# Una Editor API Reference

[English](./api.en.md) | [简体中文](./api.md)

This document lists the properties, events, and exposed methods provided by the `UnaEditor` component.

## Properties (Props)

| Property                 | Type      | Default | Description                                                                                                |
| ------------------------ | --------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `modelValue` / `v-model` | `string`  | `''`    | The content of the editor.                                                                                 |
| `hybridMarkdown`         | `boolean` | `false` | Whether to enable hybrid rendering mode. Provides a WYSIWYG experience for headings, emphasis, links, etc. |
| `vimMode`                | `boolean` | `false` | Whether to enable Vim keymap mode. Supports classic Vim modal editing (`Mod-s` is still available).        |

## Events

| Event Name          | Callback Parameters | Description                                                                         |
| ------------------- | ------------------- | ----------------------------------------------------------------------------------- |
| `update:modelValue` | `(value: string)`   | Triggered when the editor content changes, used for two-way binding with `v-model`. |

<!-- More events can be added here later, such as focus, blur, change, etc. -->

## Methods & Expose / Refs

If you need to call the editor's built-in methods externally, you can add a `ref` to the component to get the instance object and call its exposed API (e.g., getting the internal editor instance, executing specific commands, etc.).

_(To be completed - Add based on the specific methods exposed by the component)_

<!--
Example:
| Property/Method Name | Type/Signature | Description |
| --- | --- | --- |
| `focus` | `() => void` | Focuses the editor |
| `getEditorView` | `() => EditorView` | Gets the underlying CodeMirror instance |
-->
