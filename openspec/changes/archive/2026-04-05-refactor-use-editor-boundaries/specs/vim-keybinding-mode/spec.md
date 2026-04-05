## ADDED Requirements

### Requirement: Vim 的全局配置在多实例与重复启停下必须保持幂等

实现 Vim 模式所需的全局命令、motion 与结构化表格相关覆盖逻辑 MUST 以幂等方式注册。单个编辑器实例启用或关闭 Vim 模式 MUST NOT 造成重复注册，也 MUST NOT 破坏其他已挂载实例的 Vim 行为。

#### Scenario: 多个 Vim 实例并存

- **WHEN** 同一页面中存在多个启用了 Vim 模式的编辑器实例
- **THEN** 共享的 Vim 全局配置 SHALL 安全复用
- **AND** 每个获得焦点的实例 SHALL 保持正确的保存与导航行为

#### Scenario: 同一实例重复启停 Vim 模式

- **WHEN** 调用方在同一编辑器实例上重复切换 `vimMode`
- **THEN** 编辑器 SHALL NOT 因重复启停产生额外的重复注册或行为漂移
- **AND** Vim 相关命令与表格覆盖逻辑 SHALL 保持一致
