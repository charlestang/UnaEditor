## Why

当前编辑器的 fenced code block 已支持多种语言高亮，但实际使用中 `html` 代码块不会触发语法高亮，导致 Web 场景下的示例代码退化为纯文本显示。这是一个明确的能力缺口，而且与现有代码块主题、header label 与语言别名体系不一致，应尽快补齐。

## What Changes

- 为 `html` fenced code block 增加语法高亮支持，并确保其通过 Markdown `codeLanguages` 正确接入嵌套语言解析。
- 为 `html` 增加与现有语言体系一致的语言标识、规范化映射与展示标签能力。
- 补充针对 `html` fenced code block 的回归测试，覆盖语言支持检测与编辑器内高亮行为。

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `code-block-syntax-highlighting`: 扩展已支持语言集合，使 `html` fenced code block 成为受支持并可正确高亮的语言。

## Impact

- 影响代码块语言注册与语言别名映射逻辑。
- 影响 Markdown fenced code block 的嵌套语言解析结果。
- 影响代码块语法高亮相关测试。
- 不引入新的公开 API，也不改变现有 props/event 契约。
