## Context

这是一个全新的项目，目标是创建一个基于 CodeMirror 6 的 Vue 3 编辑器组件库。项目将作为独立的 npm 包发布，供 HexoPress 等项目使用。当前处于项目初始化阶段，需要搭建完整的开发、测试、构建和文档基础设施。

技术栈约束：

- Vue 3.5.25+（Composition API）
- TypeScript 5.9.3+（严格模式）
- Vite 7.3.1+（构建工具）
- pnpm 10.30.3+（包管理器）

## Goals / Non-Goals

**Goals:**

- 创建清晰的项目目录结构，分离源码、测试、文档和调试环境
- 配置完整的 TypeScript 工具链，支持类型检查和声明文件生成
- 设置 pnpm workspace，实现 playground 对主包的本地引用
- 配置 Vite library mode，输出 ESM 和 CommonJS 双格式
- 集成代码质量工具（ESLint, Prettier）和测试框架（Vitest）
- 提供开箱即用的开发环境，支持热更新和快速迭代

**Non-Goals:**

- 不实现具体的 Editor 和 Preview 组件（后续迭代）
- 不配置 CI/CD 流程（可后续添加）
- 不设置文档站点构建（docs/ 目录预留，后续配置）
- 不处理组件样式方案（待组件开发时决策）

## Decisions

### 1. 项目结构：Monorepo 风格 + pnpm workspace

**决策**：采用 monorepo 结构，使用 pnpm workspace 管理主包和 playground

```
hexopress-editor/
├── src/                    # 主包源码
├── playground/            # 独立的 Vite 应用
├── docs/                  # 文档（预留）
├── test/                  # 测试文件
├── dist/                  # 构建输出
├── package.json           # 主包配置
├── pnpm-workspace.yaml    # workspace 配置
└── playground/
    └── package.json       # playground 独立配置
```

**理由**：

- Playground 作为独立应用，可以真实模拟 npm 包的使用场景
- Workspace 引用（`workspace:*`）支持热更新，开发体验好
- 结构清晰，便于后续扩展（如添加更多示例应用）

**替代方案**：

- 单一项目 + 直接路径引用：简单但不能测试构建后的包
- Lerna/Nx：功能更强大但对于单包项目过于复杂

### 2. 构建工具：Vite Library Mode

**决策**：使用 Vite 的 library mode 构建 npm 包

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HexopressEditor',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
      },
    },
  },
});
```

**理由**：

- Vite 构建速度快，配置简洁
- 原生支持 TypeScript 和 Vue SFC
- Library mode 专为库开发设计
- 与 playground 的 Vite 配置一致，减少认知负担

**替代方案**：

- unbuild：更专业的库构建工具，但增加学习成本
- tsup：零配置但对 Vue SFC 支持有限
- Rollup：更底层，配置复杂

### 3. 类型系统：TypeScript Strict Mode

**决策**：启用 TypeScript 严格模式，生成完整的类型声明文件

```json
{
  "compilerOptions": {
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist/types"
  }
}
```

**理由**：

- 严格模式提供最佳的类型安全
- 声明文件对于库项目至关重要
- declarationMap 便于调试

### 4. 包管理：pnpm + workspace 协议

**决策**：使用 pnpm 作为包管理器，playground 通过 `workspace:*` 引用主包

```json
// playground/package.json
{
  "dependencies": {
    "hexopress-editor": "workspace:*"
  }
}
```

**理由**：

- pnpm 节省磁盘空间，安装速度快
- workspace 协议支持热更新，开发体验好
- 符合现代前端工程实践

### 5. 代码质量：ESLint + Prettier

**决策**：集成 ESLint（Vue + TypeScript 规则）和 Prettier

**理由**：

- ESLint 捕获潜在错误和代码异味
- Prettier 统一代码风格
- Vue 官方推荐的工具链

### 6. 测试框架：Vitest

**决策**：使用 Vitest 作为测试框架

**理由**：

- 与 Vite 无缝集成
- 兼容 Jest API，学习成本低
- 支持 Vue 组件测试（配合 @vue/test-utils）
- 速度快，支持 watch mode

## Risks / Trade-offs

### 风险 1：Vite 7 兼容性

**风险**：Vite 7 是较新版本，可能存在未知问题或插件兼容性问题
**缓解**：使用稳定的 Vite 插件，遇到问题可降级到 Vite 6

### 风险 2：Playground 维护成本

**风险**：Playground 作为独立应用，需要单独维护配置和依赖
**缓解**：共享 TypeScript 和 ESLint 配置，减少重复

### 风险 3：双格式输出复杂度

**风险**：同时输出 ESM 和 CommonJS 可能导致构建配置复杂
**缓解**：Vite library mode 原生支持，配置简单

### 权衡 1：Monorepo vs 单一项目

**权衡**：Monorepo 结构增加了初始复杂度
**收益**：提供了更真实的开发和测试环境，长期收益大于成本

### 权衡 2：严格模式 vs 宽松模式

**权衡**：TypeScript 严格模式可能增加开发时的类型标注工作
**收益**：提供更好的类型安全，减少运行时错误

## Migration Plan

不适用（全新项目）

## Open Questions

1. **文档站点技术选型**：docs/ 目录预留，后续需要决定使用 VitePress、Storybook 还是其他工具
2. **组件样式方案**：CSS Modules、Scoped CSS 还是 UnoCSS/Tailwind，待组件开发时决策
3. **CodeMirror 扩展策略**：内置哪些扩展，如何暴露自定义扩展接口，待组件设计时明确
