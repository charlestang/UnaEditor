## 1. Normalize runtime boundaries

- [x] 1.1 定义 `UnaEditor.vue` 与 `useEditor` 之间的归一化运行时输入边界，包括 typed callbacks 与统一的 appearance 输入
- [x] 1.2 调整组件壳层，只保留 props 默认值、attrs 透传、fullscreen / locale UI、Vue 事件适配与 DOM style 应用职责
- [x] 1.3 建立单一的 resolved appearance 路径，并让壳层样式与运行时主题消费者共同复用

## 2. Restructure `useEditor` internals

- [x] 2.1 在不改变当前返回 API 的前提下，将 `useEditor` 重组为稳定 facade 与内部运行时分层
- [x] 2.2 将当前平铺的 watcher 收拢为文档同步、appearance 同步、编辑行为同步与集成同步四条领域路径
- [x] 2.3 抽离外部 `modelValue` 同步策略边界，并在第一阶段保持整篇替换行为兼容

## 3. Clarify semantics and isolate integrations

- [x] 3.1 按规格区分 `disabled` 与 `readonly` 的交互语义，并确保 placeholder、focus/select/copy 与内容变更行为符合契约
- [x] 3.2 将 Vim 的全局一次性初始化与实例级启停逻辑分离，消除重复注册和多实例风险
- [x] 3.3 保持 `drop` 事件与 `getEditorView()` 的公开兼容性，同时把它们收敛为明确的高级兼容面

## 4. Verify compatibility

- [x] 4.1 补齐或更新测试，覆盖 theme / appearance 同步、`disabled` / `readonly`、多实例 Vim、`drop` 兼容和高层命令 API
- [x] 4.2 更新文档与类型注释，反映新的边界原则和契约澄清，同时保持当前公开 API 的兼容表述
