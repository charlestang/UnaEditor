# Una Editor API 手册

[English](./api.en.md) | [简体中文](./api.md)

本文档列出了 `UnaEditor` 组件提供的各项属性、事件以及对外暴露的方法。

## 属性 (Props)

| 属性名                   | 类型      | 默认值  | 说明                                                                     |
| ------------------------ | --------- | ------- | ------------------------------------------------------------------------ |
| `modelValue` / `v-model` | `string`  | `''`    | 编辑器内容                                                               |
| `hybridMarkdown`         | `boolean` | `false` | 是否开启混合渲染模式。开启后会对标题、强调、链接等提供所见即所得的体验。 |
| `vimMode`                | `boolean` | `false` | 是否开启 Vim 键位模式。支持经典 Vim 模态编辑 (`Mod-s` 仍可用)。          |

## 事件 (Events)

| 事件名              | 回调参数          | 说明                                                  |
| ------------------- | ----------------- | ----------------------------------------------------- |
| `update:modelValue` | `(value: string)` | 编辑器内容发生改变时触发，用于 `v-model` 的双向绑定。 |

<!-- 后续可在此添加更多事件的说明，如 focus, blur, change 等 -->

## 方法 (Methods) & 实例引用 (Refs)

如果需要在外部调用编辑器内置的方法，可以通过给组件添加 `ref` 来获取实例对象，调用其对外暴露的 API。

| 方法名 | 类型/签名 | 说明 |
| --- | --- | --- |
| `focus` | `() => void` | 使编辑器获得焦点。 |
| `getSelection` | `() => string` | 获取当前选中的文本内容。如果未选中，返回空字符串。 |
| `insertText` | `(text: string) => void` | 在当前光标位置插入文本。如果当前存在选区，选区内容将被替换。插入后光标会自动移动到文本末尾。 |
| `getHeadings` | `() => Array<{ text: string, level: number, line: number }>` | 利用内部 AST 解析提取文档中所有的 Markdown 标题，返回包含文本、层级和所在行号的数组，非常适合用于构建文章大纲 (TOC)。 |
| `scrollToLine` | `(lineNumber: number) => void` | 平滑滚动编辑器视图，使得指定的行号 (1-based) 滚动到可见区域。 |
| `toggleFullscreen` | `(mode?: 'browser' \| 'screen') => void` | 切换全屏模式（支持填满浏览器窗口，或通过原生 API 填满整个屏幕）。 |
| `exitFullscreen` | `() => void` | 退出全屏状态。 |
| `getEditorView` | `() => EditorView \| undefined` | 【高级接口】获取底层的 CodeMirror 6 `EditorView` 实例对象。可用于进行深度的自定义扩展（注意：直接修改文档可能导致 Vue 的 `v-model` 状态不同步）。 |
