## ADDED Requirements

### Requirement: 组件壳层与编辑器运行时必须保持明确职责边界

`UnaEditor` SHALL 继续作为唯一公开组件入口。组件壳层 MUST 负责 props 默认值与归一化、`attrs` 透传、locale / fullscreen UI、本地 DOM style 应用以及 Vue 事件适配。编辑器运行时 MUST 负责 `EditorView` 生命周期、扩展图谱、实例级事务与命令执行。`useEditor` SHALL 作为壳层与运行时之间的稳定 facade，而不是继续承载所有底层实现细节。

#### Scenario: 壳层状态变化不重建编辑器运行时

- **WHEN** 组件壳层中的 locale 或 fullscreen 提示状态发生变化
- **THEN** 壳层 SHALL 更新对应的 Vue UI 状态
- **AND** 已挂载的编辑器运行时 SHALL 继续复用同一个 `EditorView` 实例

#### Scenario: 运行时变更不要求壳层直接参与事务

- **WHEN** 编辑器需要应用文档更新或扩展重配置
- **THEN** 这些变更 SHALL 由编辑器运行时通过实例级事务执行
- **AND** 组件壳层 SHALL NOT 直接调用底层 CodeMirror dispatch 参与该事务

### Requirement: appearance 消费者必须共享单一归一化输入

对于每个已挂载的编辑器实例，组件壳层与编辑器运行时中所有 appearance 敏感的消费者 MUST 共享同一份归一化输入。该输入至少覆盖解析后的主题基线、字体设置与正文版心宽度。原始 `theme`、字体与 `contentMaxWidth` props MUST NOT 在多个层次中被独立解释为多个事实来源。

#### Scenario: 主题切换时壳层与运行时使用同一解析结果

- **WHEN** 调用方在运行时将 `theme` 从 `'light'` 切换为自定义 dark 主题对象
- **THEN** 壳层应用的 surface / table 相关样式与运行时消费的主题相关配置 SHALL 来自同一份解析结果
- **AND** 编辑器实例 SHALL NOT 因此被重建

#### Scenario: 字体与版心变化通过同一 appearance 更新触发几何失效

- **WHEN** 调用方在运行时修改 `fontFamily`、`codeFontFamily`、`fontSize` 或 `contentMaxWidth`
- **THEN** 所有受影响的布局与几何消费者 SHALL 从同一条 appearance 更新路径接收变更
- **AND** 不同层次 SHALL NOT 各自重复解析同一组原始 props 才能完成更新

### Requirement: 运行时同步必须按领域组织

编辑器运行时的同步逻辑 MUST 至少按文档同步、appearance 同步、编辑行为同步与可选集成同步四个领域组织。某一领域的变更 MUST NOT 强制不相关领域参与同步，除非经过共享 facade 的显式编排。

#### Scenario: 行为开关更新不触发文档同步

- **WHEN** 调用方修改 `lineWrap`、`lineNumbers` 或 `placeholder`
- **THEN** 编辑器运行时 SHALL 仅重配置对应的编辑行为消费者
- **AND** 文档同步路径 SHALL NOT 因此被触发

#### Scenario: 外部文档更新不重建其它运行时配置

- **WHEN** 父组件更新 `modelValue`
- **THEN** 编辑器运行时 SHALL 通过文档同步路径更新当前内容
- **AND** 已启用的 appearance 配置、行为开关与可选集成 SHALL 继续保留
