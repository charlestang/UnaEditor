## Why

为了准备 Una Editor 的开源发布，我们需要一个精美且专业的落地页 (Landing Page) 来向开源社区展示项目的愿景、特性和交互式演示。同时，我们需要保留现有的 Playground 体验以便进行日常组件开发与测试。利用现有的 Playground 升级为多路由站点，是成本最低且效果最好的方案。

## What Changes

- 在 `playground` 项目中引入 `vue-router` 和 `vue-i18n`。
- 将 `playground` 转换为一个多页面应用 (SPA)。
- 建立对外展示的 Landing Page（访问 `/` 路由），采用科技蓝主题，包含 Hero、特性介绍和编辑器演示。
- 保留对内开发测试的 Sandbox（访问 `/sandbox` 路由），将现有的 Playground 测试代码迁移至此。
- 增加针对 `playground/dist` 的 GitHub Actions 自动化部署流水线，将其部署到 GitHub Pages。

## Capabilities

### New Capabilities

- `project-landing-page`: 开源产品落地页的展示功能，包括 Hero 视觉区、特性网格、中英双语支持，以及可交互的编辑器 Demo 区。
- `playground-sandbox`: 纯净的编辑器开发调试环境，通过独立的路由隔离落地页的复杂样式干扰。

### Modified Capabilities

无。

## Impact

- **依赖项**: `playground/package.json` 新增 `vue-router` 和 `vue-i18n`。
- **目录结构**: `playground/src/` 将进行大规模重构，拆分出 `views`、`components`、`router`、`i18n` 等目录。
- **构建配置**: 需要修改 `vite.config.ts` 中的 `base` 路径以适配 GitHub Pages (`/UnaEditor/`)。
- **CI/CD**: 项目根目录新增 `.github/workflows/deploy-pages.yml`。
