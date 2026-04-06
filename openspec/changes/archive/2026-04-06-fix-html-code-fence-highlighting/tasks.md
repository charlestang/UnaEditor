## 1. Language Registration

- [x] 1.1 将 HTML 语言支持依赖接入主包，并确保编辑器运行时可加载对应 CodeMirror 语言支持
- [x] 1.2 在 `languageSupport` 注册表中补充 `html` 的语言支持、规范化映射与展示标签

## 2. Editor Behavior Verification

- [x] 2.1 确认 Markdown `codeLanguages` 路径能够对 `html` fenced code block 应用嵌套语言解析，且不影响现有已支持语言
- [x] 2.2 确认 `html` fenced code block 在普通模式与 `livePreview` 模式下都能保留正确的高亮与 header label 行为

## 3. Regression Coverage

- [x] 3.1 补充语言支持层测试，覆盖 `html` 的支持检测、规范化标识与展示标签
- [x] 3.2 补充编辑器回归测试，覆盖 `html` fenced code block 的实际高亮表现
- [x] 3.3 运行相关测试并确认本次修复未引入回归
