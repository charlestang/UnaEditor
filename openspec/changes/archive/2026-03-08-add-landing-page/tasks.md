## 1. 基础设施与路由设置

- [x] 1.1 在 `playground/package.json` 中安装 `vue-router` 和 `vue-i18n`
- [x] 1.2 在 `playground/src/` 下创建 `views/`、`components/`、`router/`、`i18n/` 目录
- [x] 1.3 编写 `playground/src/router/index.ts`，配置 Hash 模式路由，包含 `/` (Landing) 和 `/sandbox` 路径
- [x] 1.4 初始化 `vue-i18n` 实例，创建 `en.json` 和 `zh.json`，挂载到 `playground/src/main.ts`
- [x] 1.5 将现有的 `playground/src/App.vue` 逻辑重构至 `playground/src/views/Sandbox.vue`
- [x] 1.6 修改 `playground/src/App.vue` 使其仅包含 `<router-view>` 并作为全局入口

## 2. 落地页组件开发 (Landing Page)

- [x] 2.1 创建 `playground/src/views/Landing.vue` 骨架及基础布局容器
- [x] 2.2 创建并集成 Header 导航栏组件 (Logo, 中英切换按钮, GitHub 链接)
- [x] 2.3 创建并集成 Hero 区组件 (大标题、副标题、行动按钮)
- [x] 2.4 创建并集成 Features 区组件 (特性网格展示)
- [x] 2.5 创建并集成 Demo 区组件 (引入 `UnaEditor`，并预置一段产品介绍 Markdown)
- [x] 2.6 创建并集成 Footer 区组件
- [x] 2.7 完善 Landing Page 的全局科技蓝风格样式与响应式设计

## 3. i18n 语言文案填充

- [x] 3.1 填充 `en.json` 中的英文展示文案 (Hero, Features 等)
- [x] 3.2 填充 `zh.json` 中的中文展示文案 (Hero, Features 等)
- [x] 3.3 验证所有 Landing Page 组件中的语言切换响应逻辑

## 4. 自动化构建与部署配置

- [x] 4.1 修改 `playground/vite.config.ts`，配置 `base: '/UnaEditor/'` 以适配 GitHub Pages
- [x] 4.2 验证本地 `pnpm build:playground` 及 `pnpm preview` 能否正常工作且资源路径正确
- [x] 4.3 在项目根目录 `.github/workflows/` 下创建 `deploy-pages.yml`，编写构建并发布到 GitHub Pages 的 Action 脚本
