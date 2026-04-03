<script setup lang="ts">
import { computed, ref } from 'vue';
import { UnaEditor, version } from 'una-editor';
import type { EditorExposed, EditorTheme } from 'una-editor';

// Editor state
const content = ref(
  '# Hello UnaEditor\n\n这是一个基于 CodeMirror 6 的 Markdown 编辑器。\n\n## 功能特性\n\n- 支持 v-model 双向绑定\n- 支持行号显示\n- 支持 Hybrid Markdown 渲染\n- 支持国际化（中英文）\n- 支持亮色/暗色主题\n- 支持全屏模式\n- 支持图片拖拽和粘贴\n- 支持 Mod-s 保存快捷键\n\n### 列表预览\n\n- 无序列表会以更接近阅读态的 bullet 显示\n* `*` 和 `+` 这类标准 marker 也支持\n+ 混合和嵌套列表可以继续编辑\n1. 有序列表支持 `.` 分隔符\n2) 也支持 `)` 分隔符\n\n- [ ] Task list 会显示为只读 checkbox\n- [x] 点击 checkbox 不会直接切换状态，仍然通过源码编辑\n\n> 这是一段 blockquote，用来演示首期的保守增强效果。\n\n`inline code`、**bold**、*italic* 和 [link](https://codemirror.net/) 都可以在 hybrid 模式下看到更接近渲染态的显示。\n\n![UnaEditor Demo](https://placehold.co/320x160/orange/white?text=UnaEditor)\n\n## Obsidian-like Code Fence\n\n下面三段代码块适合一起验证：移入光标时 fence 源码恢复、移出时 header row 回来、右上角 copy icon 是否稳定、以及 faux gutter 的观感。\n\n```ts\nfunction greet(name: string) {\n  return `Hello, ${name}`;\n}\n```\n\n```\nPlain fence without a language label.\nSecond line stays copyable without fence markers.\n```\n\n```unknown-lang\nconst veryLongValue = \"This code fence intentionally keeps a long single line so you can toggle lineWrap and inspect whether wrapped lines still align to the code column instead of collapsing back under the faux gutter.\";\n```\n\n## 表格结构化编辑\n\n| feature | status | notes |\n| :--- | :---: | ---: |\n| navigation | ready | 方向键、Enter、Tab |\n| multiline | rendered | 第一行<br>第二行<br/>第三行 |\n| source fallback | stable | 关闭 Live Preview 或写出不完整表格即可回源码 |\n| image | ![demo](https://placehold.co/120x72/0f172a/ffffff?text=Cell) | 图片也会在非活动 cell 渲染 |\n\n| action | shortcut | result |\n| --- | --- | --- |\n| move down | Enter | 最后一行会自动补新行 |\n| move up | Shift+Enter | 首行保持不动 |\n| paste | text/plain | 多行纯文本会转成 `<br>` |\n| vim | `j/k/h/l` | normal / insert 都可继续验证 |\n\n### 源码兜底样例\n\n下面这段故意损坏了一行列数，应该保持源码态，不进入结构化表格：\n\n| broken | table | sample |\n| --- | --- | --- |\n| only two cells | fallback |\n\n试试点击单元格编辑、右键 `:::` handle、点击边缘 `+` handle、切换 Vim normal / insert，或者观察这段损坏表格的源码兜底行为。',
);

// Editor options
const lineNumbers = ref(true);
const lineWrap = ref(true);
const livePreview = ref(true);
const vimMode = ref(false);
const locale = ref<'zh-CN' | 'en-US'>('zh-CN');
const themeMode = ref<'light' | 'dark' | 'custom-dark'>('light');
const fontSize = ref<number | undefined>(undefined);
const fontFamily = ref<string | undefined>(undefined);
const codeFontFamily = ref<string | undefined>(undefined);
const contentMaxWidth = ref(720);
const codeTheme = ref<
  | 'auto'
  | 'one-dark'
  | 'dracula'
  | 'monokai'
  | 'solarized-dark'
  | 'solarized-light'
  | 'nord'
  | 'tokyo-night'
  | 'github-light'
  | 'atom-one-light'
>('auto');
const codeLineNumbers = ref(false);

const customDarkTheme: EditorTheme = {
  name: 'Custom Dark',
  type: 'dark',
  content: {
    link: {
      color: '#f59e0b',
    },
    inlineCode: {
      backgroundColor: 'rgba(245, 158, 11, 0.14)',
    },
  },
  table: {
    headerBackground: 'rgba(245, 158, 11, 0.12)',
  },
};

const theme = computed(() => {
  return themeMode.value === 'custom-dark' ? customDarkTheme : themeMode.value;
});

// Editor ref
const editorRef = ref<EditorExposed>();

// Event handlers
const handleChange = (value: string) => {
  console.log('Content changed:', value.length, 'characters');
};

const handleSave = () => {
  alert('保存快捷键触发！内容长度：' + content.value.length + ' 字符');
};

const handleDrop = (files: File[]) => {
  console.log('Image files dropped:', files);
  alert(`收到 ${files.length} 个图片文件：\n${files.map((f) => f.name).join('\n')}`);
};

// Method demos
const focusEditor = () => {
  editorRef.value?.focus();
};

const getSelectedText = () => {
  const selection = editorRef.value?.getSelection();
  alert(selection ? `选中文本：${selection}` : '没有选中文本');
};

const toggleBrowserFullscreen = () => {
  editorRef.value?.toggleFullscreen('browser');
};

const toggleScreenFullscreen = () => {
  editorRef.value?.toggleFullscreen('screen');
};

const exitFullscreen = () => {
  editorRef.value?.exitFullscreen();
};

const handleInsertText = () => {
  editorRef.value?.insertText('🚀 [Inserted Text] ');
  editorRef.value?.focus();
};

const runEditorHistory = (kind: 'undo' | 'redo') => {
  const view = editorRef.value?.getEditorView();
  if (!view) return;

  const isMac = /Mac|iPhone|iPad|iPod/i.test(window.navigator.platform);
  const overlay = view.dom.querySelector<HTMLTextAreaElement>(
    '.cm-structured-table-overlay-visible',
  );
  const target = overlay ?? view.contentDOM;
  const key = kind === 'redo' && !isMac ? 'y' : 'z';
  const withShift = kind === 'redo' && isMac;

  const invoke = () => {
    if (overlay) {
      overlay.focus();
    } else {
      view.focus();
    }

    target.dispatchEvent(
      new KeyboardEvent('keydown', {
        key,
        metaKey: isMac,
        ctrlKey: !isMac,
        shiftKey: withShift,
        bubbles: true,
        cancelable: true,
      }),
    );
    target.dispatchEvent(
      new KeyboardEvent('keyup', {
        key,
        metaKey: isMac,
        ctrlKey: !isMac,
        shiftKey: withShift,
        bubbles: true,
        cancelable: true,
      }),
    );
  };

  window.setTimeout(() => {
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        invoke();
      });
    } else {
      invoke();
    }
  }, 0);
};

const handleUndo = () => {
  runEditorHistory('undo');
};

const handleRedo = () => {
  runEditorHistory('redo');
};

const showHeadings = () => {
  const headings = editorRef.value?.getHeadings();
  if (!headings || headings.length === 0) {
    alert('No headings found.');
    return;
  }
  const tree = headings
    .map((h) => `${'  '.repeat(h.level - 1)}- [H${h.level}] ${h.text} (Line ${h.line})`)
    .join('\n');
  alert(`Document TOC:\n\n${tree}`);
};

const testScrollToLine = () => {
  const lineStr = prompt('Enter a line number to scroll to:', '10');
  if (lineStr) {
    const line = parseInt(lineStr, 10);
    if (!isNaN(line)) {
      editorRef.value?.scrollToLine(line);
    }
  }
};

const formatLineNumber = (lineNumber: number) => String(lineNumber).padStart(3, ' ');

const contentWithLineNumbers = () =>
  content.value
    .split('\n')
    .map((line, index) => `${formatLineNumber(index + 1)} | ${line}`)
    .join('\n');
</script>

<template>
  <div class="playground">
    <h1>UnaEditor Playground</h1>
    <p>Editor version: {{ version }}</p>

    <div class="controls">
      <div class="control-group">
        <label>
          <input v-model="lineNumbers" type="checkbox" />
          显示行号
        </label>
      </div>

      <div class="control-group">
        <label>
          <input v-model="lineWrap" type="checkbox" />
          自动折行
        </label>
      </div>

      <div class="control-group">
        <label>
          <input v-model="livePreview" type="checkbox" />
          Live Preview
        </label>
      </div>

      <div class="control-group">
        <label>
          <input v-model="vimMode" type="checkbox" />
          Vim 模式
        </label>
      </div>

      <div class="control-group">
        <label>语言：</label>
        <select v-model="locale">
          <option value="zh-CN">中文</option>
          <option value="en-US">English</option>
        </select>
      </div>

      <div class="control-group">
        <label>主题：</label>
        <select v-model="themeMode">
          <option value="light">亮色</option>
          <option value="dark">暗色</option>
          <option value="custom-dark">自定义暗色</option>
        </select>
      </div>

      <div class="control-group">
        <label>字号：</label>
        <select v-model="fontSize">
          <option :value="undefined">默认 (14px)</option>
          <option :value="12">12px</option>
          <option :value="14">14px</option>
          <option :value="16">16px</option>
          <option :value="18">18px</option>
          <option :value="20">20px</option>
        </select>
      </div>

      <div class="control-group">
        <label>正文字体：</label>
        <select v-model="fontFamily">
          <option :value="undefined">默认</option>
          <option value="Georgia, serif">Georgia（衬线）</option>
          <option value="'Helvetica Neue', Arial, sans-serif">Helvetica Neue</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
        </select>
      </div>

      <div class="control-group">
        <label>代码字体：</label>
        <select v-model="codeFontFamily">
          <option :value="undefined">默认</option>
          <option value="Fira Code, monospace">Fira Code</option>
          <option value="JetBrains Mono, monospace">JetBrains Mono</option>
          <option value="Courier New, monospace">Courier New</option>
        </select>
      </div>

      <div class="control-group">
        <label>内容版心：</label>
        <select v-model="contentMaxWidth">
          <option :value="560">560px</option>
          <option :value="640">640px</option>
          <option :value="720">720px</option>
          <option :value="840">840px</option>
          <option :value="960">960px</option>
        </select>
      </div>

      <div class="control-group">
        <label>代码主题：</label>
        <select v-model="codeTheme">
          <option value="auto">自动</option>
          <option value="one-dark">One Dark</option>
          <option value="dracula">Dracula</option>
          <option value="monokai">Monokai</option>
          <option value="solarized-dark">Solarized Dark</option>
          <option value="solarized-light">Solarized Light</option>
          <option value="nord">Nord</option>
          <option value="tokyo-night">Tokyo Night</option>
          <option value="github-light">GitHub Light</option>
          <option value="atom-one-light">Atom One Light</option>
        </select>
      </div>

      <div class="control-group">
        <label>
          <input v-model="codeLineNumbers" type="checkbox" />
          代码行号
        </label>
      </div>
    </div>

    <div class="controls">
      <button @click="focusEditor">聚焦编辑器</button>
      <button type="button" @mousedown.prevent @click.prevent="handleUndo">撤销</button>
      <button type="button" @mousedown.prevent @click.prevent="handleRedo">重做</button>
      <button @click="getSelectedText">获取选中文本</button>
      <button @click="handleInsertText">插入文本</button>
      <button @click="showHeadings">提取大纲 (TOC)</button>
      <button @click="testScrollToLine">滚动到某行</button>
    </div>
    <div class="controls">
      <button @click="toggleBrowserFullscreen">浏览器全屏</button>
      <button @click="toggleScreenFullscreen">屏幕全屏</button>
      <button @click="exitFullscreen">退出全屏</button>
    </div>

    <div class="editor-container">
      <UnaEditor
        ref="editorRef"
        v-model="content"
        :line-numbers="lineNumbers"
        :line-wrap="lineWrap"
        :live-preview="livePreview"
        :vim-mode="vimMode"
        :locale="locale"
        :theme="theme"
        :font-size="fontSize"
        :font-family="fontFamily"
        :code-font-family="codeFontFamily"
        :content-max-width="contentMaxWidth"
        :code-theme="codeTheme"
        :code-line-numbers="codeLineNumbers"
        placeholder="请输入 Markdown 内容..."
        @change="handleChange"
        @save="handleSave"
        @drop="handleDrop"
      />
    </div>

    <div class="output">
      <h3>当前内容（{{ content.length }} 字符）：</h3>
      <pre>{{ contentWithLineNumbers() }}</pre>
    </div>
  </div>
</template>

<style scoped>
.playground {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

h1 {
  color: #333;
  margin-bottom: 0.5rem;
}

p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #45a049;
}

select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.editor-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 400px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.output {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
}

.output h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #333;
}

.output pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #666;
  font-size: 14px;
}
</style>
