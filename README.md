# Una Editor

基于 CodeMirror 6 的 Vue 3 编辑器组件库。

## 特性

- 🚀 基于 CodeMirror 6 构建
- 💪 TypeScript 支持
- ⚡️ Vite 驱动
- 🎨 Vue 3 Composition API
- 📦 ESM 和 CommonJS 双格式输出
- 🧪 Vitest 测试框架
- 🔍 ESLint + Prettier 代码质量保证

## 安装

```bash
pnpm add una-editor
```

## 使用

```vue
<script setup lang="ts">
import { UnaEditor } from 'una-editor';
</script>

<template>
  <UnaEditor />
</template>
```

## 开发

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

### 测试

```bash
pnpm test
```

### 代码检查

```bash
pnpm lint
```

### 代码格式化

```bash
pnpm format
```

## Playground

本项目包含一个 playground 用于本地调试：

```bash
cd playground
pnpm dev
```

访问 http://localhost:5173 查看效果。

## 项目结构

```
una-editor/
├── src/                    # 组件源码
├── playground/            # 本地调试环境
├── docs/                  # 文档
├── test/                  # 测试文件
├── dist/                  # 构建输出
└── openspec/              # OpenSpec 变更管理
```

## 技术栈

- Vue 3.5.25+
- TypeScript 5.9.3+
- Vite 7.3.1+
- Vitest 4.0+
- ESLint 10.0+
- Prettier 3.8+

## License

MIT
