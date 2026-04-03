# editor-content-layout

## Purpose

定义编辑器内部内容版心的布局约束，确保外层编辑器壳体保持流式伸缩的同时，正文内容列、块级内容和 gutter 的排布规则一致且可配置。

## Requirements

### Requirement: 编辑器提供统一的内部内容版心

`UnaEditor` SHALL 在编辑器外壳内部渲染一个独立的内容版心，用于约束正文内容列的最大宽度。编辑器 SHALL 接受可选的 `contentMaxWidth` prop（类型为 `number`，单位为 px）；当该 prop 未显式设置时，内容版心的默认最大宽度 SHALL 为 `720px`。

#### Scenario: 默认内容版心宽度为 720px

- **WHEN** 调用方未设置 `contentMaxWidth`，且编辑器内容区域可用宽度大于 `720px`
- **THEN** 编辑器正文内容列 SHALL 居中显示
- **AND** 正文内容列的最大宽度 SHALL 为 `720px`

#### Scenario: 调用方覆盖内容版心宽度

- **WHEN** 调用方将 `contentMaxWidth` 设置为 `840`
- **THEN** 编辑器正文内容列的最大宽度 SHALL 调整为 `840px`
- **AND** 外层编辑器外框宽度 SHALL 保持由宿主容器决定

#### Scenario: 容器宽度小于内容版心宽度

- **WHEN** 编辑器内容区域可用宽度小于当前 `contentMaxWidth`
- **THEN** 正文内容列 SHALL 收缩到当前可用宽度
- **AND** 编辑器 SHALL NOT 因内容版心产生额外的横向滚动条

#### Scenario: fullscreen 下保持相同版心规则

- **WHEN** 编辑器进入浏览器全屏或屏幕全屏，且内容区域可用宽度仍大于当前 `contentMaxWidth`
- **THEN** 正文内容列 SHALL 继续保持相同的最大宽度约束
- **AND** 正文内容列 SHALL 继续在内容区域内居中

#### Scenario: 运行时更新内容版心宽度

- **WHEN** 调用方在编辑器生命周期内将 `contentMaxWidth` 从 `720` 改为 `800`
- **THEN** 编辑器 SHALL 立即更新正文内容列宽度
- **AND** 编辑器实例、文档内容与当前选择状态 SHALL 被保留

### Requirement: 左侧 gutter 不计入内容版心宽度

全局 line number gutter 与其他左侧附属 UI MUST 保持贴靠编辑器外框左侧显示，MUST NOT 被一起纳入内容版心宽度计算。

#### Scenario: 宽屏下行号仍贴左侧外框

- **WHEN** `lineNumbers` 为 `true`，且编辑器内容区域可用宽度大于当前 `contentMaxWidth`
- **THEN** 全局行号 gutter SHALL 继续贴靠编辑器外框左侧显示
- **AND** 正文内容列 SHALL 仅在 gutter 右侧的内容区域内居中
- **AND** 当前 `contentMaxWidth` SHALL 仅表示正文内容列宽度，不包含 gutter 宽度

### Requirement: 块级内容共享同一条版心宽度约束

图片、结构化表格与 fenced code block SHALL 与普通正文共享同一条内容版心宽度约束。它们可以保留各自的内部 padding、header 或 faux gutter，但 MUST NOT 超出当前正文内容列允许的最大宽度。

#### Scenario: 图片跟随内容版心宽度

- **WHEN** 文档包含图片，且图片的固有宽度大于当前正文内容列宽度
- **THEN** 图片渲染宽度 SHALL 被限制在当前正文内容列内

#### Scenario: 结构化表格跟随内容版心宽度

- **WHEN** 文档包含结构化表格，且编辑器内容区域可用宽度大于当前 `contentMaxWidth`
- **THEN** 结构化表格的整体渲染宽度 SHALL 被限制在当前正文内容列内
- **AND** 表格交互附属 UI SHALL 继续围绕该受限宽度正确定位

#### Scenario: 代码块跟随内容版心宽度

- **WHEN** 文档包含 fenced code block，且编辑器内容区域可用宽度大于当前 `contentMaxWidth`
- **THEN** 源码态与 live preview 态代码块的整体渲染宽度 SHALL 被限制在当前正文内容列内
- **AND** 代码块内部 padding、语言标签与 faux gutter SHALL 在该受限宽度内正常布局
