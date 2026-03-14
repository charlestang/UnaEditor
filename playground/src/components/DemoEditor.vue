<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { UnaEditor } from 'una-editor';

const { t } = useI18n();

const livePreview = ref(true);
const vimMode = ref(false);

const demoContent = ref(`
# Welcome to Una Editor 👋

A lightweight, high-performance **Vue 3** editor component library based on CodeMirror 6.

## Try it out!

- Edit this text directly
- Toggle **Hybrid Markdown** above to see WYSIWYG headings and emphasis
- Toggle **Vim Mode** to use classic modal editing (\`j\`, \`k\`, \`i\`, \`esc\`)

### Code Block Example

\`\`\`typescript
import { ref } from 'vue';
import { UnaEditor } from 'una-editor';

const content = ref('Hello World');
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
        </div>
      </div>
      <div class="editor-wrapper">
        <UnaEditor
          v-model="demoContent"
          :live-preview="livePreview"
          :vim-mode="vimMode"
          theme="dark"
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
