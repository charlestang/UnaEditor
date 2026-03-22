<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { UnaEditor } from 'una-editor';

const { t } = useI18n();

type DemoCodeTheme =
  | 'auto'
  | 'one-dark'
  | 'dracula'
  | 'monokai'
  | 'solarized-dark'
  | 'nord'
  | 'tokyo-night'
  | 'github-light'
  | 'solarized-light'
  | 'atom-one-light';

const editorTheme = ref<'light' | 'dark'>('dark');
const codeTheme = ref<DemoCodeTheme>('auto');
const wrapperClass = computed(() =>
  editorTheme.value === 'light' ? 'editor-wrapper-light' : 'editor-wrapper-dark',
);

const editorThemeOptions = computed(() => [
  { label: t('demo.controls.light'), value: 'light' },
  { label: t('demo.controls.dark'), value: 'dark' },
]);

const codeThemeOptions = computed<Array<{ label: string; value: DemoCodeTheme }>>(() => [
  { label: t('demo.controls.auto'), value: 'auto' },
  { label: 'One Dark', value: 'one-dark' },
  { label: 'Dracula', value: 'dracula' },
  { label: 'Monokai', value: 'monokai' },
  { label: 'Solarized Dark', value: 'solarized-dark' },
  { label: 'Nord', value: 'nord' },
  { label: 'Tokyo Night', value: 'tokyo-night' },
  { label: 'GitHub Light', value: 'github-light' },
  { label: 'Solarized Light', value: 'solarized-light' },
  { label: 'Atom One Light', value: 'atom-one-light' },
]);

const demoContent = ref(`
# Welcome to Una Editor 👋

A lightweight, high-performance **Vue 3** editor component library based on CodeMirror 6.

## Try it out!

- Edit this text directly
- Toggle **Live Preview** above to see WYSIWYG headings and emphasis
- Toggle **Vim Mode** to use classic modal editing (\`j\`, \`k\`, \`i\`, \`esc\`)
- Try the **structured table** below to see cell editing in live preview
- Try different **Code Themes** and enable **Line Numbers**

### Rich Markdown Preview

This editor renders **bold**, *italic*, and ***bold italic*** text in place while keeping Markdown source editable.

- Standard bullet lists stay readable in live preview
- [ ] Task lists render as clean checkboxes
- [x] Checked tasks still fall back to Markdown source when you edit them

> Blockquotes, links like [CodeMirror](https://codemirror.net/), and inline code such as \`const count = ref(0)\` are all part of the same editing surface.

### Structured Table Preview

| Capability | Status | Notes |
| :--- | :---: | ---: |
| Cell editing | Ready | Click any cell to edit |
| Alignment | Active | Header follows GFM delimiter syntax |
| Line breaks | Stable | First line<br>Second line |
| Vim motion | Supported | Try \`j\` / \`k\` / \`h\` / \`l\` |

### TypeScript Example

\`\`\`typescript
import { ref } from 'vue';
import { UnaEditor } from 'una-editor';

const content = ref('Hello World');
const codeTheme = ref('dracula');
\`\`\`

### Python Example

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
\`\`\`

> Enjoy building amazing things! 🚀
`);
</script>

<template>
  <section class="demo-section">
    <div class="demo-container">
      <div class="demo-header">
        <h2 class="demo-title">{{ t('demo.title') }}</h2>
        <div class="demo-controls">
          <label class="control-label">
            <span class="control-text">{{ t('demo.controls.editorTheme') }}</span>
            <select v-model="editorTheme" class="control-select">
              <option v-for="opt in editorThemeOptions" :key="opt.label" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="control-label">
            <span class="control-text">{{ t('demo.controls.codeTheme') }}</span>
            <select v-model="codeTheme" class="control-select">
              <option v-for="opt in codeThemeOptions" :key="opt.label" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
        </div>
      </div>
      <div class="editor-wrapper" :class="wrapperClass">
        <UnaEditor
          v-model="demoContent"
          live-preview
          :theme="editorTheme"
          :code-theme="codeTheme"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.demo-section {
  padding: 4rem 2rem 6rem;
}

.demo-container {
  max-width: 1000px;
  margin: 0 auto;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.demo-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #f8fafc;
}

.demo-controls {
  display: flex;
  gap: 1.5rem;
  background: rgba(30, 41, 59, 0.5);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.control-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.control-text {
  font-size: 0.875rem;
  color: #cbd5e1;
}

.control-select {
  font-size: 0.875rem;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  cursor: pointer;
}

.editor-wrapper {
  border-radius: 0.75rem;
  overflow: hidden;
  height: 500px;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.editor-wrapper-dark {
  background: #282c34;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.5),
    0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.editor-wrapper-light {
  background: #ffffff;
  box-shadow:
    0 20px 25px -5px rgba(15, 23, 42, 0.08),
    0 8px 10px -6px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.35);
}

/* Ensure UnaEditor fills the wrapper */
.editor-wrapper :deep(.una-editor) {
  height: 100%;
}

.editor-wrapper-light :deep(.cm-editor),
.editor-wrapper-light :deep(.cm-scroller) {
  background: #ffffff;
  color: #0f172a;
}

.editor-wrapper-light :deep(.cm-gutters) {
  color: #64748b;
}
</style>
