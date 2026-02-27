# Project Scaffold Specification

## Purpose

This specification defines the standard project structure, configuration, and tooling requirements for the HexoPress Editor component library. It ensures a consistent, maintainable, and modern development environment.

## Requirements

### Requirement: 项目目录结构

项目 SHALL 包含以下标准化的目录结构：

- `src/` - 组件源码目录
- `playground/` - 本地调试环境
- `docs/` - 文档目录
- `test/` - 测试文件目录
- `dist/` - 构建输出目录

#### Scenario: 目录结构验证

- **WHEN** 项目初始化完成
- **THEN** 所有必需的目录都存在于项目根目录

#### Scenario: 源码目录包含入口文件

- **WHEN** 检查 src 目录
- **THEN** 存在 index.ts 作为包的入口文件

### Requirement: pnpm workspace 配置

项目 SHALL 使用 pnpm workspace 管理 monorepo 结构，包含主包和 playground 子包。

#### Scenario: workspace 配置文件存在

- **WHEN** 检查项目根目录
- **THEN** 存在 pnpm-workspace.yaml 文件

#### Scenario: playground 引用主包

- **WHEN** 检查 playground/package.json
- **THEN** dependencies 中包含 `"hexopress-editor": "workspace:*"`

### Requirement: 包配置文件

项目 SHALL 包含完整的 package.json 配置，定义包名称、版本、入口文件、构建脚本和依赖。

#### Scenario: 主包配置存在

- **WHEN** 检查项目根目录
- **THEN** 存在 package.json 文件，包含 name、version、main、module、types 字段

#### Scenario: 构建脚本配置

- **WHEN** 检查 package.json 的 scripts 字段
- **THEN** 包含 build、dev、test、lint 等必要脚本

#### Scenario: 依赖声明

- **WHEN** 检查 package.json 的 dependencies 和 devDependencies
- **THEN** 包含 Vue 3.5+、TypeScript 5.9+、Vite 7.3+、Vitest、ESLint、Prettier 等依赖

### Requirement: Vite 构建配置

项目 SHALL 使用 Vite library mode 构建 npm 包，输出 ESM 和 CommonJS 双格式。

#### Scenario: Vite 配置文件存在

- **WHEN** 检查项目根目录
- **THEN** 存在 vite.config.ts 文件

#### Scenario: Library mode 配置

- **WHEN** 检查 vite.config.ts 的 build.lib 配置
- **THEN** 配置了 entry、name、formats（包含 es 和 cjs）

#### Scenario: 外部依赖配置

- **WHEN** 检查 vite.config.ts 的 rollupOptions.external
- **THEN** Vue 被标记为外部依赖

#### Scenario: 构建输出格式

- **WHEN** 执行构建命令
- **THEN** dist 目录包含 index.mjs（ESM）和 index.cjs（CommonJS）文件

### Requirement: TypeScript 配置

项目 SHALL 启用 TypeScript 严格模式，并生成完整的类型声明文件。

#### Scenario: TypeScript 配置文件存在

- **WHEN** 检查项目根目录
- **THEN** 存在 tsconfig.json 文件

#### Scenario: 严格模式启用

- **WHEN** 检查 tsconfig.json 的 compilerOptions
- **THEN** strict 选项设置为 true

#### Scenario: 类型声明生成

- **WHEN** 检查 tsconfig.json 的 compilerOptions
- **THEN** declaration 和 declarationMap 选项设置为 true

#### Scenario: 构建后类型文件存在

- **WHEN** 执行构建命令
- **THEN** dist 目录包含 .d.ts 类型声明文件

### Requirement: ESLint 配置

项目 SHALL 配置 ESLint 进行代码质量检查，使用 Vue 和 TypeScript 规则。

#### Scenario: ESLint 配置文件存在

- **WHEN** 检查项目根目录
- **THEN** 存在 eslint.config.js 或 .eslintrc 文件

#### Scenario: Vue 和 TypeScript 插件配置

- **WHEN** 检查 ESLint 配置
- **THEN** 包含 @typescript-eslint 和 eslint-plugin-vue 插件

#### Scenario: Lint 命令可执行

- **WHEN** 执行 npm run lint 命令
- **THEN** ESLint 检查所有源码文件

### Requirement: Prettier 配置

项目 SHALL 配置 Prettier 进行代码格式化。

#### Scenario: Prettier 配置文件存在

- **WHEN** 检查项目根目录
- **THEN** 存在 .prettierrc 或 prettier.config.js 文件

#### Scenario: 格式化命令可执行

- **WHEN** 执行格式化命令
- **THEN** Prettier 格式化所有源码文件

### Requirement: Vitest 测试配置

项目 SHALL 配置 Vitest 作为测试框架，支持 Vue 组件测试。

#### Scenario: Vitest 配置文件存在

- **WHEN** 检查项目根目录
- **THEN** 存在 vitest.config.ts 文件

#### Scenario: 测试命令可执行

- **WHEN** 执行 npm run test 命令
- **THEN** Vitest 运行 test 目录下的测试文件

#### Scenario: Vue 测试工具集成

- **WHEN** 检查 package.json 的 devDependencies
- **THEN** 包含 @vue/test-utils 依赖

### Requirement: Playground 开发环境

项目 SHALL 提供独立的 playground 应用，用于本地调试组件。

#### Scenario: Playground 目录结构

- **WHEN** 检查 playground 目录
- **THEN** 包含 src/、index.html、vite.config.ts、package.json

#### Scenario: Playground 可启动

- **WHEN** 在 playground 目录执行 dev 命令
- **THEN** Vite 开发服务器启动，可以访问调试页面

#### Scenario: 热更新支持

- **WHEN** 修改主包源码
- **THEN** Playground 自动重新加载，显示最新变更
