## Context

`UnaEditor.vue` 当前大体仍是 Vue 组件壳层，但它已经开始承担 appearance 解析与 CSS 变量写入；`useEditor.ts` 则同时承担 `EditorView` 生命周期、扩展装配、事件桥接、watch 同步、Vim 配置、布局重测量和命令门面等职责。结果是：

- 组件壳层与编辑器适配层没有稳定边界
- `theme` / 字体 / 版心相关配置缺少单一事实来源
- 运行时同步以平铺 watcher 方式增长，扩展成本高
- Vim 的全局副作用与实例级逻辑混在一起，存在幂等性和多实例风险
- `disabled` / `readonly` 的公开契约与内部实现存在漂移
- `getEditorView()` 与 `drop` 事件等兼容面已经反向约束内部实现

这次 change 的约束也很明确：不推翻 CodeMirror 6 方案，不重写组件，不主动引入 breaking public API，而是在现有组件壳层与适配层之间建立可持续的内部边界。

## Goals / Non-Goals

**Goals:**

- 保留 `UnaEditor` 作为唯一公开组件入口，并保留 `useEditor` 作为当前内部 facade
- 在不改变现有 props、events 和 exposed methods 默认行为的前提下，为 `useEditor` 建立清晰的内部分层
- 建立统一的 resolved appearance 输入，消除壳层与运行时对同一组 appearance props 的重复解析
- 将运行时同步按领域拆分为可独立理解和验证的路径
- 将 Vim 的全局配置与实例级启停明确分离，支持多实例与重复启停
- 明确 `disabled` 与 `readonly` 的契约边界，并以兼容方式收紧实现

**Non-Goals:**

- 不替换 Vue 组件壳层或 CodeMirror 6 作为底层基础
- 不在本次 change 中移除 `getEditorView()` 或把 `drop` 事件拆成多个 breaking 事件
- 不在本次 change 中直接承诺更细粒度的文档 diff 同步算法
- 不顺手重做 hybrid、table、code block 等业务扩展的内部实现

## Decisions

### Decision 1: 保留当前公开形态，但把 `useEditor` 降为“稳定 facade + 内部分层编排器”

`UnaEditor.vue` 继续作为组件壳层，对外提供 props、events、attrs 透传和实例 expose。`useEditor` 继续作为壳层调用的单一入口，以避免当前实现期出现新的公开集成面。

但 `useEditor` 内部不再继续承载所有细节，而是收拢为以下职责边界：

- 壳层边界：props 默认值、`attrs` 透传、locale / fullscreen UI、本地 DOM style 应用、Vue emit 适配
- 运行时内核：`EditorView` 生命周期、扩展图谱、instance-bound dispatch
- 运行时同步：文档同步、appearance 同步、编辑行为同步、集成扩展同步
- 命令门面：对外暴露的高层方法与高级 escape hatch

**Rationale**

- 不改公开组件形态，兼容成本最低
- 先分内部职责，再谈后续能力演进，能显著缩小改动半径

**Rejected Alternative**

- 直接拆成多个新的公开 composable。拒绝原因：会把“内部重构”升级为新的公开 API 设计问题，超出本次范围

### Decision 2: appearance 使用单一归一化输入，而不是壳层与运行时分别解析原始 props

本次 change 将建立统一的 resolved appearance 概念，至少覆盖：

- 解析后的编辑器主题基线与内容 token
- 派生出来的代码主题决策基础
- 字体相关配置
- 正文版心宽度等布局令牌

组件壳层负责把这份归一化结果应用到 DOM style；编辑器运行时负责消费同一份结果来更新 CodeMirror theme、内容样式和几何失效信号。两层都不再把原始 `theme`、字体或 `contentMaxWidth` 当成独立事实来源重复解释。

**Rationale**

- 这是解决 theme / appearance 双重解析和跨边界耦合的最小闭环
- 统一 appearance 输入后，布局重测量可以从“猜哪些 prop 变了”转为“响应 appearance 变更”

**Rejected Alternative**

- 保留双重解析，只靠约定同步。拒绝原因：问题本身就来自缺少单一事实来源

### Decision 3: Vue 事件适配回到组件边缘，运行时只面向 typed callback / domain event sink

`useEditor` 与更内层的运行时逻辑不再直接依赖 Vue `emit` 语义。组件壳层负责把 Vue 事件系统适配为运行时可调用的 typed callbacks；运行时只发出领域事件，例如内容变化、保存、聚焦变化、文件输入。

**Rationale**

- 可以在不改变公开事件名的前提下，降低编辑器运行时对 Vue 组件系统的耦合
- 后续无论是测试、复用还是事件语义微调，都有更清晰的边界

**Rejected Alternative**

- 继续让运行时直接调用 `emit`。拒绝原因：这会把组件事件系统继续下沉到最底层

### Decision 4: 运行时同步按领域组织，而不是继续使用 watcher-per-prop 的平铺结构

本次重构将运行时同步收拢为四条主线：

- 文档同步：`modelValue` 与内部事务回写
- appearance 同步：主题、代码主题、字体、版心和相关几何失效
- 行为同步：`lineNumbers`、`lineWrap`、`placeholder`、`livePreview` 等实例级行为切换
- 集成同步：Vim 等可选集成模块的启停

短期内仍可以继续使用 Vue watcher 驱动这些同步，但 watcher 必须按领域组织，而不是分散在顶层函数里彼此并列。

**Rationale**

- 这是一条渐进式路径，不要求立刻重写为完全不同的响应模型
- 领域收拢后，可以明确每条同步路径的输入、输出和回归面

**Rejected Alternative**

- 立即改成全新的状态机或统一 reducer。拒绝原因：风险过高，且没有必要一步到位

### Decision 5: Vim 拆成“全局一次性初始化”与“实例级绑定”两层

Vim 模式相关的全局命令、motion 和结构化表格覆盖逻辑必须幂等注册，并与具体 `EditorView` 的启停分离。实例级切换 `vimMode` 时，只影响当前编辑器实例的启用状态；多实例并存时，不允许因重复注册导致行为漂移。

**Rationale**

- 当前最有风险的不是 Vim 能否工作，而是它是否会在第二个实例或重复启停后悄悄失真
- 这类问题必须通过边界设计解决，而不是依赖“避免重复调用”的约定

### Decision 6: `disabled` 与 `readonly` 先收紧契约，再决定底层映射细节

这次 change 先把组件契约明确为：

- `disabled`：用户不能通过正常交互修改内容，也不应继续参与普通编辑交互
- `readonly`：内容不可变，但仍可聚焦、选中、复制，并继续使用非写入型能力

底层是否共享同一部分 CodeMirror 机制不是本次 spec 的重点；重点是外部契约不能继续被内部实现偷懒地合并。

**Rationale**

- 公开文档和 props 已经把两者声明为不同语义，内部必须向契约对齐

### Decision 7: 外部文档同步先保留兼容行为，但抽象成独立策略边界

本次 change 不强求立刻用最优 diff 算法替换当前整篇替换方案，但会把外部 `modelValue` 同步从顶层 watcher 细节提升为独立策略边界。第一阶段默认策略仍可维持当前兼容行为，只要不重建实例、不破坏已启用的运行时能力即可。

**Rationale**

- 先把“同步方式可演进”这件事做出来，比现在就追求复杂 diff 更实际

### Decision 8: `getEditorView()` 与 `drop` 继续保留，但明确为兼容面而非首选集成路径

高层命令 API 仍然是常规集成的首选路径。`getEditorView()` 保留为高级 escape hatch，`drop` 事件继续兼容当前对 drag/paste 图片输入的统一暴露方式。内部可以先区分来源和层次，但不在本次 change 中把这种区分强制暴露为 breaking API。

**Rationale**

- 这符合“先做内部分层、再考虑增量公开能力”的渐进策略

## Risks / Trade-offs

- [内部模块数量增加，短期理解成本上升] → 保持 `UnaEditor` 与 `useEditor` 外形不变，并用 design/specs 固定各层职责
- [单一 appearance 输入需要新的归一化类型] → 先限定覆盖 theme / 字体 / 版心三类输入，不在第一阶段过度泛化
- [收紧 `disabled` / `readonly` 语义可能暴露现有实现与测试缺口] → 先通过 specs 和任务明确回归面，再逐步补齐测试
- [Vim 幂等化可能揭示当前全局注册顺序依赖] → 用多实例和重复启停场景作为专门验证项
- [继续保留整篇替换同步策略，性能收益有限] → 本次以边界清晰为先，把优化空间留给后续 change
- [保留 `getEditorView()` 会继续约束内部重构自由度] → 明确其为高级兼容面，新能力优先进入高层命令 API

## Migration Plan

1. 先在内部建立分层边界，保持当前公开 props、events 和 exposed methods 不变。
2. 让组件壳层改为向运行时传递归一化 appearance 和 typed callbacks，消除直接 `emit` 依赖与重复 appearance 解析。
3. 逐步收拢 watcher 为领域同步路径，并将 Vim 全局初始化与实例级逻辑拆开。
4. 在现有公开行为兼容的前提下，补齐 `disabled` / `readonly`、主题同步、多实例 Vim 与高级 API 的回归测试。

回滚策略：

- 若某一层抽取导致回归，可以在不影响公开 API 的前提下单独回退该层内部实现
- 因为本次 change 不主动引入 breaking public API，回滚不应牵涉外部调用方迁移

## Open Questions

- `disabled` 是否在第一阶段就彻底阻断 focus / blur 事件，还是仅阻断编辑与文件输入
- 未来若需要更精确的 paste 语义，应该新增独立事件，还是先给现有 `drop` 事件补充来源元数据
