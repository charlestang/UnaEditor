<script setup lang="ts">
import { ref, useAttrs } from 'vue'
import { useEditor } from '../composables/useEditor'
import { useFullscreen } from '../composables/useFullscreen'
import type { EditorProps, EditorExposed } from '../types/editor'

defineOptions({
  inheritAttrs: false,
})

// Define props
const props = withDefaults(defineProps<EditorProps>(), {
  modelValue: '',
  language: 'markdown',
  lineNumbers: true,
  hybridMarkdown: false,
  locale: 'zh-CN',
  theme: 'light',
})

// Define emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  save: []
  focus: []
  blur: []
  drop: [files: File[]]
}>()

const attrs = useAttrs()

// Editor container ref
const editorContainer = ref<HTMLElement>()

// Use composables
const { focus: editorFocus, getSelection } = useEditor(editorContainer, props, emit)
const { toggleFullscreen, exitFullscreen } = useFullscreen(editorContainer)

// Expose methods
defineExpose<EditorExposed>({
  focus: editorFocus,
  getSelection,
  toggleFullscreen,
  exitFullscreen,
})
</script>

<template>
  <div ref="editorContainer" class="una-editor" v-bind="attrs"></div>
</template>

<style scoped>
.una-editor {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

/* Browser fullscreen mode - fills viewport */
.una-editor-fullscreen-browser {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: white;
}
</style>
