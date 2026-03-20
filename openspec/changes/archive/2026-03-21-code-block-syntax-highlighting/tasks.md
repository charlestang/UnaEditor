# 实现任务清单

## 1. 依赖和设置

- [x] 1.1 将 @codemirror/language-data 添加到 package.json
- [x] 1.2 将 @codemirror/lang-javascript 添加到 package.json
- [x] 1.3 将 @codemirror/lang-css 添加到 package.json
- [x] 1.4 将 @codemirror/lang-python 添加到 package.json（可选，用于懒加载）
- [x] 1.5 将 @codemirror/lang-php 添加到 package.json（可选，用于懒加载）
- [x] 1.6 将 @codemirror/lang-java 添加到 package.json（可选，用于懒加载）
- [x] 1.7 将 @codemirror/legacy-modes 添加到 package.json（用于 shell、go 等）
- [x] 1.8 运行 pnpm install 安装新依赖

## 2. 类型定义

- [x] 2.1 在 src/types/editor.ts 中添加 CodeThemeName 类型
- [x] 2.2 在 EditorProps 接口中添加 codeTheme 属性
- [x] 2.3 在 EditorProps 接口中添加 codeLineNumbers 属性
- [x] 2.4 创建 CodeThemeColors 接口用于主题颜色定义
- [x] 2.5 创建 CodeTheme 接口用于主题结构

## 3. 主题系统

- [x] 3.1 创建 src/themes/codeThemes.ts 文件
- [x] 3.2 定义包含所有 9 个主题的 CODE_THEMES 注册表
- [x] 3.3 实现 one-dark 主题颜色
- [x] 3.4 实现 dracula 主题颜色
- [x] 3.5 实现 monokai 主题颜色
- [x] 3.6 实现 solarized-dark 主题颜色
- [x] 3.7 实现 nord 主题颜色
- [x] 3.8 实现 tokyo-night 主题颜色
- [x] 3.9 实现 github-light 主题颜色
- [x] 3.10 实现 solarized-light 主题颜色
- [x] 3.11 实现 atom-one-light 主题颜色
- [x] 3.12 实现 getCodeTheme() 辅助函数
- [x] 3.13 实现 getDefaultCodeTheme() 辅助函数

## 4. 代码块装饰插件（独立，始终开启）

- [x] 4.1 创建 src/extensions/codeBlockDecorator.ts 文件
- [x] 4.2 实现 CodeBlockDecoratorPlugin 类
- [x] 4.3 遍历语法树找到所有 FencedCode 节点
- [x] 4.4 为代码块的每一行添加 line decoration，打上 cm-code-block-line class
- [x] 4.5 添加代码块背景样式（不依赖 hybridMarkdown）
- [x] 4.6 可选：为每一行添加 data-code-line-number 属性
- [x] 4.7 跳过围栏标记行（```）
- [x] 4.8 确保装饰始终存在，不受光标位置影响
- [x] 4.9 添加 CSS 样式：使用 ::before 伪元素渲染行号
- [x] 4.10 确保行号不进入文本流，不影响选择和光标定位

## 5. 主题扩展构建器

- [x] 5.1 创建 src/extensions/codeThemeExtension.ts 文件
- [x] 5.2 实现 createCodeThemeExtension() 函数
- [x] 5.3 为 .cm-line.cm-code-block-line 添加背景和前景色
- [x] 5.4 为代码块行内的选择添加 CSS 主题
- [x] 5.5 为所有语法标记类型添加 CSS 主题（.cm-line.cm-code-block-line .tok-keyword 等）
- [x] 5.6 确保主题只作用于带 cm-code-block-line class 的行

## 6. 语言支持系统

- [x] 6.1 创建 src/extensions/languageSupport.ts 文件
- [x] 6.2 定义 CORE_LANGUAGES 映射（JS、TS、CSS、Markdown、Shell）
- [x] 6.3 定义带有懒加载器的 EXTENDED_LANGUAGES 映射（PHP、Go、Java、Python 等）
- [x] 6.4 实现 getLanguageSupport() 异步函数
- [x] 6.5 实现语言缓存机制
- [x] 6.6 实现 getSupportedLanguages() 辅助函数
- [x] 6.7 实现 isLanguageSupported() 辅助函数
- [x] 6.8 添加语言别名支持（js→javascript、ts→typescript 等）

## 7. Markdown 解析器配置

- [x] 7.1 更新 useEditor.ts 以导入带语言支持的 markdown
- [x] 7.2 为核心语言创建 LanguageDescription 数组
- [x] 7.3 为扩展语言创建带懒加载的 LanguageDescription 数组
- [x] 7.4 使用 codeLanguages 参数配置 markdown()
- [x] 7.5 测试 TypeScript 代码块的嵌套解析是否工作

## 8. useEditor 中的代码主题集成

- [x] 8.1 在 useEditor.ts 中添加 codeThemeCompartment
- [x] 8.2 实现 resolveCodeTheme() 辅助函数
- [x] 8.3 在扩展数组中初始化代码主题扩展
- [x] 8.4 添加对 codeTheme 属性更改的监听
- [x] 8.5 添加对编辑器主题更改的监听（影响自动模式）
- [x] 8.6 确保主题重新配置动态工作

## 9. useEditor 中的装饰器和行号集成

- [x] 9.1 在 useEditor.ts 中添加 codeBlockDecoratorCompartment
- [x] 9.2 创建 createCodeBlockDecoratorExtension() 函数
- [x] 9.3 在扩展数组中初始化装饰器扩展
- [x] 9.4 添加对 codeLineNumbers 属性更改的监听
- [x] 9.5 确保装饰器与语法高亮和主题配合工作

## 10. 组件属性

- [x] 10.1 在 UnaEditor.vue 中添加 codeTheme 属性，默认值为 'auto'
- [x] 10.2 在 UnaEditor.vue 中添加 codeLineNumbers 属性，默认值为 false
- [x] 10.3 将属性传递给 useEditor composable
- [x] 10.4 更新组件文档注释

## 11. 与现有功能的集成

- [x] 11.1 从 hybridMarkdown.ts 的 HYBRID_SCOPE_NODES 中移除 FencedCode
- [x] 11.2 确保代码块装饰插件始终开启，不依赖 active-scope
- [x] 11.3 验证光标进入代码块时，背景和行号持续保留
- [x] 11.4 确保语法高亮在普通模式下工作
- [x] 11.5 确保语法高亮在实时预览模式下工作
- [x] 11.6 验证代码块仍然遵守 codeFontFamily 属性
- [x] 11.7 测试与 hybridMarkdown.ts 其他装饰（标题、强调、链接）的共存
- [x] 11.8 确保与现有代码字体样式没有冲突

## 12. 测试

- [x] 12.1 为语言支持系统创建测试文件
- [x] 12.2 测试核心语言同步加载
- [x] 12.3 测试扩展语言异步加载
- [x] 12.4 测试语言缓存正确工作
- [x] 12.5 为主题系统创建测试文件
- [x] 12.6 测试所有 9 个主题正确渲染
- [x] 12.7 测试主题切换动态工作
- [x] 12.8 测试自动主题跟随编辑器主题
- [x] 12.9 为行号创建测试文件
- [x] 12.10 测试行号正确显示
- [x] 12.11 测试行号排除围栏标记
- [x] 12.12 测试行号与语法高亮配合工作

## 13. Playground 更新

- [x] 13.1 更新 DemoEditor.vue 以添加代码主题选择器
- [x] 13.2 添加 codeLineNumbers 复选框控件
- [x] 13.3 更新演示内容以包含多种语言的代码块
- [x] 13.4 在 playground 中测试所有主题组合
- [x] 13.5 验证所有主题的视觉外观

## 14. 文档

- [x] 14.1 使用新属性文档更新 README.md
- [x] 14.2 记录所有 9 个支持的主题
- [x] 14.3 添加 codeTheme 属性的使用示例
- [x] 14.4 添加 codeLineNumbers 属性的使用示例
- [x] 14.5 记录支持的语言列表
- [x] 14.6 如需要添加迁移指南

## 15. 性能优化

- [x] 15.1 验证扩展语言的懒加载工作
- [x] 15.2 测试包大小影响（应 < 100KB gzipped）
- [x] 15.3 确保没有代码块的文档没有性能下降
- [x] 15.4 测试大型代码块（100+ 行）
- [x] 15.5 验证增量语法高亮工作

## 16. 最终润色

- [x] 16.1 审查所有代码以确保与项目风格一致
- [x] 16.2 确保所有 TypeScript 类型正确导出
- [x] 16.3 运行 linter 并修复任何问题
- [x] 16.4 在所有修改的文件上运行格式化程序
- [x] 16.5 在浅色和深色编辑器主题下测试
- [x] 16.6 验证可访问性（对比度）
- [x] 16.7 使用适当的消息创建 git 提交
