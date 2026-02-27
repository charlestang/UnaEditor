## Why

需要为 HexoPress 项目开发一个现代化的编辑器组件，基于 CodeMirror 6 构建并封装为 Vue 3 组件。当前项目是空白状态，需要搭建一个完整的、可维护的项目脚手架，包含开发、测试、文档和构建的完整工具链，以支持后续的组件开发和开源发布。

## What Changes

- 创建标准化的项目目录结构（src/, playground/, docs/, test/）
- 配置现代化的构建工具链（Vite 7 + TypeScript 5.9）
- 设置 pnpm workspace 以支持 playground 本地调试
- 配置代码质量工具（ESLint + Prettier）
- 配置测试框架（Vitest）
- 配置 npm 包构建输出（ESM + CommonJS）
- 创建基础的 package.json 和配置文件
- 设置 TypeScript 编译配置

## Capabilities

### New Capabilities

- `project-scaffold`: 项目脚手架的完整结构，包括目录布局、构建配置、开发工具链、测试环境和包分发配置

### Modified Capabilities

无

## Impact

- 这是一个全新的项目，不影响现有代码
- 会创建完整的项目文件结构和配置文件
- 会初始化 pnpm workspace
- 会安装项目依赖（Vue, Vite, TypeScript, CodeMirror 等）
- 为后续的 Editor 和 Preview 组件开发奠定基础
