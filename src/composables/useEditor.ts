import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { EditorState, Compartment } from '@codemirror/state'
import {
  EditorView,
  keymap,
  placeholder as placeholderExt,
  lineNumbers,
} from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import type { EditorProps } from '../types/editor'

export function useEditor(
  container: Ref<HTMLElement | undefined>,
  props: EditorProps,
  emit: {
    (e: 'update:modelValue', value: string): void
    (e: 'change', value: string): void
    (e: 'save'): void
    (e: 'focus'): void
    (e: 'blur'): void
    (e: 'drop', files: File[]): void
  }
) {
  const editorView = ref<EditorView>()
  let isInternalUpdate = false

  // Compartments for dynamic reconfiguration
  const themeCompartment = new Compartment()
  const lineNumbersCompartment = new Compartment()
  const placeholderCompartment = new Compartment()
  const readOnlyCompartment = new Compartment()

  // Extract image files from DataTransfer
  function extractImageFiles(dataTransfer: DataTransfer): File[] {
    const files: File[] = []
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i]
      if (file.type.startsWith('image/')) {
        files.push(file)
      }
    }
    return files
  }

  // Initialize EditorView
  onMounted(() => {
    if (!container.value) return

    const extensions = [
      // Basic keymap
      keymap.of(defaultKeymap),

      // Mod-s keymap for save
      keymap.of([
        {
          key: 'Mod-s',
          preventDefault: true,
          run: () => {
            emit('save')
            return true
          },
        },
      ]),

      // Markdown language support
      markdown(),

      // Theme (dynamic)
      themeCompartment.of(props.theme === 'dark' ? oneDark : []),

      // Line numbers (dynamic)
      lineNumbersCompartment.of(props.lineNumbers !== false ? lineNumbers() : []),

      // Placeholder (dynamic)
      placeholderCompartment.of(props.placeholder ? placeholderExt(props.placeholder) : []),

      // Update listener for v-model
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isInternalUpdate) {
          const value = update.state.doc.toString()
          emit('update:modelValue', value)
          emit('change', value)
        }
      }),

      // Focus/blur handlers
      EditorView.domEventHandlers({
        focus: () => {
          emit('focus')
        },
        blur: () => {
          emit('blur')
        },
        // Image drag handler
        drop: (event) => {
          const files = extractImageFiles(event.dataTransfer!)
          if (files.length > 0) {
            event.preventDefault()
            emit('drop', files)
            return true
          }
          return false
        },
        // Image paste handler
        paste: (event) => {
          const files = extractImageFiles(event.clipboardData!)
          if (files.length > 0) {
            event.preventDefault()
            emit('drop', files)
            return true
          }
          return false
        },
      }),

      // Disabled/readonly state (dynamic)
      readOnlyCompartment.of(EditorState.readOnly.of(props.disabled || props.readonly || false)),
    ]

    editorView.value = new EditorView({
      state: EditorState.create({
        doc: props.modelValue,
        extensions,
      }),
      parent: container.value,
    })
  })

  // Watch modelValue prop and update EditorView
  watch(
    () => props.modelValue,
    (newValue) => {
      if (!editorView.value) return
      const currentValue = editorView.value.state.doc.toString()
      if (newValue !== currentValue) {
        isInternalUpdate = true
        editorView.value.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: newValue,
          },
        })
        isInternalUpdate = false
      }
    }
  )

  // Watch theme prop and update dynamically
  watch(
    () => props.theme,
    (newTheme) => {
      if (!editorView.value) return
      editorView.value.dispatch({
        effects: themeCompartment.reconfigure(newTheme === 'dark' ? oneDark : []),
      })
    }
  )

  // Watch lineNumbers prop and update dynamically
  watch(
    () => props.lineNumbers,
    (showLineNumbers) => {
      if (!editorView.value) return
      editorView.value.dispatch({
        effects: lineNumbersCompartment.reconfigure(showLineNumbers !== false ? lineNumbers() : []),
      })
    }
  )

  // Watch placeholder prop and update dynamically
  watch(
    () => props.placeholder,
    (newPlaceholder) => {
      if (!editorView.value) return
      editorView.value.dispatch({
        effects: placeholderCompartment.reconfigure(newPlaceholder ? placeholderExt(newPlaceholder) : []),
      })
    }
  )

  // Watch disabled/readonly props and update dynamically
  watch(
    () => [props.disabled, props.readonly] as const,
    ([disabled, readonly]) => {
      if (!editorView.value) return
      editorView.value.dispatch({
        effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(disabled || readonly || false)),
      })
    }
  )

  // Cleanup EditorView
  onBeforeUnmount(() => {
    editorView.value?.destroy()
  })

  // Exposed methods
  const focus = () => {
    editorView.value?.focus()
  }

  const getSelection = (): string => {
    if (!editorView.value) return ''
    const state = editorView.value.state
    const selection = state.selection.main
    return state.doc.sliceString(selection.from, selection.to)
  }

  return {
    editorView,
    focus,
    getSelection,
  }
}

