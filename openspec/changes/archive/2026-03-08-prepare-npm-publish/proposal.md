## Why

为了让开源社区能够顺利使用 Una Editor，我们需要将其发布到 npm 仓库。在发布之前，必须确保 `package.json` 中的元数据（如入口文件、类型声明文件路径、包包含的文件等）配置完全正确，以提供最佳的模块导入和 TypeScript 体验。否则，强行发布可能导致使用者在下载后无法正常解析组件和类型。

## What Changes

- 完善 `package.json` 中的仓库、作者、开源协议等元信息字段。
- 梳理并检查 `exports` 字段，确保 ESM 和 CommonJS 格式的引入路径，以及 TypeScript 声明文件 (`types`) 的路径配置准确无误。
- 确认 `files` 字段，保证 `npm publish` 时仅上传必要的文件（如 `dist/`, `README.md`, `LICENSE`），排除源码、测试等无关文件。
- 确保所有的依赖声明（特别是 `peerDependencies`）配置合理。

## Capabilities

### New Capabilities
- `npm-distribution`: 让该项目符合 npm 包的发布规范，确保外部环境可以正确解析和使用 `una-editor`。

### Modified Capabilities
无。

## Impact

- **文件**: 主要影响根目录下的 `package.json`。
- **构建输出**: 将运行构建和 `npm pack --dry-run` 以验证打包产物结构，但不会直接修改业务逻辑代码。
- **使用者**: 其他项目在通过 `npm install una-editor` 安装后，将能获得正确的导入路径和类型提示。