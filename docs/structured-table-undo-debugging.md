# 结构化表格撤销问题排查记录

## 背景

本次问题发生在 `/#/sandbox/` 的结构化表格手工验证过程中。

用户在表格内连续编辑多个 cell，然后通过方向键离开表格，回到表格外的普通文本位置。此时：

- 键盘 `Cmd+Z` / `Ctrl+Z` 一度不稳定
- sandbox 上方的“撤销”按钮长期无效
- 多次尝试中还出现过：
  - 浏览器原生菜单闪烁
  - 编辑器没有任何撤销反应
  - `RangeError: Trying to update state with a transaction that doesn't start from the previous state`
  - 离开表格后，右下角 cell 残留 active/selected 样式

这类问题的难点在于：表面上看是“按钮不生效”，但实际上同时牵涉了 **CodeMirror history**、**表格 overlay 输入桥**、**焦点路由**、**表格离场 selection 收口** 四条链。

## 最终结论

最终可工作的方案，不是“外部直接调用 undo 命令”，而是：

1. 编辑器本体必须真正接入 CodeMirror 的 `historyKeymap`
2. sandbox 的“撤销/重做”按钮必须复用 **与真实键盘撤销同源的 DOM 事件路径**
3. 事件要发给 **当前真实输入目标**
   - 有可见 overlay：发给 overlay
   - 没有 overlay：发给 `view.contentDOM`
4. 表格离场时，selection 必须落到 **真正的表格外位置**
   - 不能停在 `table.from` / `table.to` 这种边界位点

只有这四点同时成立，按钮和键盘路径才会一致，撤销才稳定。

## 真正根因

### 根因 1：编辑器本体只有 `history()`，但没有接 `historyKeymap`

之前 `useEditor.ts` 里只有：

- `history()`
- `keymap.of(defaultKeymap)`

但没有：

- `keymap.of(historyKeymap)`

结果是：

- CodeMirror 有 history state
- 但 `Mod-z` / `Mod-y` / `Mod-Shift-z` 这条标准快捷键链并没有稳定接进编辑器本体
- 所以我们在 sandbox 里无论模拟什么按钮路径，都像是在和“未接好的主链”做兼容

这也是为什么很多按钮层面的修补都不彻底。

### 根因 2：sandbox 按钮一开始走的是“编辑器外部命令调用”

尝试过几种按钮实现：

1. 直接 `undo(view)` / `redo(view)`
2. 给 `UnaEditor` 暴露 `undoHistory()` / `redoHistory()` 后再从外部调用
3. 直接 `runScopeHandlers(view, event, 'editor')`

这些路径都出现过 stale transaction 或无效，其共性是：

- 它们都是 **从 sandbox 外部直接驱动编辑器事务**
- 但结构化表格此时可能仍处于异步收口阶段
  - overlay 刚隐藏
  - focus 刚切换
  - selection normalization 还在微任务中
  - table leave 后的主 selection 还在收敛

于是外部直接发出的 undo，很容易撞上“不是从当前最新 state 开始的 transaction”。

### 根因 3：表格离场位置原来停在 `table.to`

原先 `leaveStructuredTable()` 在从最后一行离开表格时，会把 selection 放到：

- `table.to`

这会带来两个副作用：

1. 渲染层仍有机会把当前位置解释成“最后一个 cell 仍然 active”
2. 焦点虽然视觉上已经离开表格，但内部还带着表格边界语义

这就是为什么一度会看到右下角 cell 残留 active/selected。

## 哪些尝试是误判

下面这些尝试，结果上没有直接解决问题：

### 1. 只修 overlay blur / focus

这一步改善了部分“浏览器接管快捷键”的症状，但没有解决按钮路径本身的问题。

原因：

- 它只是在修焦点
- 没有修 history keymap
- 也没有解决“外部直接调用 undo”会撞 stale transaction

### 2. 让 sandbox 按钮直接调用 `undo(view)`

这是最容易想到的方式，但在本问题里是错误方向。

原因：

- 这条路径绕过了真实键盘触发链
- 对普通编辑器也许够用
- 但在“表格 overlay + 异步 selection 收口”的环境下不稳

### 3. 让 sandbox 按钮直接调用 `runScopeHandlers(...)`

这比 `undo(view)` 更接近真实键盘，但仍然不是同一件事。

原因：

- `runScopeHandlers(...)` 仍然是“外部直接调用 CodeMirror keymap 执行器”
- 它不是浏览器真实 DOM 键盘事件流
- 在当前这个有 overlay、焦点切换和异步事务的场景下，仍可能撞 stale transaction

## 哪些尝试是有益的

虽然中间走了很多弯路，但并不是完全无效。

### 1. 先修“离开表格后残留右下角 active cell”

这一步很重要。

如果不先把 `leaveStructuredTable()` 改成落到真正的表格外位置，那么：

- 我们永远无法确认按钮失效到底是 history 问题，还是 selection 仍被解释为表格内部
- 视觉现象和事务现象会混在一起

所以，这一步虽然没有直接修复撤销按钮，但它减少了误导信号。

### 2. 先验证“键盘 Cmd+Z 本身到底通不通”

这是整个排查里非常关键的分叉点。

一旦确认：

- 键盘路径最终能通
- 而按钮路径不通

就可以确定问题不是“撤销栈本身完全坏了”，而是“按钮触发路径和真实键盘路径不一致”。

这个判断帮我们缩小了范围。

### 3. 先补上 `historyKeymap`

这是最关键的一步，也是本次真正的根修之一。

如果编辑器本体都没接上 `historyKeymap`，那么后面所有围绕按钮的兼容都会变得脆弱。

## 最终可行实现

### 1. 在编辑器本体接入 `historyKeymap`

位置：

- `src/composables/useEditor.ts`

要点：

- `history()`
- `keymap.of(historyKeymap)`
- `keymap.of(defaultKeymap)`

其中 `historyKeymap` 要在 `defaultKeymap` 前面接入。

### 2. sandbox 按钮不要直接调 undo 命令

位置：

- `playground/src/views/AppSandbox.vue`

正确做法：

- 让按钮复用“真实键盘撤销”的 DOM 事件链
- 根据当前状态选择目标：
  - overlay 可见：发给 overlay
  - overlay 不可见：发给 `view.contentDOM`

也就是说，sandbox 按钮不是“实现一个新撤销逻辑”，而只是“帮开发者按下那次正确的编辑器快捷键”。

### 3. 表格离场时 selection 必须真正离开表格

位置：

- `src/extensions/structuredTable.ts`

正确做法：

- 不再把离场位置放到 `table.from` / `table.to`
- 而是扫描到最近的表格外位置

这样：

- active cell 不会残留
- 焦点语义也不会半留在表格边界

## 以后遇到同类问题，应该怎么排查

不要一上来就改按钮。

建议按下面顺序排查：

### 第 1 步：先判断是“撤销栈坏了”，还是“触发路径错了”

先测两件事：

1. 真键盘 `Cmd+Z` / `Ctrl+Z` 是否生效
2. 外部按钮是否生效

判断：

- 键盘有效、按钮无效：优先查按钮触发路径
- 键盘也无效：优先查编辑器本体是否接了 `historyKeymap`

### 第 2 步：确认当前真实输入目标是谁

关键问题：

- 焦点在 overlay？
- 焦点在 `contentDOM`？
- 还是焦点已经跑到按钮、body、浏览器其它元素？

如果输入目标判断错了，按钮再怎么发命令都可能没反应。

### 第 3 步：确认是否仍处于异步收口阶段

尤其在结构化表格里，要检查：

- overlay 是否刚关闭
- `focusCell` 是否刚清空
- selection normalization 是否还在微任务里
- 是否刚从表格离开到普通文本

如果是，外部直接调用事务命令很容易 stale。

### 第 4 步：优先复用真实用户路径

优先级应该是：

1. 真实键盘事件链
2. 编辑器公开 API
3. 最后才是外部直接调底层命令

原因：

- 越接近真实用户路径，越不容易绕过内部状态机

## 建议的长期原则

### 原则 1：sandbox 按钮只做“验证入口”，不要发明第二套编辑器行为

按钮应该尽量复用编辑器已有行为，而不是自己实现一套逻辑。

### 原则 2：凡是涉及 overlay 的场景，都先问“当前真正的输入面是谁”

不要把“看起来在编辑器里”误判成“焦点就一定在 CodeMirror 主视图里”。

### 原则 3：涉及事务历史时，先确认主链是否完整

如果：

- `history()` 有了
- 但 `historyKeymap` 没有

那后续很多现象都会变成“局部看起来对，整体一直不稳”。

## 本次问题的简短结论

一句话总结：

**这不是单纯的“撤销按钮坏了”，而是“结构化表格的 overlay / 焦点 / 表格离场 / history keymap / sandbox 触发路径”同时交叉导致的复合问题。真正的根修是先把编辑器本体的 history 主链接完整，再让 sandbox 按钮复用真实输入目标的键盘撤销路径。**
