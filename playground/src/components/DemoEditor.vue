<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { UnaEditor } from 'una-editor';

const { t } = useI18n();

const livePreview = ref(true);
const vimMode = ref(false);
const codeLineNumbers = ref(false);
const editorTheme = ref<'light' | 'dark'>('dark');
const codeTheme = ref<'auto' | string>('auto');
const fontSize = ref<number | undefined>(undefined);
const fontFamily = ref<string | undefined>(undefined);
const codeFontFamily = ref<string | undefined>(undefined);

const editorThemeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
] as const;

const codeThemeOptions = [
  { label: 'Auto', value: 'auto' },
  { label: 'One Dark', value: 'one-dark' },
  { label: 'Dracula', value: 'dracula' },
  { label: 'Monokai', value: 'monokai' },
  { label: 'Solarized Dark', value: 'solarized-dark' },
  { label: 'Nord', value: 'nord' },
  { label: 'Tokyo Night', value: 'tokyo-night' },
  { label: 'GitHub Light', value: 'github-light' },
  { label: 'Solarized Light', value: 'solarized-light' },
  { label: 'Atom One Light', value: 'atom-one-light' },
] as const;

const fontSizeOptions = [
  { label: 'Default', value: undefined },
  { label: '12px', value: 12 },
  { label: '14px', value: 14 },
  { label: '16px', value: 16 },
  { label: '18px', value: 18 },
  { label: '20px', value: 20 },
] as const;

const fontFamilyOptions = [
  { label: 'Default', value: undefined },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Helvetica Neue', value: "'Helvetica Neue', Arial, sans-serif" },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
] as const;

const codeFontFamilyOptions = [
  { label: 'Default', value: undefined },
  { label: 'Fira Code', value: 'Fira Code, monospace' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono, monospace' },
  { label: 'Courier New', value: 'Courier New, monospace' },
] as const;

const demoContent = ref(`
# Welcome to Una Editor 👋

A lightweight, high-performance **Vue 3** editor component library based on CodeMirror 6.

## Try it out!

- Edit this text directly
- Toggle **Live Preview** above to see WYSIWYG headings and emphasis
- Toggle **Vim Mode** to use classic modal editing (\`j\`, \`k\`, \`i\`, \`esc\`)
- Try different **Code Themes** and enable **Line Numbers**

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
            <input v-model="livePreview" type="checkbox" />
            <span class="control-text">Live Preview</span>
          </label>
          <label class="control-label">
            <input v-model="vimMode" type="checkbox" />
            <span class="control-text">Vim Mode</span>
          </label>
          <label class="control-label">
            <input v-model="codeLineNumbers" type="checkbox" />
            <span class="control-text">Code Line Numbers</span>
          </label>
          <label class="control-label">
            <span class="control-text">Editor Theme</span>
            <select v-model="editorTheme" class="control-select">
              <option v-for="opt in editorThemeOptions" :key="opt.label" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="control-label">
            <span class="control-text">Code Theme</span>
            <select v-model="codeTheme" class="control-select">
              <option v-for="opt in codeThemeOptions" :key="opt.label" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="control-label">
            <span class="control-text">Font Size</span>
            <select v-model="fontSize" class="control-select">
              <option v-for="opt in fontSizeOptions" :key="opt.label" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="control-label">
            <span class="control-text">Font</span>
            <select v-model="fontFamily" class="control-select">
              <option v-for="opt in fontFamilyOptions" :key="opt.label" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="control-label">
            <span class="control-text">Code Font</span>
            <select v-model="codeFontFamily" class="control-select">
              <option v-for="opt in codeFontFamilyOptions" :key="opt.label" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
        </div>
      </div>
      <div class="editor-wrapper">
        <UnaEditor
          v-model="demoContent"
          :live-preview="livePreview"
          :vim-mode="vimMode"
          :code-line-numbers="codeLineNumbers"
          :theme="editorTheme"
          :code-theme="codeTheme"
          :font-size="fontSize"
          :font-family="fontFamily"
          :code-font-family="codeFontFamily"
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
  background: #282c34; /* Match One Dark theme background */
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.5),
    0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 500px;
}

/* Ensure UnaEditor fills the wrapper */
.editor-wrapper :deep(.una-editor) {
  height: 100%;
}
</style>
