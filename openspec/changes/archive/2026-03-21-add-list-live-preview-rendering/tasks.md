# 实现任务清单

## 1. 列表作用域与语法识别

- [x] 1.1 研究 `@codemirror/lang-markdown` 当前语法树中的 `BulletList`、`OrderedList`、`ListItem`、`ListMark` 结构，并确认列表项激活边界
- [x] 1.2 在 hybrid 渲染层中补充标准列表 marker 的识别逻辑，覆盖 `-`、`*`、`+`、`.`、`)` 等合法写法
- [x] 1.3 在 hybrid 渲染层中补充 GFM task list 前缀识别逻辑，覆盖 `[ ]`、`[x]`、`[X]`
- [x] 1.4 明确复杂列表项（续行、嵌套、混合列表）在首期中的激活与回源码策略

## 2. 列表 live preview 渲染

- [x] 2.1 为无序列表项添加非激活态的 bullet 渲染效果
- [x] 2.2 为有序列表项添加非激活态的 ordered list 渲染效果
- [x] 2.3 隐藏非激活态列表项的 Markdown marker，并处理 marker 后的排版空格
- [x] 2.4 确保列表缩进、嵌套层级和混合列表在渲染态下保持可读

## 3. Task list 只读 checkbox 渲染

- [x] 3.1 为未完成 task list 项添加未勾选 checkbox 视觉效果
- [x] 3.2 为已完成 task list 项添加已勾选 checkbox 视觉效果
- [x] 3.3 确保 checkbox 为只读渲染元素，不直接切换任务状态
- [x] 3.4 确保点击 checkbox 或其邻近区域时，编辑器走源码编辑路径而不是直接修改状态

## 4. 激活态回源码与现有能力集成

- [x] 4.1 在光标或选区进入当前列表项时恢复该列表项的 Markdown 源码显示
- [x] 4.2 确保列表项激活态与现有 heading、blockquote、code block 等 hybrid 渲染逻辑兼容
- [x] 4.3 验证 livePreview 下的上下方向导航、点击定位和 vim 模式不被列表渲染破坏
- [x] 4.4 确保普通源码模式下列表显示行为不受影响

## 5. 测试与演示

- [x] 5.1 为无序列表、`*` / `+` marker 和有序列表 `.` / `)` 写法补充组件测试
- [x] 5.2 为 GFM task list 的 `[ ]`、`[x]`、`[X]` 状态补充组件测试
- [x] 5.3 为嵌套列表、混合列表和激活态回源码行为补充组件测试
- [x] 5.4 为点击 checkbox 不直接切换状态的行为补充测试
- [x] 5.5 更新 Playground 演示内容，加入标准列表和 task list 场景
- [x] 5.6 视需要更新 API 或功能文档，对 livePreview 的列表覆盖范围做说明
