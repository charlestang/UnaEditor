# Live Preview 中文输入问题复盘

## 目的

这份文档不是 changelog，也不是单纯记录“改了哪几行代码”。它的目标是把这次 `livePreview + IME composition` 的排查过程，沉淀成几条以后还会反复用到的工程结论。

如果下一次再遇到这类问题，尤其是：

- `CodeMirror 6`
- `live preview`
- `overlay`
- `ViewPlugin.update()`
- 中文 / 日文 / 韩文输入法

那么应该先读这份文档，再决定从哪里下手。

---

## 一句话结论

这次问题的根因，不是 CodeMirror 6 核心，也不是 `hybrid live preview` 的核心装饰逻辑，而是 `structuredTable` 这个只在 `livePreview` 模式下加载的全局插件，在普通输入过程中错误地反复调用了 `view.focus()`，从而打断了 IME 的起始 composition。

换句话说：

> 真正有害的不是“装饰很多”，而是“在错误的时机抢焦点”。

---

## 现象到底是什么

最稳定的复现条件最后收敛成了：

- `livePreview = true`
- 空行
- 第 0 列
- 开始中文输入

典型症状：

- 第一个拼音字母会直接上屏
- IME composition 被打断
- `livePreview = false` 时完全正常
- `vim` 开关与否都无关

更关键的是，后续手工测试证明：

- 和上一行是不是装饰过无关
- 和下一行是不是装饰过无关
- 和当前文档里已有内容无关
- 和视口里是否存在某种 Markdown 结构无关

这一步非常重要。它把问题从“某类节点邻接边界”推进到了“模式级全局副作用”。

---

## 为什么一开始很容易怀疑错方向

这次有几个误导性很强的信号。

### 1. 外部证据和症状长得很像

CodeMirror 官方论坛里确实有过两类看上去很像的问题：

- CJK 输入时第一个字母被当作普通字符直接插入
- 新行开头的日文 IME 候选位置或输入行为异常

这些信息不是完全没价值，但它们更像是在告诉我们：

> `composition + 边界 + 浏览器兼容性` 这类问题本来就脆弱。

它们不能直接证明“当前问题一定在 CodeMirror 核心”。

### 2. 现象看起来像 decoration / widget 边界问题

因为问题只在 `livePreview = true` 时出现，所以一开始很自然会怀疑：

- `Decoration.replace`
- widget buffer
- placeholder
- empty line 边界
- Chrome 的 composition anchor

这些怀疑并不荒谬，但它们仍然停留在“视觉上最显眼的那层”。

### 3. “这个功能明明没在用”是一个危险错觉

这次最关键的反转，就是 `structuredTable`。

它看起来像：

- 只有表格时才相关
- 当前空行根本不是表格
- 文档里甚至可能没有表格

但实际上它是一个**只要 `livePreview=true` 就会注册并持续参与更新链**的全局插件。

也就是说：

> 你眼前没有看到某个 UI，不代表相关逻辑没有在后台运行。

---

## 真正有效的定位过程

这次真正让问题收敛的，不是继续猜，而是做了几轮足够锋利的隔离实验。

### 1. 先确认问题只在 `livePreview` 模式出现

这一步把范围从“整个编辑器实例”缩到了“只在 live preview 模式额外加载的东西”。

结论：

- `livePreview = false` 没问题
- `livePreview = true` 有问题

### 2. 构造极简隔离页 `/sandbox2`

这个页面不复用 `UnaEditor`，而是直接初始化一个最小 CodeMirror 实例，只保留：

- Markdown 基础解析
- `hybrid live preview` 核心扩展
- live preview 必要主题

不加载：

- `structuredTable`
- `codeBlockLivePreview`
- `UnaEditor` 包装层
- placeholder / 工具栏 / 其他外围能力

测试结果：

- `/sandbox2` 完全正常

这一步直接排除了两个大方向：

- 不是 `UnaEditor` 包装层导致
- 不是 live preview 核心本身导致

### 3. 做模块加法而不是继续参数猜测

然后继续构造两个更严格的页面：

- `/sandbox3`: `sandbox2 + structuredTable`
- `/sandbox4`: `sandbox2 + codeBlockLivePreview`

测试结果：

- `/sandbox3` 有问题
- `/sandbox4` 没问题

到这里，其实锅已经定位到 `structuredTable` 了。

### 4. 从“表格功能逻辑”转向“全局副作用逻辑”

一旦确认问题在 `structuredTable`，真正该查的就不再是：

- 表格解析对不对
- 表格 widget 对不对
- 某个 cell DOM 有没有错

而是：

- 这个插件在**没有表格编辑发生**时，仍然做了什么
- 它在 `ViewPlugin.update()` 周期里有没有做不该做的事情
- 它有没有在普通输入链上触发 `focus()` / `blur()`

这是整个排查里最重要的转向点。

---

## 最终根因

根因在 `src/extensions/structuredTable.ts` 的 `StructuredTablePlugin`。

问题不在“表格怎么编辑”，而在“即使没有进入表格编辑态，插件仍然会参与普通输入更新”。

更具体一点：

1. `structuredTable` 在 `livePreview = true` 时被注册
2. 它的 `syncOverlay()` 会在普通更新链里运行
3. 某些路径下，即使当前根本没有在用表格 overlay，也会进入 `hideOverlay(...)`
4. 旧逻辑会把“编辑器当前拥有焦点”误判成“现在应该恢复编辑器焦点”
5. `hideOverlay(true)` 内部会连续调用多次 `view.focus()`
6. 这对英文输入通常看不出问题，但对 IME composition 的起始阶段是致命干扰

也就是说，旧逻辑大致相当于：

```ts
if (editorOwnsFocus()) {
  hideOverlay(true) // inside: view.focus()
}
```

但这条判断从语义上就是错的。

“编辑器拥有焦点”只说明：

- 当前用户本来就在编辑器里输入

它**完全不等于**：

- 现在需要帮用户把焦点恢复到编辑器

真正应该问的是：

- overlay 是否刚刚接管过焦点
- 当前是否正在从 overlay 编辑态退出

只有在这两种情况下，才有“恢复编辑器焦点”的必要。

---

## 修复的真正原则

最后生效的修复不是“尽量少 focus”，而是“只在语义成立时 restore focus”。

最终改动的核心是：

- 新增 `overlayOwnsFocus()`
- 新增 `shouldRestoreEditorFocus()`
- 把 `hideOverlay(this.editorOwnsFocus())` 改成 `hideOverlay(this.shouldRestoreEditorFocus())`

修复后的判断原则是：

```ts
shouldRestoreEditorFocus() {
  return overlayOwnsFocus() || overlayIsVisible()
}
```

这表示：

- 如果 overlay 自己拥有焦点，退出时应把焦点还给编辑器
- 如果 overlay 处于可见编辑态，收起时也应把焦点还给编辑器
- 但如果当前只是普通文本输入，根本没进过 overlay，就不该因为一次普通更新而再 `view.focus()` 一次

这个修复之所以重要，是因为它不是绕过症状，而是修正了**焦点所有权模型**。

---

## 为什么前面那些修法会失败

这次中途有几类修改，最后都被证明不是正确方向。

### 1. 把怀疑集中在 `hybridMarkdown` / `codeBlockLivePreview`

这类怀疑在最开始并不离谱，因为问题只在 `livePreview` 模式出现。

但隔离实验已经证明：

- 纯 `hybrid live preview` 核心没有问题
- `codeBlockLivePreview` 也不是根因

如果跳过隔离实验，直接在这些层里大改，很容易造成新的渲染副作用。

### 2. 在 composition 期间冻结 decorations

这条路看起来很“底层”、很像真修，但风险很高。

原因是 CodeMirror 里这些东西是联动的：

- decorations
- viewport
- line height
- block widget
- gutter
- selection mapping

你以为自己只是在“暂停装饰更新”，实际上很容易造成：

- 行号消失
- 光标消失
- 滚动后大面积空白
- 布局状态和可视区状态不同步

这次真实回归已经证明，这类全局冻结式修补是高风险操作。

### 3. 以为“当前没有表格，所以 structuredTable 不可能影响输入”

这是这次最值得记住的误判。

真正的事实是：

> 只要插件被注册，它就可能在普通更新链里发挥作用，哪怕视觉上完全没有表格 UI。

在 CodeMirror 这类编辑器系统里，很多问题不是发生在“用户正在操作哪个功能”，而是发生在“当前有哪些全局插件活着”。

---

## 这次最重要的工程结论

### 1. IME 问题里，`focus()` / `blur()` 是一级嫌疑

以后再遇到中文输入法问题，第一时间就该全局搜这些东西：

- `view.focus()`
- `element.focus()`
- `blur()`
- `setTimeout(() => focus())`
- `queueMicrotask(() => focus())`

尤其要看它们是否出现在这些地方：

- `ViewPlugin.update()`
- `syncOverlay()`
- `hide*()` / `show*()`
- transaction 响应链

如果答案是“会”，那就必须高度警惕。

### 2. “编辑器有焦点”和“应该恢复编辑器焦点”是两回事

这是这次最关键的技术点。

以后凡是做 overlay / floating editor / popup editor / bridge input，都必须分清：

- `editorOwnsFocus`
- `overlayOwnsFocus`
- `shouldRestoreEditorFocus`

这三个概念不能混。

一旦混了，就会在普通输入链上制造无意义的 refocus。

### 3. “功能没在用”不代表“插件没在跑”

这次 `structuredTable` 就是标准案例。

以后排查模式相关问题时，先问的不是：

- “当前这块 UI 有没有显示”

而是：

- “这个模式额外注册了哪些全局扩展”
- “哪些 `ViewPlugin` 会在每次更新时运行”

### 4. 隔离环境要用“模块加法”，不要只做参数切换

这次真正起作用的不是继续在原页面里开关参数，而是：

1. 先做一个极简可工作的核心环境
2. 再一次只加回一个模块
3. 用最少变量判断问题随哪个模块出现

这个方法的好处是，定位是可证伪的，不靠直觉。

### 5. 最小修复优于全局冻结

如果一个问题最后能被解释为：

- 某个插件做错了一次 `focus()`

那就应该修这个错误副作用本身，而不是去：

- 冻结整个 live preview
- 暂停所有 decoration 更新
- 改写编辑器主事务链

最小修复不仅更安全，也更容易长期维护。

---

## 这次排查给 Obsidian 的启发

用户当时给了一个很重要的现实锚点：

> Obsidian 也是 CM6，也是 live preview，没有这个问题。

这句话的价值不在于“Obsidian 一定做对了什么具体实现”，而在于它提醒了一个判断：

> 如果同一代编辑器核心在成熟产品里是稳定的，那么当前问题更值得优先怀疑“我们额外接上的胶水层”，而不是先判核心有缺陷。

这并不意味着核心绝不会有 bug，而是意味着排查顺序应该调整：

1. 先看我们自己加回来的模式级插件
2. 再看这些插件有没有全局副作用
3. 最后才考虑是否是核心边界缺陷

这个顺序能明显减少误判。

---

## 以后再遇到同类问题，建议按这个顺序排查

### 第 1 步：先找“必要触发条件”

不要一开始就猜根因，先把条件压缩出来：

- 是否只在某个模式出现
- 是否只在某个平台出现
- 是否只在某个输入法出现
- 是否和空文档、空行、行首、光标位置有关

### 第 2 步：列出这个模式额外加载的所有扩展

尤其关注：

- `ViewPlugin`
- `StateField`
- overlay / popup / floating editor
- `domEventHandlers`
- 任何会读写焦点的逻辑

### 第 3 步：优先搜焦点相关副作用

直接全局搜索：

- `focus(`
- `blur(`
- `queueMicrotask`
- `setTimeout`
- `requestAnimationFrame`

再看它们是不是挂在更新链上。

### 第 4 步：先做极简隔离页，再做模块加法

不要只在原页面里不断删条件。更有效的是：

1. 先构造一个已知没问题的最小实例
2. 再逐个把模块加回

### 第 5 步：IME 问题必须手测

自动化测试能锁回归，但很难完整模拟真实输入法行为。

所以正确顺序应该是：

1. 用手工测试锁定问题
2. 修复后再补一个能守住核心不变量的自动化测试

这次补的回归测试就是：

> 在普通 live preview 输入过程中，如果没有表格 overlay 处于活动态，不应该额外调用 `view.focus()`

它不是直接模拟中文输入法，但它能守住这次真正的根因。

---

## 应该记住的短版规则

如果以后只想记住最短的一版，就记下面这几条：

1. `IME + CM6` 出问题时，先查谁在乱 `focus()`
2. 模式特有问题，先查该模式额外注册的全局插件
3. “当前没显示某个 UI”不等于“相关插件没在跑”
4. overlay 场景里，必须区分 `editorOwnsFocus` 和 `overlayOwnsFocus`
5. 优先做最小隔离实例，再做模块加法
6. 优先修错误副作用，不要一上来冻结整个更新链

---

## 结语

这次最值得保留下来的，不是“某个中文输入 bug 被修了”，而是下面这条更通用的认识：

> 在编辑器系统里，最危险的 bug 往往不是视觉上最显眼的那层，而是某个后台全局插件在错误时机做了一次看似无害的副作用。

这次那个副作用就是 `view.focus()`。

以后只要再看到：

- IME 被打断
- 首字母异常上屏
- 某个模式下才出现
- 关闭模式立即恢复正常

那么第一反应就不该是“是不是 CodeMirror 核心又有 composition 边界 bug”，而应该先问：

> 这个模式多加载了哪些全局扩展？其中谁在普通输入链上动了焦点？

这就是这次复盘里最该记住的东西。
