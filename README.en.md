# Una Editor

[English](./README.en.md) | [简体中文](./README.md)

[![npm version](https://img.shields.io/npm/v/una-editor.svg?color=blue)](https://www.npmjs.com/package/una-editor)
[![license](https://img.shields.io/github/license/charlestang/UnaEditor)](https://github.com/charlestang/UnaEditor/blob/main/LICENSE)
[![Vue](https://img.shields.io/badge/Vue.js-35495E?logo=vue.js&logoColor=4FC08D)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![CodeMirror](https://img.shields.io/badge/CodeMirror-C53929?logo=codemirror&logoColor=white)](https://codemirror.net/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/charlestang/UnaEditor/pulls)

A lightweight, high-performance Vue 3 editor component library based on CodeMirror 6.

[**Live Demo 🚀**](https://charlestang.github.io/UnaEditor/)

## ✨ Features

- 🚀 **Powered by CodeMirror 6**: Provides robust foundational editing capabilities and excellent performance.
- 🎨 **Vue 3 Friendly**: Built entirely with the Composition API, perfectly fitting the Vue ecosystem.
- 💪 **Type Safe**: 100% written in TypeScript with complete type inference.
- ⚡️ **Vite Driven**: Lightning-fast local development and build experience.
- 📝 **Hybrid Markdown Rendering**: Optional hybrid rendering mode offering instant preview of headings, emphasis, code blocks, etc., within the editor.
- ⌨️ **Vim Mode Support**: Built-in classic Vim modal editing and keybindings.
- 📦 **Dual Output Formats**: Supports both ESM and CommonJS.

## 📦 Installation

Using pnpm (recommended):
```bash
pnpm add una-editor
```
Or using npm / yarn:
```bash
npm install una-editor
# or
yarn add una-editor
```

## 🚀 Quick Start

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { UnaEditor } from 'una-editor';

const content = ref('# Hello Una Editor!');
</script>

<template>
  <UnaEditor 
    v-model="content"
    :hybrid-markdown="true" 
    :vim-mode="false" 
  />
</template>
```

## 📖 API Documentation

For detailed information on component properties (Props), events (Events), exposed methods (Methods), etc., please refer to our **[API Reference](./docs/api.en.md)**.

## 🛠️ Local Development

After cloning the project, you can start the local development environment and Playground using the following commands:

```bash
# Install dependencies
pnpm install

# Start local development and Playground
pnpm dev
```
Visit `http://localhost:5173` to see the local debugging effect.

### Other Useful Commands

- `pnpm build`: Build production bundles (dist)
- `pnpm test`: Run Vitest unit tests
- `pnpm lint`: Run ESLint code checks
- `pnpm format`: Run Prettier code formatting

## 📁 Project Structure

```text
una-editor/
├── src/                    # Core component source code
├── playground/             # Local debugging environment (Vite App)
├── docs/                   # Project documentation
├── test/                   # Test files
├── dist/                   # Build output directory
└── openspec/               # OpenSpec change and specification management
```

## 🤝 Contributing

Pull Requests and Issues discussing new features or bugs are highly welcome. Before submitting code, please ensure:
1. All checks pass by running `pnpm lint` and `pnpm test`.
2. Follow existing code formatting and [Conventional Commits](https://www.conventionalcommits.org/) message formats.
3. For major feature changes, please refer to the design specification process in the `openspec/` directory first.

## 📄 License

This project is open-sourced under the [MIT License](./LICENSE).
