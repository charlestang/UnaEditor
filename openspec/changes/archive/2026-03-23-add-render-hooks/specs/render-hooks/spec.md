## ADDED Requirements

### Requirement: 图片 URL 变换

系统 SHALL 允许用户在 `livePreview` 渲染阶段为图片提供同步地址变换逻辑。

#### Scenario: 外部图片地址经由代理改写

- **WHEN** 用户提供的 `image` hook 把外部图片地址改写为代理地址
- **THEN** 渲染出的图片元素 SHALL 使用改写后的 `src`

#### Scenario: 相对图片路径被补全

- **WHEN** 用户提供的 `image` hook 把相对路径解析为绝对路径
- **THEN** 渲染出的图片元素 SHALL 使用解析后的地址

#### Scenario: 未返回变换结果

- **WHEN** `image` hook 返回 `void` 或 `undefined`
- **THEN** 渲染出的图片元素 SHALL 保持原始 Markdown 中的 `src`

#### Scenario: hook 抛出异常

- **WHEN** `image` hook 执行时抛出异常
- **THEN** 系统 SHALL 输出告警
- **AND** 渲染出的图片元素 SHALL 回退到原始 `src`

### Requirement: 图片元数据注入

系统 SHALL 允许用户为渲染后的图片注入自定义类名、`data-*` 属性和行内样式。

#### Scenario: 注入自定义类名

- **WHEN** `image` hook 返回 `className`
- **THEN** 渲染出的图片元素 SHALL 同时保留默认类名并附加自定义类名

#### Scenario: 注入 dataset

- **WHEN** `image` hook 返回 `dataset`
- **THEN** 渲染出的图片元素 SHALL 生成对应的 `data-*` 属性

#### Scenario: 注入行内样式

- **WHEN** `image` hook 返回 `style`
- **THEN** 渲染出的图片元素 SHALL 应用对应的行内样式

### Requirement: 链接目标变换必须保持当前渲染模型兼容

系统 SHALL 允许用户在 `livePreview` 渲染阶段变换链接目标，但 MUST 保持默认链接渲染路径兼容，不得仅为了支持 hooks 就默认把所有链接改成独立 widget。

#### Scenario: 未提供 link hook 时保持默认行为

- **WHEN** 用户没有提供 `renderHooks.link`
- **THEN** 链接 SHALL 继续使用当前默认的 mark-decoration 渲染行为

#### Scenario: link hook 变换相对路径

- **WHEN** 用户提供的 `link` hook 把相对链接解析为新的目标地址
- **THEN** 渲染后的链接 DOM SHALL 通过稳定属性暴露变换后的目标地址
- **AND** 该稳定属性 SHALL 可被后续 hover card 或外部集成读取

#### Scenario: 系统保留字段不可被覆盖

- **WHEN** 系统已经为链接写入稳定保留字段，例如 `data-href`
- **AND** `link` hook 返回的 `dataset` 试图写入同名字段
- **THEN** 系统 SHALL 保留系统字段的值
- **AND** 用户提供的同名字段 MUST NOT 覆盖系统保留字段

#### Scenario: link hook 未返回变换结果

- **WHEN** `link` hook 返回 `void` 或 `undefined`
- **THEN** 渲染后的链接 DOM SHALL 暴露原始目标地址

#### Scenario: link hook 抛出异常

- **WHEN** `link` hook 执行时抛出异常
- **THEN** 系统 SHALL 输出告警
- **AND** 渲染后的链接 DOM SHALL 回退到原始目标地址

### Requirement: 链接元数据注入

系统 SHALL 允许用户为渲染后的链接注入自定义类名、`data-*` 属性和行内样式。

#### Scenario: 注入链接分类类名

- **WHEN** `link` hook 返回 `className`
- **THEN** 渲染后的链接 SHALL 在保留默认链接样式类名的同时附加自定义类名

#### Scenario: 注入链接 dataset

- **WHEN** `link` hook 返回 `dataset`
- **THEN** 渲染后的链接 DOM SHALL 生成对应的 `data-*` 属性

#### Scenario: 注入链接行内样式

- **WHEN** `link` hook 返回 `style`
- **THEN** 渲染后的链接 SHALL 应用对应的行内样式

### Requirement: 链接文本与嵌套行内格式必须被保留

系统 MUST NOT 允许 render hooks 修改链接的可见文本；当链接内部包含现有行内格式时，hook 也 MUST NOT 破坏这些渲染结果。

#### Scenario: hook 尝试修改链接文本

- **WHEN** `link` hook 返回了试图覆盖可见文本的字段
- **THEN** 系统 SHALL 忽略该字段
- **AND** 链接 SHALL 继续显示原始 Markdown 对应的可见文本

#### Scenario: 带嵌套强调的链接仍保持原样

- **WHEN** 链接文本内部包含粗体、斜体或其他已支持的行内样式，且存在 `link` hook
- **THEN** 链接内已有的行内渲染 SHALL 继续生效
- **AND** 系统 SHALL NOT 因为 link hook 而把该链接降级为纯文本 widget

### Requirement: hook 上下文必须来自稳定语法信息

系统 SHALL 为图片和链接 hook 提供完整上下文，至少包含目标地址、可见文本 / alt、可选 title、原始 Markdown 片段和文档位置。

#### Scenario: image hook 获取完整上下文

- **WHEN** 调用 `image` hook
- **THEN** 它 SHALL 获得 `src`、`alt`、可选 `title`、`raw` 和位置上下文

#### Scenario: link hook 获取完整上下文

- **WHEN** 调用 `link` hook
- **THEN** 它 SHALL 获得 `href`、`text`、可选 `title`、`raw` 和位置上下文

#### Scenario: 图片上下文继续兼容现有解析路径

- **WHEN** 系统为图片构造 hook 上下文
- **THEN** 它 MAY 继续复用现有图片 Markdown 解析逻辑来获取 `src` 与 `alt`
- **AND** 系统 SHALL 在此基础上补充可选 `title`、`raw` 和位置上下文

### Requirement: 默认兼容性

当用户未提供 hooks，或仅提供部分 hooks 时，系统 SHALL 保持未被定制那一侧的默认行为不变。

#### Scenario: 未提供任何 hooks

- **WHEN** 用户没有传入 `renderHooks`
- **THEN** 图片和链接 SHALL 保持当前默认渲染行为不变

#### Scenario: 只提供 image hook

- **WHEN** 用户只提供 `renderHooks.image`
- **THEN** 图片 SHALL 使用自定义渲染结果
- **AND** 链接 SHALL 保持默认渲染行为

#### Scenario: 只提供 link hook

- **WHEN** 用户只提供 `renderHooks.link`
- **THEN** 链接 SHALL 使用增强后的链接装饰
- **AND** 图片 SHALL 保持默认渲染行为

### Requirement: renderHooks 仅在 livePreview 中生效

系统 SHALL 只在 `livePreview` 为 `true` 时调用 render hooks。

#### Scenario: livePreview 关闭

- **WHEN** `livePreview` 为 `false`
- **THEN** 系统 SHALL NOT 调用 `image` 或 `link` hooks

#### Scenario: livePreview 开启

- **WHEN** `livePreview` 为 `true`
- **THEN** 系统 SHALL 在图片和链接渲染阶段调用对应的 hooks

### Requirement: renderHooks 更新后必须重新渲染

`renderHooks` 作为组件 prop 发生变化时，系统 SHALL 在 `livePreview` 开启的前提下重新渲染可见内容。

#### Scenario: 运行时替换 image hook

- **WHEN** 组件在已挂载状态下更新 `renderHooks.image`
- **THEN** 可见图片区域 SHALL 按新的 hook 结果重新渲染

#### Scenario: 运行时替换 link hook

- **WHEN** 组件在已挂载状态下更新 `renderHooks.link`
- **THEN** 可见链接区域 SHALL 按新的 hook 结果重新渲染

### Requirement: active scope 编辑体验保持不变

系统 SHALL 保留现有 active scope 机制；当光标进入链接或图片节点时，编辑器必须显示原始 Markdown 源码，而不是继续显示渲染结果。

#### Scenario: 光标进入链接

- **WHEN** 光标位于链接节点内部
- **THEN** 系统 SHALL 显示原始 Markdown 链接源码

#### Scenario: 光标进入图片

- **WHEN** 光标位于图片节点内部
- **THEN** 系统 SHALL 显示原始 Markdown 图片源码
