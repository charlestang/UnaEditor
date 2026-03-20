## 1. 完善 `package.json` 元信息

- [x] 1.1 添加或完善 `author` 字段，填入你的姓名/联系方式
- [x] 1.2 添加或完善 `repository` 字段，指向 GitHub 仓库地址
- [x] 1.3 添加 `bugs` 和 `homepage` 字段，方便用户反馈问题和查看演示
- [x] 1.4 检查并确认 `license` 字段为 `"MIT"`

## 2. 检查模块导出 (Exports)

- [x] 2.1 确认 `package.json` 中包含正确的 `main`, `module`, `types` 根级别入口
- [x] 2.2 确认 `exports` 字段正确配置了 `.` 路径下的 `types`, `import`, 和 `require` 指向 `dist/` 中的对应文件
- [x] 2.3 确认 `vue` 被正确放置在 `peerDependencies` 中，而不是 `dependencies`

## 3. 验证构建与发布清单

- [x] 3.1 运行 `pnpm build` 确保 `dist/` 目录结构与 `package.json` 中的声明相匹配
- [x] 3.2 确认 `package.json` 的 `files` 字段包含且仅包含 `["dist"]`
- [x] 3.3 运行 `npm pack --dry-run`，人工检查输出的文件列表，确保没有敏感文件、源码或巨型依赖被意外打包
