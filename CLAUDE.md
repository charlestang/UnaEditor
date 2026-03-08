# UnaEditor - Claude 协作指南

## 项目概述

这是一个基于 CodeMirror 6 的 Vue 3 编辑器组件库，封装为独立的 npm 包。

## 技术栈

- **Vue**: 3.5.25+ (Composition API)
- **TypeScript**: 5.9.3+ (严格模式)
- **构建工具**: Vite 7.3.1+
- **包管理器**: pnpm 10.30.3+
- **测试框架**: Vitest
- **代码质量**: ESLint + Prettier

## 项目结构

```
una-editor/
├── src/                    # 组件源码
│   └── index.ts           # 包入口
├── playground/            # 本地调试环境（独立 Vite 应用）
├── docs/                  # 文档（预留）
├── test/                  # 测试文件
├── dist/                  # 构建输出（ESM + CommonJS）
└── openspec/              # OpenSpec 变更管理
```

## 开发工作流

### 使用 OpenSpec 管理变更

本项目使用 OpenSpec 进行结构化的变更管理：

1. **创建新变更**: `/opsx:new <change-name>`
2. **继续变更**: `/opsx:continue` - 创建下一个 artifact
3. **实现变更**: `/opsx:apply` - 执行任务清单
4. **归档变更**: `/opsx:archive` - 完成后归档

### 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式（构建并监听）
pnpm dev

# 构建库
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# Playground 调试
cd playground && pnpm dev
```

## 编码规范与最佳实践

### TypeScript & Vue 组件

- **严格模式**: 不妥协的类型安全。所有导出的 API 必须有完整的类型定义。复杂组件的 Props 必须抽离到 `src/types/` 中。
- **Vue 3**: 强制使用 Composition API (`<script setup lang="ts">`)。
- **Emit 声明**: 必须使用基于类型的声明 (`defineEmits<{ 'event': [arg: type] }>`) 而非数组形式。
- **Setup 结构**: 维持严格的自上而下阅读顺序（imports -> macros -> refs -> composables -> methods -> expose）。
- **属性透传**: 对于包装器组件，务必考虑外部 `class` 和 `style` 的透传，必要时使用 `inheritAttrs: false` 并显式绑定。

### Composables (Hook) 设计

- **传参原则**: 传递组件 `props` 给 Composable 时，必须传递完整的 `props` 对象，**绝不能在外部解构后传递**，以防丢失响应式。
- **DOM 引用**: DOM ref 变量应以 `Ref` 或 `Container` 结尾，传递给 Composable 时类型必须为 `Ref<HTMLElement | undefined>`。
- **清理义务**: 任何在 `onMounted` 中初始化外部实例（如 CodeMirror）或绑定事件的 Composable，必须自觉实现 `onBeforeUnmount` 钩子进行垃圾回收。

### 命名风格

- **布尔值**: 必须以 `is`, `has`, `can`, `should` 开头。
- **事件处理函数**: 内部事件处理函数必须以 `handle` 前缀命名。

### 代码风格

- 遵循 ESLint 和 Prettier 配置
- 保持函数简短，单一职责
- 添加必要的注释，但代码应该自解释

## 构建和发布

### 构建输出

- **ESM**: `dist/index.mjs` - 现代模块格式
- **CommonJS**: `dist/index.cjs` - 兼容旧环境
- **类型声明**: `dist/types/*.d.ts` - TypeScript 类型

### 外部依赖

- `vue` 被标记为外部依赖（peerDependency）
- 使用者需要自行安装 Vue 3.5+

## Playground 使用

Playground 是一个独立的 Vite 应用，通过 `workspace:*` 引用主包：

- 支持热更新
- 真实模拟 npm 包使用场景
- 用于开发时快速验证组件功能

## 注意事项

### 不要做的事

- ❌ 不要修改 `dist/` 目录（自动生成）
- ❌ 不要提交 `node_modules/`
- ❌ 不要在主包中安装 Vue（应该是 peerDependency）
- ❌ 不要跳过 lint 检查
- ❌ 不要在没有测试的情况下提交代码

### 应该做的事

- ✅ 在 Playground 中测试组件
- ✅ 为新功能编写测试
- ✅ 更新类型定义
- ✅ 保持代码格式一致
- ✅ 使用 OpenSpec 管理变更

## 组件开发指南

### 创建新组件

1. 在 `src/components/` 创建组件目录
2. 编写组件代码和类型定义
3. 在 `src/index.ts` 中导出
4. 在 `test/` 中添加测试
5. 在 Playground 中验证

### 组件 API 设计原则

- 保持 API 简洁直观
- 提供合理的默认值
- 支持 v-model 双向绑定
- 暴露必要的事件和方法
- 提供完整的 TypeScript 类型

## 故障排查

### 构建失败

- 检查 TypeScript 类型错误
- 确认所有依赖已安装
- 查看 Vite 配置是否正确

### Playground 无法启动

- 确认已运行 `pnpm install`
- 检查 workspace 引用是否正确
- 查看端口是否被占用

### 测试失败

- 确认测试环境配置正确
- 检查 jsdom 是否正常工作
- 查看测试文件路径是否正确

## 语言和沟通规范

### 交流语言

- **与用户沟通**: 必须使用中文
- **代码注释**: 必须使用英文
- **文档**: 使用中文（README, CLAUDE.md 等）
- **变量名和函数名**: 使用英文

### Git 提交规范

所有 Git 提交信息必须使用英文，并遵循以下格式：

```
<type>: <subject>

[optional body]

[optional footer]
```

**提交类型 (type)**：

- `feat`: Add new features
- `fix`: Fix the problem/BUG
- `style`: The code style is related and does not affect the running result
- `perf`: Optimization/performance improvement
- `refactor`: Refactor
- `revert`: Undo edit
- `test`: Test related
- `docs`: Documentation/notes
- `chore`: Dependency update/scaffolding configuration modification etc.
- `ci`: Continuous integration
- `types`: Type definition file changes

**示例**：

```bash
# 添加新功能
feat: add Editor component with basic functionality

# 修复 bug
fix: resolve TypeScript compilation error in index.ts

# 更新依赖
chore: update vite to 7.3.1

# 重构代码
refactor: simplify component props interface

# 性能优化
perf: optimize render performance in Preview component
```

**注意事项**：

- Subject 使用祈使句，首字母小写
- Subject 不超过 50 个字符
- Subject 结尾不加句号
- Body 和 Footer 可选，用于详细说明
