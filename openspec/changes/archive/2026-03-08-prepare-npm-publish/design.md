## Context

Una Editor 是一个基于 Vite 库模式 (Library Mode) 构建的 Vue 3 组件。在本地开发中，我们使用了 pnpm workspace 并在 Playground 中直接引用了 `workspace:*`。但当我们将其发布到真实的 npm 仓库时，外部使用者需要通过标准的模块解析机制来寻找入口文件（包括 JS 和 `.d.ts` 类型文件）。当前的 `package.json` 中的 `exports` 和 `files` 配置需要经过最终的审查和调整，以确保发布包的体积最小化且引用路径正确。

## Goals / Non-Goals

**Goals:**

- 确保 `package.json` 中的元信息（author, repository, bugs 等）完整。
- 确保 `exports` 字段同时支持现代环境 (ESM) 和传统环境 (CJS)。
- 确保 TypeScript 使用者可以无缝获得基于 `dist/types` 目录下的 `.d.ts` 类型提示。
- 保证 `npm publish` 打包进的内容干净整洁（仅包含运行时必需代码和文档）。

**Non-Goals:**

- 改变现有的 Vite 构建逻辑或文件目录结构。
- 将 `vue` 等强相关生态打包进组件库内（它们必须保持为 `peerDependencies`）。

## Decisions

**1. 导出路径配置 (Exports Resolution)**

- **选择**: 使用基于 `exports` 字段的条件导出（Conditional Exports）。
- **原因**: 这是现代 Node.js 和打包工具（如 Webpack 5+, Vite）的首选方式，可以精准地为 `import` (ESM) 和 `require` (CJS) 分发不同的构建产物，同时指定 `types` 入口。

**2. 发布文件白名单 (Files Array)**

- **选择**: 在 `package.json` 的 `files` 数组中，严格限制为 `["dist"]`。
- **原因**: 根目录下的 `README.md` 和 `LICENSE` 会被 npm 自动包含。限制 `files` 可以防止 `src/`, `playground/`, `test/` 等开发资源被意外上传，从而缩减用户下载的包体积。

## Risks / Trade-offs

- **Risk**: 类型声明路径错误可能导致外部 TypeScript 项目在使用该组件库时报错 "Could not find a declaration file for module 'una-editor'"。
  - **Mitigation**: 仔细核对构建生成的 `dist/types` 目录结构，并利用 `npm pack` 解压检查。
