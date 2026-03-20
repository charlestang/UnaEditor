import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue';
import { EditorState, Compartment, Prec } from '@codemirror/state';
import { EditorView, keymap, placeholder as placeholderExt, lineNumbers } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxTree, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { vim, Vim } from '@replit/codemirror-vim';
import {
  createLivePreviewExtensions,
  createCodeDecorationExtension,
  setupVimLogicalNavigation,
  remeasureEffect,
} from '../extensions/hybridMarkdown';
import { createLanguageDescriptions } from '../extensions/languageSupport';
import { createCodeBlockDecoratorExtension } from '../extensions/codeBlockDecorator';
import { createCodeThemeExtension } from '../extensions/codeThemeExtension';
import { getCodeTheme, getDefaultCodeTheme } from '../themes/codeThemes';
import type { EditorProps, Heading, CodeTheme } from '../types/editor';

const fillHeightLayout = EditorView.theme({
  '&': {
    height: '100%',
  },
  '.cm-scroller': {
    height: '100%',
  },
  '.cm-content': {
    minHeight: '100%',
    padding: '10px 0',
  },
  '.cm-gutters': {
    minHeight: '100%',
    backgroundColor: 'transparent',
    borderRight: 'none',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 16px 0 4px',
  },
  // Better selection contrast for dark theme
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(59, 130, 246, 0.3) !important',
  },
  // Subtle active line highlight
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: '#e2e8f0',
  },
});

const fontTheme = EditorView.theme({
  '&': {
    fontFamily: 'var(--una-font-family, sans-serif)',
    fontSize: 'var(--una-font-size, 14px)',
  },
  '& .cm-scroller': {
    fontFamily: 'inherit',
  },
});

export function useEditor(
  container: Ref<HTMLElement | undefined>,
  props: EditorProps,
  emit: {
    (e: 'update:modelValue', value: string): void;
    (e: 'change', value: string): void;
    (e: 'save'): void;
    (e: 'focus'): void;
    (e: 'blur'): void;
    (e: 'drop', files: File[]): void;
  },
) {
  const editorView = ref<EditorView>();
  let isInternalUpdate = false;

  // Compartments for dynamic reconfiguration
  const themeCompartment = new Compartment();
  const hybridCompartment = new Compartment();
  const codeDecorationCompartment = new Compartment();
  const vimCompartment = new Compartment();
  const lineNumbersCompartment = new Compartment();
  const placeholderCompartment = new Compartment();
  const readOnlyCompartment = new Compartment();
  const lineWrapCompartment = new Compartment();
  const codeThemeCompartment = new Compartment();
  const codeBlockDecoratorCompartment = new Compartment();

  // Helper to resolve code theme
  function resolveCodeTheme(
    codeTheme: 'auto' | string | undefined,
    editorTheme: 'light' | 'dark',
  ): CodeTheme {
    if (!codeTheme || codeTheme === 'auto') {
      return getDefaultCodeTheme(editorTheme);
    }

    const theme = getCodeTheme(codeTheme);
    if (!theme) {
      console.warn(`Unknown code theme: ${codeTheme}, falling back to default`);
      return getDefaultCodeTheme(editorTheme);
    }

    return theme;
  }

  // Extract image files from DataTransfer
  function extractImageFiles(dataTransfer: DataTransfer): File[] {
    const files: File[] = [];
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      if (file.type.startsWith('image/')) {
        files.push(file);
      }
    }
    return files;
  }

  // Initialize EditorView
  onMounted(() => {
    if (!container.value) return;

    const extensions = [
      // Basic keymap
      keymap.of(defaultKeymap),

      // Mod-s keymap for save
      Prec.highest(
        keymap.of([
          {
            key: 'Mod-s',
            preventDefault: true,
            run: () => {
              emit('save');
              return true;
            },
          },
        ]),
      ),

      // Markdown language support with syntax highlighting and nested code languages
      markdown({
        codeLanguages: createLanguageDescriptions(),
      }),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

      // Optional vim mode behavior
      vimCompartment.of(props.vimMode ? vim({ status: false }) : []),

      // Keep the inner editor layout aligned with the container height
      fillHeightLayout,

      // Font theme
      fontTheme,

      // Code block decorator (always active, independent of hybridMarkdown)
      codeBlockDecoratorCompartment.of(
        createCodeBlockDecoratorExtension(props.codeLineNumbers || false),
      ),

      // Optional hybrid markdown rendering layer
      hybridCompartment.of(props.livePreview ? createLivePreviewExtensions() : []),

      // Code font decoration for non-livePreview mode (dynamic)
      codeDecorationCompartment.of(props.livePreview ? [] : createCodeDecorationExtension()),

      // Theme (dynamic)
      themeCompartment.of(props.theme === 'dark' ? oneDark : []),

      // Code block theme (dynamic)
      codeThemeCompartment.of(
        createCodeThemeExtension(resolveCodeTheme(props.codeTheme, props.theme || 'light')),
      ),

      // Line numbers (dynamic)
      lineNumbersCompartment.of(props.lineNumbers !== false ? lineNumbers() : []),

      // Line wrapping (dynamic)
      lineWrapCompartment.of(props.lineWrap !== false ? EditorView.lineWrapping : []),

      // Placeholder (dynamic)
      placeholderCompartment.of(props.placeholder ? placeholderExt(props.placeholder) : []),

      // Update listener for v-model
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isInternalUpdate) {
          const value = update.state.doc.toString();
          emit('update:modelValue', value);
          emit('change', value);
        }
      }),

      // Focus/blur handlers
      EditorView.domEventHandlers({
        focus: () => {
          emit('focus');
        },
        blur: () => {
          emit('blur');
        },
        // Image drag handler
        drop: (event) => {
          const files = extractImageFiles(event.dataTransfer!);
          if (files.length > 0) {
            event.preventDefault();
            emit('drop', files);
            return true;
          }
          return false;
        },
        // Image paste handler
        paste: (event) => {
          const files = extractImageFiles(event.clipboardData!);
          if (files.length > 0) {
            event.preventDefault();
            emit('drop', files);
            return true;
          }
          return false;
        },
      }),

      // Disabled/readonly state (dynamic)
      readOnlyCompartment.of(EditorState.readOnly.of(props.disabled || props.readonly || false)),
    ];

    editorView.value = new EditorView({
      state: EditorState.create({
        doc: props.modelValue,
        extensions,
      }),
      parent: container.value,
    });

    // Configure Vim mode behavior
    if (props.vimMode) {
      Vim.defineEx('write', 'w', () => {
        emit('save');
      });
      // Fix arrow keys and j/k to follow logical line navigation (Vim convention)
      setupVimLogicalNavigation();
    }
  });

  // Watch modelValue prop and update EditorView
  watch(
    () => props.modelValue,
    (newValue) => {
      if (!editorView.value) return;
      const currentValue = editorView.value.state.doc.toString();
      if (newValue !== currentValue) {
        isInternalUpdate = true;
        editorView.value.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: newValue,
          },
        });
        isInternalUpdate = false;
      }
    },
  );

  // Watch theme prop and update dynamically
  watch(
    () => props.theme,
    (newTheme) => {
      if (!editorView.value) return;
      editorView.value.dispatch({
        effects: themeCompartment.reconfigure(newTheme === 'dark' ? oneDark : []),
      });
    },
  );

  // Watch codeTheme and theme props for code block theme updates
  watch(
    () => [props.codeTheme, props.theme] as const,
    ([codeThemeName, editorTheme]) => {
      if (!editorView.value) return;
      const theme = resolveCodeTheme(codeThemeName, editorTheme || 'light');
      editorView.value.dispatch({
        effects: codeThemeCompartment.reconfigure(createCodeThemeExtension(theme)),
      });
    },
  );

  // Watch codeLineNumbers prop and update dynamically
  watch(
    () => props.codeLineNumbers,
    (showLineNumbers) => {
      if (!editorView.value) return;
      editorView.value.dispatch({
        effects: codeBlockDecoratorCompartment.reconfigure(
          createCodeBlockDecoratorExtension(showLineNumbers || false),
        ),
      });
    },
  );

  // Watch hybridMarkdown prop and update dynamically
  watch(
    () => props.livePreview,
    (enabled) => {
      if (!editorView.value) return;
      editorView.value.dispatch({
        effects: [
          hybridCompartment.reconfigure(enabled ? createLivePreviewExtensions() : []),
          codeDecorationCompartment.reconfigure(enabled ? [] : createCodeDecorationExtension()),
        ],
      });
    },
  );

  // Watch vimMode prop and update dynamically
  watch(
    () => props.vimMode,
    (enabled) => {
      if (!editorView.value) return;
      editorView.value.dispatch({
        effects: vimCompartment.reconfigure(enabled ? vim({ status: false }) : []),
      });

      // Configure Vim :w command when enabling Vim mode
      if (enabled) {
        Vim.defineEx('write', 'w', () => {
          emit('save');
        });
      }
    },
  );

  // Watch lineNumbers prop and update dynamically
  watch(
    () => props.lineNumbers,
    (showLineNumbers) => {
      if (!editorView.value) return;
      editorView.value.dispatch({
        effects: lineNumbersCompartment.reconfigure(showLineNumbers !== false ? lineNumbers() : []),
      });
    },
  );

  // Watch lineWrap prop and update dynamically
  watch(
    () => props.lineWrap,
    (shouldWrap) => {
      if (!editorView.value) return;
      editorView.value.dispatch({
        effects: lineWrapCompartment.reconfigure(
          shouldWrap !== false ? EditorView.lineWrapping : [],
        ),
      });
    },
  );

  // Watch placeholder prop and update dynamically
  watch(
    () => props.placeholder,
    (newPlaceholder) => {
      if (!editorView.value) return;
      editorView.value.dispatch({
        effects: placeholderCompartment.reconfigure(
          newPlaceholder ? placeholderExt(newPlaceholder) : [],
        ),
      });
    },
  );

  // Watch disabled/readonly props and update dynamically
  watch(
    () => [props.disabled, props.readonly] as const,
    ([disabled, readonly]) => {
      if (!editorView.value) return;
      editorView.value.dispatch({
        effects: readOnlyCompartment.reconfigure(
          EditorState.readOnly.of(disabled || readonly || false),
        ),
      });
    },
  );

  // Watch font props and trigger remeasure after DOM style update
  watch(
    () => [props.fontFamily, props.codeFontFamily, props.fontSize] as const,
    ([fontFamily, codeFontFamily], [prevFontFamily, prevCodFontFamily]) => {
      if (!editorView.value) return;
      // Dispatch a transaction with remeasureEffect so CM updates geometry
      // and hybrid decorations rebuild within the same update cycle.
      editorView.value.dispatch({ effects: remeasureEffect.of(null) });

      // If font family changed, wait for fonts to load and remeasure again
      if (fontFamily !== prevFontFamily || codeFontFamily !== prevCodFontFamily) {
        document.fonts.ready.then(() => {
          editorView.value?.dispatch({ effects: remeasureEffect.of(null) });
        });
      }
    },
    { flush: 'post' },
  );

  // Cleanup EditorView
  onBeforeUnmount(() => {
    editorView.value?.destroy();
  });

  // Exposed methods
  const focus = () => {
    editorView.value?.focus();
  };

  const getSelection = (): string => {
    if (!editorView.value) return '';
    const state = editorView.value.state;
    const selection = state.selection.main;
    return state.doc.sliceString(selection.from, selection.to);
  };

  const getEditorView = (): EditorView | undefined => {
    return editorView.value;
  };

  const insertText = (text: string) => {
    if (!editorView.value) return;
    const view = editorView.value;
    const selection = view.state.selection.main;

    // Don't set isInternalUpdate here - insertText is a public API
    // and should trigger modelValue updates
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: text,
      },
      selection: { anchor: selection.from + text.length },
      scrollIntoView: true,
    });
  };

  const getHeadings = (): Heading[] => {
    if (!editorView.value) return [];
    const state = editorView.value.state;
    const tree = syntaxTree(state);
    const headings: Heading[] = [];

    tree.iterate({
      enter: (node) => {
        if (node.name.startsWith('ATXHeading')) {
          const levelMatch = node.name.match(/\d$/);
          const level = levelMatch ? parseInt(levelMatch[0], 10) : 1;
          // Extract text without the leading '#' and spaces
          const rawText = state.doc.sliceString(node.from, node.to);
          const text = rawText.replace(/^#+\s*/, '').trim();
          const line = state.doc.lineAt(node.from).number;

          headings.push({ text, level, line });
        }
      },
    });

    return headings;
  };

  const scrollToLine = (lineNumber: number) => {
    if (!editorView.value) return;
    const doc = editorView.value.state.doc;

    if (lineNumber < 1) lineNumber = 1;
    if (lineNumber > doc.lines) lineNumber = doc.lines;

    const line = doc.line(lineNumber);
    const view = editorView.value;
    const isFocused = view.hasFocus;

    // Use lineBlockAt to get the visual position of the line
    // This works regardless of whether content is hidden by decorations
    const lineBlock = view.lineBlockAt(line.from);
    const scrollDOM = view.scrollDOM;

    // lineBlock.top is already relative to the scrollable content area
    // Just subtract the margin to get the target scroll position
    const targetScrollTop = lineBlock.top - 5;

    // Directly set scrollTop to force scroll to exact position
    scrollDOM.scrollTop = Math.max(0, targetScrollTop);

    // Move cursor if focused
    if (isFocused) {
      view.dispatch({
        selection: { anchor: line.from },
      });
    }
  };

  return {
    editorView,
    focus,
    getSelection,
    getEditorView,
    insertText,
    getHeadings,
    scrollToLine,
  };
}
