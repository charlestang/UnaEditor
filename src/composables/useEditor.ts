import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue';
import { EditorState, Compartment, Prec, type Extension } from '@codemirror/state';
import { EditorView, keymap, placeholder as placeholderExt, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, redo, undo } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxTree, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import {
  HYBRID_BASE_THEME,
  createContentTheme,
  createLivePreviewExtensions,
  createCodeDecorationExtension,
  remeasureEffect,
} from '../extensions/hybridMarkdown';
import { isStructuredTableOverlayTarget } from '../extensions/structuredTable';
import { createLanguageDescriptions } from '../extensions/languageSupport';
import { createCodeBlockDecoratorExtension } from '../extensions/codeBlockDecorator';
import { createCodeBlockLivePreviewExtension } from '../extensions/codeBlockLivePreview';
import { createCodeThemeExtension } from '../extensions/codeThemeExtension';
import {
  ensureVimGlobalSetup,
  registerVimSaveHandler,
  unregisterVimSaveHandler,
  vim,
} from '../extensions/vim';
import type { Heading, EditorProps } from '../types/editor';
import type { EditorFileInputSource, EditorRuntimeInput } from '../types/editorRuntime';

const fillHeightLayout = EditorView.theme({
  '&': {
    height: '100%',
  },
  '.cm-scroller': {
    height: '100%',
  },
  '.cm-content': {
    minHeight: '100%',
    maxWidth: 'var(--una-content-max-width, 720px)',
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: '10px 12px',
  },
  '.cm-gutters': {
    minHeight: '100%',
    flexShrink: '0',
    backgroundColor: 'transparent',
    borderRight: 'none',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    boxSizing: 'border-box',
    padding: '0 16px 0 4px',
    fontSize: '0.92em',
    lineHeight: 'inherit',
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: '"tnum"',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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

interface EditorRuntimeCompartments {
  theme: Compartment;
  hybrid: Compartment;
  codeDecoration: Compartment;
  vim: Compartment;
  lineNumbers: Compartment;
  placeholder: Compartment;
  readOnly: Compartment;
  editable: Compartment;
  lineWrap: Compartment;
  codeTheme: Compartment;
  codeBlockDecorator: Compartment;
  codeBlockLivePreview: Compartment;
  contentTheme: Compartment;
}

interface EditorSyncState {
  isApplyingExternalUpdate: boolean;
}

interface EditorDocumentSyncStrategy {
  applyExternalValue: (view: EditorView, value: string) => void;
}

interface EditorRuntimeContext {
  editorView: Ref<EditorView | undefined>;
  compartments: EditorRuntimeCompartments;
  syncState: EditorSyncState;
  documentSyncStrategy: EditorDocumentSyncStrategy;
}

interface EditorInteractivityState {
  isDisabled: boolean;
  isReadonly: boolean;
  isReadOnly: boolean;
  isEditable: boolean;
}

function createRuntimeCompartments(): EditorRuntimeCompartments {
  return {
    theme: new Compartment(),
    hybrid: new Compartment(),
    codeDecoration: new Compartment(),
    vim: new Compartment(),
    lineNumbers: new Compartment(),
    placeholder: new Compartment(),
    readOnly: new Compartment(),
    editable: new Compartment(),
    lineWrap: new Compartment(),
    codeTheme: new Compartment(),
    codeBlockDecorator: new Compartment(),
    codeBlockLivePreview: new Compartment(),
    contentTheme: new Compartment(),
  };
}

function createWholeDocumentSyncStrategy(syncState: EditorSyncState): EditorDocumentSyncStrategy {
  return {
    applyExternalValue(view, value) {
      const currentValue = view.state.doc.toString();
      if (value === currentValue) return;

      syncState.isApplyingExternalUpdate = true;
      try {
        view.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: value,
          },
        });
      } finally {
        syncState.isApplyingExternalUpdate = false;
      }
    },
  };
}

function createRuntimeContext(): EditorRuntimeContext {
  const syncState: EditorSyncState = {
    isApplyingExternalUpdate: false,
  };

  return {
    editorView: ref<EditorView>(),
    compartments: createRuntimeCompartments(),
    syncState,
    documentSyncStrategy: createWholeDocumentSyncStrategy(syncState),
  };
}

function resolveInteractivityState(
  input: Pick<EditorProps, 'disabled' | 'readonly'>,
): EditorInteractivityState {
  const isDisabled = input.disabled === true;
  const isReadonly = input.readonly === true;

  return {
    isDisabled,
    isReadonly,
    isReadOnly: isDisabled || isReadonly,
    isEditable: !isDisabled,
  };
}

function extractImageFiles(dataTransfer?: DataTransfer | null): File[] {
  if (!dataTransfer) return [];

  const files: File[] = [];
  for (let i = 0; i < dataTransfer.files.length; i += 1) {
    const file = dataTransfer.files[i];
    if (file.type.startsWith('image/')) {
      files.push(file);
    }
  }

  return files;
}

function createFileInputHandler(
  input: EditorRuntimeInput,
  source: EditorFileInputSource,
  dataTransfer: DataTransfer | null | undefined,
  event: DragEvent | ClipboardEvent,
): boolean {
  const files = extractImageFiles(dataTransfer);
  if (!files.length) return false;

  event.preventDefault();
  if (resolveInteractivityState(input.props).isDisabled) {
    return true;
  }

  input.callbacks.onFileInput({ source, files });
  return true;
}

function createEditorExtensions(
  input: EditorRuntimeInput,
  runtime: EditorRuntimeContext,
): Extension[] {
  const { props, appearance, callbacks } = input;
  const { compartments, syncState } = runtime;
  const currentAppearance = appearance.value;
  const interactivity = resolveInteractivityState(props);

  return [
    history(),
    keymap.of(historyKeymap),
    keymap.of(defaultKeymap),
    Prec.highest(
      keymap.of([
        {
          key: 'Mod-s',
          preventDefault: true,
          run: () => {
            callbacks.onSave();
            return true;
          },
        },
      ]),
    ),
    markdown({
      base: markdownLanguage,
      codeLanguages: createLanguageDescriptions(),
    }),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    compartments.vim.of(props.vimMode ? vim({ status: false }) : []),
    fillHeightLayout,
    fontTheme,
    HYBRID_BASE_THEME,
    compartments.contentTheme.of(createContentTheme(currentAppearance.editorTheme.content)),
    compartments.codeBlockDecorator.of(
      createCodeBlockDecoratorExtension(props.codeLineNumbers || false),
    ),
    compartments.codeBlockLivePreview.of(
      props.livePreview
        ? createCodeBlockLivePreviewExtension({
            showLineNumbers: props.codeLineNumbers || false,
          })
        : [],
    ),
    compartments.hybrid.of(props.livePreview ? createLivePreviewExtensions(props.renderHooks) : []),
    compartments.codeDecoration.of(props.livePreview ? [] : createCodeDecorationExtension()),
    compartments.theme.of(currentAppearance.editorTheme.chrome),
    compartments.codeTheme.of(createCodeThemeExtension(currentAppearance.codeTheme)),
    compartments.lineNumbers.of(props.lineNumbers !== false ? lineNumbers() : []),
    compartments.lineWrap.of(props.lineWrap !== false ? EditorView.lineWrapping : []),
    compartments.placeholder.of(props.placeholder ? placeholderExt(props.placeholder) : []),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !syncState.isApplyingExternalUpdate) {
        const value = update.state.doc.toString();
        callbacks.onModelValueChange(value);
        callbacks.onChange(value);
      }
    }),
    EditorView.domEventHandlers({
      focus: () => {
        callbacks.onFocus();
      },
      blur: (event) => {
        if (isStructuredTableOverlayTarget(event.relatedTarget)) {
          return;
        }
        callbacks.onBlur();
      },
      drop: (event) => {
        return createFileInputHandler(input, 'drop', event.dataTransfer, event);
      },
      paste: (event) => {
        return createFileInputHandler(input, 'paste', event.clipboardData, event);
      },
    }),
    compartments.readOnly.of(EditorState.readOnly.of(interactivity.isReadOnly)),
    compartments.editable.of(EditorView.editable.of(interactivity.isEditable)),
  ];
}

function mountEditorRuntime(
  container: Ref<HTMLElement | undefined>,
  input: EditorRuntimeInput,
  runtime: EditorRuntimeContext,
): void {
  if (!container.value) return;

  if (input.props.vimMode) {
    ensureVimGlobalSetup();
  }

  const view = new EditorView({
    state: EditorState.create({
      doc: input.props.modelValue,
      extensions: createEditorExtensions(input, runtime),
    }),
    parent: container.value,
  });

  runtime.editorView.value = view;
  registerVimSaveHandler(view, input.callbacks.onSave);
}

function teardownEditorRuntime(runtime: EditorRuntimeContext): void {
  const view = runtime.editorView.value;
  if (!view) return;

  unregisterVimSaveHandler(view);
  view.destroy();
  runtime.editorView.value = undefined;
}

function setupDocumentSynchronization(
  input: EditorRuntimeInput,
  runtime: EditorRuntimeContext,
): void {
  watch(
    () => input.props.modelValue,
    (value) => {
      const view = runtime.editorView.value;
      if (!view) return;
      runtime.documentSyncStrategy.applyExternalValue(view, value);
    },
  );
}

function setupAppearanceSynchronization(
  input: EditorRuntimeInput,
  runtime: EditorRuntimeContext,
): void {
  watch(
    input.appearance,
    (nextAppearance, previousAppearance) => {
      const view = runtime.editorView.value;
      if (!view) return;

      const themeChanged =
        !previousAppearance ||
        nextAppearance.contentThemeSignature !== previousAppearance.contentThemeSignature;
      const codeThemeChanged =
        !previousAppearance ||
        nextAppearance.codeThemeSignature !== previousAppearance.codeThemeSignature;
      const layoutChanged =
        !previousAppearance ||
        nextAppearance.layoutSignature !== previousAppearance.layoutSignature;

      const effects = [];
      if (themeChanged) {
        effects.push(
          runtime.compartments.theme.reconfigure(nextAppearance.editorTheme.chrome),
          runtime.compartments.contentTheme.reconfigure(
            createContentTheme(nextAppearance.editorTheme.content),
          ),
        );
      }
      if (codeThemeChanged) {
        effects.push(
          runtime.compartments.codeTheme.reconfigure(
            createCodeThemeExtension(nextAppearance.codeTheme),
          ),
        );
      }
      if (themeChanged || codeThemeChanged || layoutChanged) {
        effects.push(remeasureEffect.of(null));
      }

      if (effects.length) {
        view.dispatch({ effects });
      }

      const fontFamilyChanged =
        nextAppearance.fontFamily !== previousAppearance?.fontFamily ||
        nextAppearance.codeFontFamily !== previousAppearance?.codeFontFamily;

      if (
        layoutChanged &&
        fontFamilyChanged &&
        typeof document !== 'undefined' &&
        'fonts' in document
      ) {
        document.fonts.ready.then(() => {
          runtime.editorView.value?.dispatch({ effects: remeasureEffect.of(null) });
        });
      }
    },
    { flush: 'post' },
  );
}

function setupBehaviorSynchronization(
  input: EditorRuntimeInput,
  runtime: EditorRuntimeContext,
): void {
  watch(
    () => [input.props.codeLineNumbers, input.props.livePreview] as const,
    ([showLineNumbers, livePreview]) => {
      const view = runtime.editorView.value;
      if (!view) return;

      view.dispatch({
        effects: [
          runtime.compartments.codeBlockDecorator.reconfigure(
            createCodeBlockDecoratorExtension(showLineNumbers || false),
          ),
          runtime.compartments.codeBlockLivePreview.reconfigure(
            livePreview
              ? createCodeBlockLivePreviewExtension({
                  showLineNumbers: showLineNumbers || false,
                })
              : [],
          ),
        ],
      });
    },
  );

  watch(
    () => [input.props.livePreview, input.props.renderHooks] as const,
    ([enabled, renderHooks]) => {
      const view = runtime.editorView.value;
      if (!view) return;

      view.dispatch({
        effects: [
          runtime.compartments.hybrid.reconfigure(
            enabled ? createLivePreviewExtensions(renderHooks) : [],
          ),
          runtime.compartments.codeDecoration.reconfigure(
            enabled ? [] : createCodeDecorationExtension(),
          ),
        ],
      });
    },
  );

  watch(
    () => input.props.lineNumbers,
    (showLineNumbers) => {
      const view = runtime.editorView.value;
      if (!view) return;

      view.dispatch({
        effects: runtime.compartments.lineNumbers.reconfigure(
          showLineNumbers !== false ? lineNumbers() : [],
        ),
      });
    },
  );

  watch(
    () => input.props.lineWrap,
    (shouldWrap) => {
      const view = runtime.editorView.value;
      if (!view) return;

      view.dispatch({
        effects: runtime.compartments.lineWrap.reconfigure(
          shouldWrap !== false ? EditorView.lineWrapping : [],
        ),
      });
    },
  );

  watch(
    () => input.props.placeholder,
    (nextPlaceholder) => {
      const view = runtime.editorView.value;
      if (!view) return;

      view.dispatch({
        effects: runtime.compartments.placeholder.reconfigure(
          nextPlaceholder ? placeholderExt(nextPlaceholder) : [],
        ),
      });
    },
  );

  watch(
    () => [input.props.disabled, input.props.readonly] as const,
    ([disabled, readonly]) => {
      const view = runtime.editorView.value;
      if (!view) return;

      const interactivity = resolveInteractivityState({ disabled, readonly });
      view.dispatch({
        effects: [
          runtime.compartments.readOnly.reconfigure(
            EditorState.readOnly.of(interactivity.isReadOnly),
          ),
          runtime.compartments.editable.reconfigure(
            EditorView.editable.of(interactivity.isEditable),
          ),
        ],
      });
    },
  );
}

function setupIntegrationSynchronization(
  input: EditorRuntimeInput,
  runtime: EditorRuntimeContext,
): void {
  watch(
    () => input.props.vimMode,
    (enabled) => {
      const view = runtime.editorView.value;
      if (!view) return;

      if (enabled) {
        ensureVimGlobalSetup();
      }

      view.dispatch({
        effects: runtime.compartments.vim.reconfigure(enabled ? vim({ status: false }) : []),
      });
    },
  );
}

export function useEditor(container: Ref<HTMLElement | undefined>, input: EditorRuntimeInput) {
  const runtime = createRuntimeContext();
  const { props } = input;

  onMounted(() => {
    mountEditorRuntime(container, input, runtime);
  });

  setupDocumentSynchronization(input, runtime);
  setupAppearanceSynchronization(input, runtime);
  setupBehaviorSynchronization(input, runtime);
  setupIntegrationSynchronization(input, runtime);

  onBeforeUnmount(() => {
    teardownEditorRuntime(runtime);
  });

  // Exposed methods
  const focus = () => {
    runtime.editorView.value?.focus();
  };

  const getSelection = (): string => {
    if (!runtime.editorView.value) return '';
    const state = runtime.editorView.value.state;
    const selection = state.selection.main;
    return state.doc.sliceString(selection.from, selection.to);
  };

  const getEditorView = (): EditorView | undefined => {
    return runtime.editorView.value;
  };

  const insertText = (text: string) => {
    if (!runtime.editorView.value) return;
    if (resolveInteractivityState(props).isReadOnly) return;

    const view = runtime.editorView.value;
    const selection = view.state.selection.main;

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
    if (!runtime.editorView.value) return [];
    const state = runtime.editorView.value.state;
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
    if (!runtime.editorView.value) return;
    const doc = runtime.editorView.value.state.doc;

    if (lineNumber < 1) lineNumber = 1;
    if (lineNumber > doc.lines) lineNumber = doc.lines;

    const line = doc.line(lineNumber);
    const view = runtime.editorView.value;
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

  const undoHistory = () => {
    if (!runtime.editorView.value) return false;
    if (resolveInteractivityState(props).isReadOnly) return false;
    return undo(runtime.editorView.value);
  };

  const redoHistory = () => {
    if (!runtime.editorView.value) return false;
    if (resolveInteractivityState(props).isReadOnly) return false;
    return redo(runtime.editorView.value);
  };

  return {
    editorView: runtime.editorView,
    focus,
    getSelection,
    getEditorView,
    insertText,
    getHeadings,
    scrollToLine,
    undoHistory,
    redoHistory,
  };
}
