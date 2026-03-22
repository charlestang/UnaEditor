<script setup lang="ts">
import { ref, useAttrs, computed } from 'vue';
import { useEditor } from '../composables/useEditor';
import { useFullscreen } from '../composables/useFullscreen';
import type { EditorProps, EditorExposed } from '../types/editor';
import zhCN from '../locales/zh-CN';
import enUS from '../locales/en-US';

defineOptions({
  inheritAttrs: false,
});

// Define props
const props = withDefaults(defineProps<EditorProps>(), {
  modelValue: '',
  lineNumbers: true,
  lineWrap: true,
  livePreview: false,
  vimMode: false,
  locale: 'zh-CN',
  theme: 'light',
  codeTheme: 'auto',
  codeLineNumbers: false,
});

// Define emits
const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  save: [];
  focus: [];
  blur: [];
  drop: [files: File[]];
}>();

const attrs = useAttrs();

// Editor container ref
const editorContainer = ref<HTMLElement>();

// Fullscreen tip state
const showFullscreenTip = ref(false);

// Get locale messages
const localeMessages = computed(() => {
  if (typeof props.locale === 'string') {
    return props.locale === 'en-US' ? enUS : zhCN;
  }
  return props.locale || zhCN;
});

// Computed style for font settings
const containerStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.fontFamily) {
    style['--una-font-family'] = props.fontFamily;
  }
  if (props.codeFontFamily) {
    style['--una-code-font-family'] = props.codeFontFamily;
  }
  if (props.fontSize !== undefined) {
    style['--una-font-size'] = `${props.fontSize}px`;
  }
  style['--una-table-header-bg'] =
    props.theme === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.04)';
  return style;
});

// Show tip when entering browser fullscreen
const handleBrowserFullscreenEnter = () => {
  showFullscreenTip.value = true;
  // Auto hide after 3 seconds
  setTimeout(() => {
    showFullscreenTip.value = false;
  }, 3000);
};

// Use composables
const {
  focus: editorFocus,
  getSelection,
  getEditorView,
  insertText,
  getHeadings,
  scrollToLine,
  undoHistory,
  redoHistory,
} = useEditor(editorContainer, props, emit);
const { toggleFullscreen, exitFullscreen } = useFullscreen(
  editorContainer,
  handleBrowserFullscreenEnter,
);

// Expose methods
defineExpose<EditorExposed>({
  focus: editorFocus,
  getSelection,
  toggleFullscreen,
  exitFullscreen,
  getEditorView,
  insertText,
  getHeadings,
  scrollToLine,
  undoHistory,
  redoHistory,
});
</script>

<template>
  <div ref="editorContainer" class="una-editor" :style="containerStyle" v-bind="attrs">
    <!-- Fullscreen tip -->
    <Transition name="fade">
      <div v-if="showFullscreenTip" class="una-editor-fullscreen-tip">
        {{ localeMessages.browserFullscreenTip }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.una-editor {
  width: 100%;
  height: 100%;
  min-height: 200px;
  position: relative;
}

/* Browser fullscreen mode - fills viewport */
.una-editor-fullscreen-browser {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: white;
}

/* Fullscreen tip */
.una-editor-fullscreen-tip {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 10000;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
