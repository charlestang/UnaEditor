## MODIFIED Requirements

### Requirement: Sandbox Isolation

The sandbox view SHALL contain the original raw `UnaEditor` playground components, isolated from the global styling or layout of the landing page. The sandbox SHALL prioritize regression testing and exploratory interaction, so it MUST expose a richer control surface and richer sample content than the landing page demo.

#### Scenario: Developer validates transaction-sensitive editor behavior in sandbox

- **WHEN** 开发者在 `/sandbox` 中验证结构化表格等需要关注事务顺序的交互行为
- **THEN** sandbox SHALL 提供可直接触发当前编辑器实例撤销 / 重做的验证入口，而不只依赖单一平台快捷键
- **AND** 这些入口 SHALL 允许开发者在保留当前验证上下文的前提下继续人工回归测试
