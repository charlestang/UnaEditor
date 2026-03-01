# Agents Configuration

本项目的 AI 代理配置和协作指南。

## 项目上下文

**项目名称**: Una Editor
**项目类型**: Vue 3 组件库
**主要目标**: 基于 CodeMirror 6 开发编辑器组件，封装为 npm 包

## 技术栈约束

- Vue 3.5.25+ (Composition API)
- TypeScript 5.9.3+ (严格模式)
- Vite 7.3.1+ (构建工具)
- pnpm 10.30.3+ (包管理器)
- Vitest (测试框架)
- ESLint + Prettier (代码质量)

## 项目结构

```
una-editor/
├── src/                    # 组件源码
├── playground/            # 本地调试环境
├── docs/                  # 文档
├── test/                  # 测试
├── dist/                  # 构建输出
└── openspec/              # OpenSpec 变更管理
```

## 工作流程

### OpenSpec 变更管理

本项目使用 OpenSpec 进行结构化的变更管理：

1. **探索模式** (`/opsx:explore`) - 思考和讨论
2. **创建变更** (`/opsx:new`) - 开始新的变更
3. **继续变更** (`/opsx:continue`) - 创建 artifacts
4. **实现变更** (`/opsx:apply`) - 执行任务
5. **归档变更** (`/opsx:archive`) - 完成归档

### 开发流程

1. 使用探索模式讨论需求和设计
2. 创建 OpenSpec 变更（proposal → design → specs → tasks）
3. 实现任务清单中的任务
4. 在 Playground 中测试
5. 编写测试用例
6. 归档变更

## 代理职责

### 探索代理 (Explore Agent)

- 帮助用户思考和讨论想法
- 调查代码库，理解现有架构
- 提供设计建议和权衡分析
- 可视化架构和数据流
- **不实现代码**，只做思考和规划

### 实现代理 (Apply Agent)

- 执行任务清单中的任务
- 编写代码和配置文件
- 运行测试和验证
- 标记任务完成状态
- 遇到问题时暂停并寻求指导

## 编码规范

### TypeScript

- 启用严格模式
- 完整的类型定义
- 优先使用 `interface`
- 避免 `any` 类型

### Vue 组件

- 使用 Composition API
- `<script setup lang="ts">`
- 完整的 Props 类型定义
- 清晰的文档注释

### 代码风格

- 遵循 ESLint 和 Prettier 配置
- 有意义的命名
- 单一职责原则
- 必要的注释

## 构建配置

### Vite Library Mode

- 输出 ESM (`index.mjs`) 和 CommonJS (`index.cjs`)
- Vue 作为外部依赖
- 生成类型声明文件

### pnpm Workspace

- 主包和 Playground 使用 workspace
- Playground 通过 `workspace:*` 引用主包
- 支持热更新

## 测试策略

- 使用 Vitest 进行单元测试
- 使用 @vue/test-utils 测试 Vue 组件
- jsdom 环境模拟浏览器
- 每个组件都应有测试覆盖

## 注意事项

### 禁止操作

- ❌ 修改 `dist/` 目录
- ❌ 提交 `node_modules/`
- ❌ 跳过 lint 检查
- ❌ 在主包中安装 Vue（应该是 peerDependency）

### 推荐操作

- ✅ 使用 OpenSpec 管理变更
- ✅ 在 Playground 中测试
- ✅ 编写测试用例
- ✅ 保持代码格式一致
- ✅ 更新类型定义

## 语言和沟通规范

### 交流语言

- **与用户沟通**: 必须使用中文
- **代码注释**: 必须使用英文
- **文档**: 使用中文（README, CLAUDE.md 等）
- **变量名和函数名**: 使用英文
- **Git 提交信息**: 必须使用英文

### Git 提交规范

所有 Git 提交信息必须使用英文，并遵循 Conventional Commits 格式：

```
<type>: <subject>
```

**提交类型**：

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
feat: add Editor component with CodeMirror integration
fix: resolve build error in vite config
chore: update dependencies to latest versions
refactor: simplify component props interface
perf: optimize editor rendering performance
```

### 工作流偏好

- 使用 OpenSpec 进行结构化变更管理
- 小步快跑，持续验证
- 代码质量优先于开发速度

## 常见任务

### 添加新组件

1. 在 `src/components/` 创建组件
2. 导出到 `src/index.ts`
3. 编写测试
4. 在 Playground 验证

### 修改构建配置

1. 更新 `vite.config.ts`
2. 验证构建输出
3. 检查类型声明

### 更新依赖

1. 更新 `package.json`
2. 运行 `pnpm install`
3. 验证构建和测试

## 故障排查

### 构建问题

- 检查 TypeScript 类型错误
- 确认依赖已安装
- 验证 Vite 配置

### Playground 问题

- 确认 workspace 引用正确
- 检查端口占用
- 验证依赖安装

### 测试问题

- 检查测试环境配置
- 验证 jsdom 工作正常
- 确认测试文件路径

## 协作原则

1. **清晰沟通** - 明确任务和目标
2. **结构化工作** - 使用 OpenSpec 管理变更
3. **质量优先** - 代码质量和测试覆盖
4. **渐进式开发** - 小步快跑，持续验证
5. **文档完善** - 保持文档更新
