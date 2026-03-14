## REMOVED Requirements

### Requirement: Language mode support

**Reason**: UnaEditor 固定为 Markdown 编辑器，`language` prop 从未实际生效（编辑器始终加载 Markdown 扩展），暴露该 prop 会误导调用方。

**Migration**: 删除所有 `language` prop 的使用。编辑器始终以 Markdown 模式运行，无需显式声明。

```html
<!-- Before -->
<UnaEditor language="markdown" v-model="content" />

<!-- After -->
<UnaEditor v-model="content" />
```
