<script setup lang="ts">
import { ref } from 'vue';
import { UnaEditor, version } from 'una-editor';
import type { EditorExposed } from 'una-editor';

// Editor state
const content = ref(
  '# Hello UnaEditor\n\n这是一个基于 CodeMirror 6 的 Markdown 编辑器。\n\n## 功能特性\n\n- 支持 v-model 双向绑定\n- 支持行号显示\n- 支持 Hybrid Markdown 渲染\n- 支持国际化（中英文）\n- 支持亮色/暗色主题\n- 支持全屏模式\n- 支持图片拖拽和粘贴\n- 支持 Mod-s 保存快捷键\n\n> 这是一段 blockquote，用来演示首期的保守增强效果。\n\n`inline code`、**bold**、*italic* 和 [link](https://codemirror.net/) 都可以在 hybrid 模式下看到更接近渲染态的显示。\n\n![UnaEditor Demo](https://placehold.co/320x160/orange/white?text=UnaEditor)\n\n```ts\nfunction greet(name: string) {\n  return `Hello, ${name}`;\n}\n```\n\n| feature | status |\n| --- | --- |\n| tables | source mode |\n\n试试编辑这段文字，或者拖拽图片到编辑器中！',
);

// Editor options
const lineNumbers = ref(true);
const lineWrap = ref(true);
const hybridMarkdown = ref(true);
const vimMode = ref(false);
const locale = ref<'zh-CN' | 'en-US'>('zh-CN');
const theme = ref<'light' | 'dark'>('light');

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

const showHeadings = () => {
  const headings = editorRef.value?.getHeadings();
  if (!headings || headings.length === 0) {
    alert('No headings found.');
    return;
  }
  const tree = headings.map(h => `${'  '.repeat(h.level - 1)}- [H${h.level}] ${h.text} (Line ${h.line})`).join('\n');
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
          <input v-model="hybridMarkdown" type="checkbox" />
          Hybrid 渲染
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
        <select v-model="theme">
          <option value="light">亮色</option>
          <option value="dark">暗色</option>
        </select>
      </div>
    </div>

    <div class="controls">
      <button @click="focusEditor">聚焦编辑器</button>
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
        :hybrid-markdown="hybridMarkdown"
        :vim-mode="vimMode"
        :locale="locale"
        :theme="theme"
        placeholder="请输入 Markdown 内容..."
        @change="handleChange"
        @save="handleSave"
        @drop="handleDrop"
      />
    </div>

    <div class="output">
      <h3>当前内容（{{ content.length }} 字符）：</h3>
      <pre>{{ content }}</pre>
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
