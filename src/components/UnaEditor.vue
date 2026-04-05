<script setup lang="ts">
import { ref, useAttrs, computed } from 'vue';
import { useEditor } from '../composables/useEditor';
import { useFullscreen } from '../composables/useFullscreen';
import { resolveEditorAppearance } from '../themes/editorAppearance';
import type { EditorProps, EditorExposed } from '../types/editor';
import type { EditorRuntimeCallbacks } from '../types/editorRuntime';
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
  contentMaxWidth: 720,
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

const resolvedAppearance = computed(() =>
  resolveEditorAppearance({
    theme: props.theme,
    codeTheme: props.codeTheme,
    fontFamily: props.fontFamily,
    codeFontFamily: props.codeFontFamily,
    fontSize: props.fontSize,
    contentMaxWidth: props.contentMaxWidth,
  }),
);

const containerStyle = computed(() => {
  return resolvedAppearance.value.containerStyle;
});

// Show tip when entering browser fullscreen
const handleBrowserFullscreenEnter = () => {
  showFullscreenTip.value = true;
  // Auto hide after 3 seconds
  setTimeout(() => {
    showFullscreenTip.value = false;
  }, 3000);
};

const runtimeCallbacks: EditorRuntimeCallbacks = {
  onModelValueChange: (value) => {
    emit('update:modelValue', value);
  },
  onChange: (value) => {
    emit('change', value);
  },
  onSave: () => {
    emit('save');
  },
  onFocus: () => {
    emit('focus');
  },
  onBlur: () => {
    emit('blur');
  },
  onFileInput: ({ files }) => {
    emit('drop', files);
  },
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
} = useEditor(editorContainer, {
  props,
  appearance: resolvedAppearance,
  callbacks: runtimeCallbacks,
});
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
  background: var(--una-editor-surface, #ffffff);
}

/* Browser fullscreen mode - fills viewport */
.una-editor-fullscreen-browser {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--una-editor-surface, #ffffff);
}

.una-editor:fullscreen {
  background: var(--una-editor-surface, #ffffff);
}

.una-editor:fullscreen::backdrop {
  background: var(--una-editor-surface, #ffffff);
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
