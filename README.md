# Una Editor

[English](./README.en.md) | [简体中文](./README.md)

[![npm version](https://img.shields.io/npm/v/una-editor.svg?color=blue)](https://www.npmjs.com/package/una-editor)
[![license](https://img.shields.io/github/license/charlestang/UnaEditor)](https://github.com/charlestang/UnaEditor/blob/main/LICENSE)
[![Vue](https://img.shields.io/badge/Vue.js-35495E?logo=vue.js&logoColor=4FC08D)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![CodeMirror](https://img.shields.io/badge/CodeMirror-C53929?logo=codemirror&logoColor=white)](https://codemirror.net/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/charlestang/UnaEditor/pulls)

基于 CodeMirror 6 构建的轻量级、高性能 Vue 3 编辑器组件库。

[**在线演示 (Live Demo) 🚀**](https://charlestang.github.io/UnaEditor/)

## ✨ 特性

- 🚀 **基于 CodeMirror 6**：提供强大的底层编辑能力与优异的性能。
- 🎨 **Vue 3 友好**：完全基于 Composition API 构建，完美契合 Vue 生态。
- 💪 **类型安全**：100% TypeScript 编写，提供完整的类型推导。
- ⚡️ **Vite 驱动**：极速的本地开发与构建体验。
- 📝 **Hybrid Markdown 渲染**：可选的混合渲染模式，在编辑态即可获得标题、强调、图片、任务列表、结构化表格等元素的即时预览。
- 🧩 **结构化表格编辑**：在 `livePreview` 下支持结构化表格渲染、单元格编辑、行列 handle、追加与删除等交互。
- ⌨️ **Vim 模式支持**：内置经典的 Vim 模态编辑与键位绑定。
- 🎨 **代码块语法高亮**：内置多语言语法高亮，支持 9 套配色方案和可选行号。
- 📦 **双格式输出**：同时支持 ESM 和 CommonJS。

## 📦 安装

使用 pnpm (推荐):

```bash
pnpm add una-editor
```

或使用 npm / yarn:

```bash
npm install una-editor
# 或
yarn add una-editor
```

## 🚀 快速开始

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { UnaEditor } from 'una-editor';

const content = ref('# Hello Una Editor!');
</script>

<template>
  <UnaEditor v-model="content" :live-preview="true" :vim-mode="false" />
</template>
```

## 🎨 代码块语法高亮

Una Editor 内置了代码块语法高亮功能，支持 9 套配色方案和可选的代码行号。

```vue
<UnaEditor
  v-model="content"
  code-theme="dracula"
  :code-line-numbers="true"
/>
```

### 支持的配色方案

| 深色主题 | 浅色主题 |
|---------|---------|
| `one-dark` (默认) | `github-light` (默认) |
| `dracula` | `solarized-light` |
| `monokai` | `atom-one-light` |
| `solarized-dark` | |
| `nord` | |
| `tokyo-night` | |

设置 `code-theme="auto"` 可自动跟随编辑器主题（`theme="dark"` 使用 `one-dark`，`theme="light"` 使用 `github-light`）。

### 支持的语言

**核心语言**（同步加载）：JavaScript/JS、TypeScript/TS、JSX、TSX、CSS、Shell/Bash

**扩展语言**（按需懒加载）：Python、PHP、Java、Go、Rust、C、C++

## 📖 API 文档

关于详细的组件属性 (Props)、事件 (Events)、对外暴露的方法 (Methods) 等内容，请查阅我们的 **[API 手册](./docs/api.md)**。

## 🛠️ 本地开发

克隆项目后，你可以通过以下命令在本地启动开发环境和 Playground：

```bash
# 安装依赖
pnpm install

# 启动本地开发与 Playground
pnpm dev
```

访问 `http://localhost:5173` 即可查看本地调试效果。

### 其他常用命令

- `pnpm build`: 构建生产包 (dist)
- `pnpm test`: 运行 Vitest 单元测试
- `pnpm lint`: 运行 ESLint 代码检查
- `pnpm format`: 运行 Prettier 格式化代码

## 📁 项目结构

```text
una-editor/
├── src/                    # 组件核心源码
├── playground/             # 本地调试演示环境 (Vite App)
├── docs/                   # 项目文档
├── test/                   # 测试文件
├── dist/                   # 构建输出目录
└── openspec/               # OpenSpec 变更与规范管理
```

## 🤝 参与贡献

欢迎提交 Pull Request 或开设 Issue 讨论新特性与 Bug。在提交代码前，请确保：

1. 运行 `pnpm lint` 和 `pnpm test` 通过所有检查。
2. 遵循现有的代码规范与 [Conventional Commits](https://www.conventionalcommits.org/) 提交信息格式。
3. 较大的功能变更，请先查阅 `openspec/` 目录下的设计规范流程。

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。
