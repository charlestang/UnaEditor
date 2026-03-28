## 1. 代码块状态模型与行结构

- [x] 1.1 新增 `livePreview` 专用的代码块插件或同等职责模块，避免把源码态装饰器扩展成统一状态机
- [x] 1.2 为 fenced code block 建立独立的 active scope 判断，覆盖 opening fence、代码正文和 closing fence 全部范围
- [x] 1.3 使用 `Decoration.line` + `Decoration.replace` + `Decoration.widget` 的组合实现 begin/body/end 行模型
- [x] 1.4 在非激活状态下，将 opening fence 行渲染为代码块内部的 header affordance row，而不是独立工具栏
- [x] 1.5 在非激活状态隐藏 closing fence 的主显示内容，并保留代码块尾部壳子语义
- [x] 1.6 在 active scope 下恢复 raw opening / closing fence 源码显示，同时尽量保留代码块壳子与布局稳定性

## 2. Header affordance 与复制交互

- [x] 2.1 建立语言标识符的 raw / normalized / display label 映射，并让语言标签与语法高亮共用同一归一化来源
- [x] 2.2 在 header row 中显示语言标签；未声明语言时不显示伪造标签占位
- [x] 2.3 实现右上角 compact icon-like copy affordance，并确保复制结果只包含代码正文
- [x] 2.4 为 Clipboard API 不可用场景提供可控降级路径
- [x] 2.5 确保 copy affordance 为非编辑交互元素，点击或键盘触发时不会先强制切回源码态
- [x] 2.6 确保 `readonly` 场景下 copy affordance 继续可用

## 3. Faux gutter、样式与主题协同

- [x] 3.1 仅在 `livePreview` 代码块阅读态中，将行号从 `::before` 前缀式实现调整为 block-internal faux gutter
- [x] 3.2 让 begin/body/end 行共享稳定的 leading slot 宽度，并在 fence 行保留空槽
- [x] 3.3 更新 `codeThemeExtension.ts`，让代码块外壳、header row、faux gutter、代码主体和 fence 切换态与代码主题协同
- [x] 3.4 验证 light / dark 与自定义 editor theme 下的代码块阅读态视觉保持一致
- [x] 3.5 验证 `codeLineNumbers` 开启时，行号观感更接近 gutter，而不是带强分隔线的前缀
- [x] 3.6 验证全局 `lineWrap` 开启时，wrapped code line 的续行仍与正文列对齐

## 4. Playground 与测试

- [x] 4.1 在 playground 中增加适合验证 Obsidian-like 代码块交互、语言标签、copy affordance 与 faux gutter 的示例
- [x] 4.2 增加非激活状态下 opening fence 行显示 header row、closing fence 不显示源码的回归测试
- [x] 4.3 增加 active scope 下 raw fence 恢复显示但块级壳子仍保留的回归测试
- [x] 4.4 增加语言标签与语言别名映射测试，并覆盖未知语言标识符不会被错误归一化
- [x] 4.5 增加 copy affordance 复制纯代码正文的测试
- [x] 4.6 增加 faux gutter 行号对齐测试，覆盖 begin/body/end 行的空槽与正文编号
- [x] 4.7 增加 `readonly` 场景下 copy affordance 仍可用的回归测试
- [x] 4.8 增加点击 copy affordance、进出代码块和跨 fence 导航的交互回归测试
- [x] 4.9 增加 `lineWrap` 开启时 wrapped line 与 faux gutter 的对齐回归测试
- [x] 4.10 跑通现有代码块语法高亮、代码主题、行号与 live preview 导航相关测试
- [x] 4.11 增加 `codeFontFamily` 不影响编辑器 gutter 与代码块行号字体的回归测试
