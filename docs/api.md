# Una Editor API 手册

[English](./api.en.md) | [简体中文](./api.md)

本文档列出了 `UnaEditor` 组件提供的各项属性、事件以及对外暴露的方法。

## 属性 (Props)

| 属性名                   | 类型      | 默认值  | 说明                                                                     |
| ------------------------ | --------- | ------- | ------------------------------------------------------------------------ |
| `modelValue` / `v-model` | `string`  | `''`    | 编辑器内容                                                               |
| `livePreview`            | `boolean` | `false` | 是否开启混合渲染模式。开启后会对标题、强调、链接、图片、任务列表、结构化表格等提供所见即所得的体验。 |
| `vimMode`                | `boolean` | `false` | 是否开启 Vim 键位模式。支持经典 Vim 模态编辑 (`Mod-s` 仍可用)。          |
| `lineNumbers`            | `boolean` | `true`  | 是否显示行号。                                                           |
| `lineWrap`               | `boolean` | `true`  | 是否自动换行。                                                           |
| `theme`                  | `'light' \| 'dark'` | `'light'` | 编辑器主题。                                                     |
| `locale`                 | `string \| CustomLocale` | `'zh-CN'` | 语言设置，支持 `'zh-CN'`、`'en-US'` 或自定义语言包。       |
| `placeholder`            | `string`  | —       | 占位符文本。                                                             |
| `disabled`               | `boolean` | —       | 是否禁用编辑。                                                           |
| `readonly`               | `boolean` | —       | 是否只读。                                                               |
| `fontFamily`             | `string`  | —       | 自定义编辑器字体族。                                                     |
| `codeFontFamily`         | `string`  | —       | 自定义代码字体族。                                                       |
| `fontSize`               | `number`  | —       | 字体大小（px）。                                                         |
| `renderHooks`            | `RenderHooks` | —   | 仅在 `livePreview` 下生效的渲染钩子，可同步改写图片地址、暴露链接目标，并注入自定义 `class`、`data-*` 属性和行内样式。 |
| `codeTheme`              | `'auto' \| CodeThemeName` | `'auto'` | 代码块配色方案。`'auto'` 自动跟随编辑器主题。可选值：`'one-dark'`、`'dracula'`、`'monokai'`、`'solarized-dark'`、`'nord'`、`'tokyo-night'`、`'github-light'`、`'solarized-light'`、`'atom-one-light'`。 |
| `codeLineNumbers`        | `boolean` | `false` | 是否在代码块中显示行号。                                                 |

## `renderHooks`

`renderHooks` 用于在 `livePreview` 渲染阶段对图片和链接做轻量定制。它是同步 API，不会修改底层 Markdown 文本，只影响当前可见的渲染结果和 DOM 元数据。

### 图片代理示例

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

### 链接分类示例

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

### 运行时语义

- `renderHooks` 只在 `livePreview` 为 `true` 时调用。
- 当 `renderHooks` prop 在组件运行时发生变化，编辑器会重新渲染可见区域。
- 对链接而言，变换后的目标地址会通过稳定的 DOM 属性暴露，例如 `data-href`；该系统保留字段不会被用户自定义 `dataset` 覆盖。
- hooks 不能修改链接的可见文本；当光标进入图片或链接时，编辑器仍会回退到原始 Markdown 源码态。

### 性能建议

- hooks 必须是同步、快速、纯函数。
- 不要在 hooks 中发起网络请求。
- 如果你的路径解析或分类逻辑本身较重，应在业务层自行缓存结果。

## 事件 (Events)

| 事件名              | 回调参数          | 说明                                                  |
| ------------------- | ----------------- | ----------------------------------------------------- |
| `update:modelValue` | `(value: string)` | 编辑器内容发生改变时触发，用于 `v-model` 的双向绑定。 |
| `change`            | `(value: string)` | 编辑器文档发生实际变更后触发。                        |
| `save`              | `()`              | 用户触发保存快捷键（如 `Mod-s`）时触发。              |
| `focus`             | `()`              | 编辑器获得焦点时触发。                                |
| `blur`              | `()`              | 编辑器失去焦点时触发。                                |
| `drop`              | `(files: File[])` | 拖拽或粘贴图片文件进入编辑器时触发。                  |

<!-- 后续可在此添加更多事件的说明，如 focus, blur, change 等 -->

## 方法 (Methods) & 实例引用 (Refs)

如果需要在外部调用编辑器内置的方法，可以通过给组件添加 `ref` 来获取实例对象，调用其对外暴露的 API。

| 方法名             | 类型/签名                                                    | 说明                                                                                                                                              |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `focus`            | `() => void`                                                 | 使编辑器获得焦点。                                                                                                                                |
| `getSelection`     | `() => string`                                               | 获取当前选中的文本内容。如果未选中，返回空字符串。                                                                                                |
| `insertText`       | `(text: string) => void`                                     | 在当前光标位置插入文本。如果当前存在选区，选区内容将被替换。插入后光标会自动移动到文本末尾。                                                      |
| `getHeadings`      | `() => Array<{ text: string, level: number, line: number }>` | 利用内部 AST 解析提取文档中所有的 Markdown 标题，返回包含文本、层级和所在行号的数组，非常适合用于构建文章大纲 (TOC)。                             |
| `scrollToLine`     | `(lineNumber: number) => void`                               | 平滑滚动编辑器视图，使得指定的行号 (1-based) 滚动到可见区域。                                                                                     |
| `undoHistory`      | `() => boolean`                                              | 执行一次撤销；若当前没有可撤销历史则返回 `false`。                                                                                                 |
| `redoHistory`      | `() => boolean`                                              | 执行一次重做；若当前没有可重做历史则返回 `false`。                                                                                                 |
| `toggleFullscreen` | `(mode?: 'browser' \| 'screen') => void`                     | 切换全屏模式（支持填满浏览器窗口，或通过原生 API 填满整个屏幕）。                                                                                 |
| `exitFullscreen`   | `() => void`                                                 | 退出全屏状态。                                                                                                                                    |
| `getEditorView`    | `() => EditorView \| undefined`                              | 【高级接口】获取底层的 CodeMirror 6 `EditorView` 实例对象。可用于进行深度的自定义扩展（注意：直接修改文档可能导致 Vue 的 `v-model` 状态不同步）。 |
