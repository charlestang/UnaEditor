## Context

当前项目需要在现有的 `playground` Vite 应用基础上，构建一个用于向公众展示的开源产品落地页 (Landing Page)，同时不能破坏原有的本地开发调试体验。为了实现页面跳转和多语言支持，我们将引入官方的 `vue-router` 和 `vue-i18n`。

## Goals / Non-Goals

**Goals:**

- 将 `playground` 升级为一个包含多个路由（`/` 用于展示，`/sandbox` 用于开发）的 SPA 应用。
- 实现一个具有科技蓝主题风格、包含实时编辑器演示的 Landing Page。
- 引入轻量级的国际化方案，支持中英文切换。
- 配置 GitHub Actions 自动将构建产物部署到 GitHub Pages。

**Non-Goals:**

- 编写完整的多页面官方文档。API 手册和详细文档依然保留在仓库的 Markdown 文件中，落地页仅通过链接跳转。
- 引入 VitePress 等外部 SSG 框架（保持对 UI 和交互的 100% 自定义控制）。

## Decisions

**1. 路由模式使用 Hash 模式**

- **选择**: `createWebHashHistory()`。
- **原因**: 落地页将部署在纯静态文件服务器 GitHub Pages 上。使用 Hash 模式（`/#/`）可以原生避免页面刷新导致的 404 问题，无需在服务端配置 fallback 或使用 404 Hack 脚本，实现成本最低且最稳定。

**2. 目录结构重构方案**

- **选择**: 在 `playground/src` 下建立标准的 Vue 目录结构（`views/`, `components/`, `router/`, `i18n/`）。
- **原因**: 将原来的 `App.vue` 内容提取到 `views/Sandbox.vue`，并将 `App.vue` 仅作为 `<router-view>` 的挂载点，可以干净地隔离落地页复杂样式与 Sandbox 的纯净开发环境。

**3. Vite 部署路径 (Base URL)**

- **选择**: 修改 `playground/vite.config.ts` 中的 `base` 属性为 `'/UnaEditor/'`。
- **原因**: GitHub Pages 的非自定义域名部署格式为 `https://charlestang.github.io/UnaEditor/`。不设置 `base` 会导致资产文件请求指向根域名而报 404 错误。

**4. i18n 语言管理**

- **选择**: 引入 `vue-i18n`，使用简单的 JSON 文件 (`locales/zh.json`, `locales/en.json`) 管理翻译。
- **原因**: 支持动态响应式的文案切换，且易于维护。不需要做基于路由的语种拆分，所有语言共享同一个组件逻辑。

## Risks / Trade-offs

- **Risk**: 引入 Router 和 i18n 会略微增加 Playground 的构建体积。
  - **Mitigation**: 对于一个现代 Vite 应用，这两个库的额外体积影响微乎其微。可以使用动态导入（Dynamic Imports）来懒加载 Sandbox 或 Landing 组件，进一步优化首屏性能。
- **Risk**: 落地页的全局 CSS 可能污染 Sandbox 的样式。
  - **Mitigation**: 尽量使用 Scoped CSS 或特定前缀（如 `.landing-container`）来编写落地页样式，保证 `/sandbox` 路由下的 DOM 干净整洁。
