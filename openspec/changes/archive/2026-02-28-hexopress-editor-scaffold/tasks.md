## 1. 项目初始化和目录结构

- [x] 1.1 创建项目根目录结构（src/, playground/, docs/, test/）
- [x] 1.2 创建 src/index.ts 作为包的入口文件
- [x] 1.3 创建 .gitignore 文件，忽略 node_modules/, dist/, .DS_Store 等
- [x] 1.4 创建 README.md 基础文档

## 2. 包配置和 pnpm workspace

- [x] 2.1 创建根目录 package.json，配置包名称、版本、入口文件
- [x] 2.2 在 package.json 中添加 main、module、types 字段指向构建输出
- [x] 2.3 在 package.json 中添加 scripts（build, dev, test, lint, format）
- [x] 2.4 在 package.json 中添加核心依赖（vue@^3.5.25）
- [x] 2.5 在 package.json 中添加开发依赖（typescript@^5.9.3, vite@^7.3.1, vue-tsc@^3.1.5）
- [x] 2.6 创建 pnpm-workspace.yaml，配置 workspace 包含 playground
- [x] 2.7 运行 pnpm install 安装依赖

## 3. TypeScript 配置

- [x] 3.1 创建 tsconfig.json，启用 strict 模式
- [x] 3.2 配置 declaration 和 declarationMap 为 true
- [x] 3.3 配置 target 为 ES2020，module 为 ESNext
- [x] 3.4 配置 moduleResolution 为 bundler
- [x] 3.5 配置 include 和 exclude 路径
- [x] 3.6 配置 types 包含 vite/client
- [x] 3.7 验证 TypeScript 编译无错误

## 4. Vite 构建配置

- [x] 4.1 创建 vite.config.ts，导入必要的插件
- [x] 4.2 配置 @vitejs/plugin-vue 插件
- [x] 4.3 配置 build.lib 选项（entry, name, formats）
- [x] 4.4 配置 fileName 函数，输出 index.mjs 和 index.cjs
- [x] 4.5 配置 rollupOptions.external，将 vue 标记为外部依赖
- [x] 4.6 配置 rollupOptions.output.globals，映射 vue 到 Vue
- [x] 4.7 运行 pnpm build 验证构建成功
- [x] 4.8 验证 dist/ 目录包含 index.mjs, index.cjs 和 .d.ts 文件

## 5. ESLint 配置

- [x] 5.1 安装 ESLint 相关依赖（eslint, @typescript-eslint/parser, @typescript-eslint/eslint-plugin）
- [x] 5.2 安装 Vue ESLint 插件（eslint-plugin-vue）
- [x] 5.3 创建 eslint.config.js（使用 flat config 格式）
- [x] 5.4 配置 TypeScript 解析器和规则
- [x] 5.5 配置 Vue 插件和推荐规则
- [x] 5.6 配置忽略文件（dist/, node_modules/）
- [x] 5.7 运行 pnpm lint 验证配置正确

## 6. Prettier 配置

- [x] 6.1 安装 Prettier 依赖（prettier）
- [x] 6.2 创建 .prettierrc 配置文件
- [x] 6.3 配置基本格式化选项（semi, singleQuote, trailingComma 等）
- [x] 6.4 创建 .prettierignore 文件
- [x] 6.5 在 package.json 中添加 format 脚本
- [x] 6.6 运行 pnpm format 验证格式化工作正常

## 7. Vitest 测试配置

- [x] 7.1 安装 Vitest 相关依赖（vitest, @vue/test-utils, jsdom）
- [x] 7.2 创建 vitest.config.ts 配置文件
- [x] 7.3 配置 test.environment 为 jsdom
- [x] 7.4 配置 test.globals 为 true
- [x] 7.5 在 test/ 目录创建示例测试文件
- [x] 7.6 运行 pnpm test 验证测试框架工作正常

## 8. Playground 开发环境

- [x] 8.1 创建 playground/ 目录结构（src/, public/）
- [x] 8.2 创建 playground/package.json，配置包名和依赖
- [x] 8.3 在 playground/package.json 中添加 hexopress-editor: "workspace:\*" 依赖
- [x] 8.4 在 playground/package.json 中添加 vue 和 vite 依赖
- [x] 8.5 创建 playground/index.html 入口文件
- [x] 8.6 创建 playground/src/main.ts 应用入口
- [x] 8.7 创建 playground/src/App.vue 根组件
- [x] 8.8 创建 playground/vite.config.ts 配置文件
- [x] 8.9 创建 playground/tsconfig.json 配置文件
- [x] 8.10 在 playground 目录运行 pnpm install
- [x] 8.11 运行 playground 开发服务器，验证可以访问
- [x] 8.12 在 App.vue 中尝试导入主包，验证 workspace 引用工作正常

## 9. 最终验证

- [x] 9.1 运行 pnpm build 确保构建成功
- [x] 9.2 运行 pnpm lint 确保代码质量检查通过
- [x] 9.3 运行 pnpm test 确保测试通过
- [x] 9.4 运行 playground 开发服务器，确保热更新工作正常
- [x] 9.5 检查所有配置文件格式正确
- [x] 9.6 更新 README.md，添加项目说明和使用指南
