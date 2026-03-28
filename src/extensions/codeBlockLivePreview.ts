import { syntaxTree } from '@codemirror/language';
import type { Range } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import { getLanguageDisplayLabel, normalizeLanguageIdentifier } from './languageSupport';

interface CodeBlockLivePreviewOptions {
  showLineNumbers: boolean;
}

interface FencedCodeBlockInfo {
  from: number;
  to: number;
  openingFrom: number;
  closingFrom: number;
  openingTo: number;
  closingTo: number;
  bodyFrom: number;
  bodyTo: number;
  bodyLineCount: number;
  rawLanguage: string | null;
  displayLabel: string | null;
}

const GUTTER_CLASS_BY_DIGITS = new Map([
  [1, 'cm-code-block-live-gutter-1'],
  [2, 'cm-code-block-live-gutter-2'],
  [3, 'cm-code-block-live-gutter-3'],
  [4, 'cm-code-block-live-gutter-4'],
  [5, 'cm-code-block-live-gutter-5'],
  [6, 'cm-code-block-live-gutter-6'],
] as const);

const COPY_ICON_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M28 10v18H10V10h18m0-2H10a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Z'/%3E%3Cpath d='M4 18H2V4a2 2 0 0 1 2-2h14v2H4Z'/%3E%3Cpath fill='none' d='M0 0h32v32H0z'/%3E%3C/svg%3E\")";

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy copy path.
  }

  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
    return false;
  }

  const textarea = document.createElement('textarea');
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    textarea.remove();
    activeElement?.focus({ preventScroll: true });
  }
}

function focusCodeBlockPosition(view: EditorView, position: number) {
  view.focus();
  view.dispatch({
    selection: { anchor: position },
    scrollIntoView: true,
  });
}

function extractFenceLanguage(lineText: string): string | null {
  const trimmed = lineText.trim();
  const match = trimmed.match(/^(?:`{3,}|~{3,})(?<rest>.*)$/);
  if (!match?.groups?.rest) return null;

  const identifier = match.groups.rest.trim().split(/\s+/, 1)[0]?.trim() ?? '';
  return identifier || null;
}

function resolveVisibleCodeBlocks(view: EditorView): FencedCodeBlockInfo[] {
  const blocks: FencedCodeBlockInfo[] = [];
  const seen = new Set<string>();
  const tree = syntaxTree(view.state);

  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
      from,
      to,
      enter: (node) => {
        if (node.name !== 'FencedCode') return;

        const key = `${node.from}:${node.to}`;
        if (seen.has(key)) return false;
        seen.add(key);

        const openingLine = view.state.doc.lineAt(node.from);
        const closingLine = view.state.doc.lineAt(node.to);
        const bodyFrom = openingLine.to < closingLine.from ? openingLine.to + 1 : openingLine.to;
        const bodyTo = closingLine.from;
        const bodyLineCount = Math.max(0, closingLine.number - openingLine.number - 1);
        const rawLanguage = extractFenceLanguage(openingLine.text);
        const normalizedLanguage =
          rawLanguage != null ? (normalizeLanguageIdentifier(rawLanguage) ?? rawLanguage) : null;
        const displayLabel =
          normalizedLanguage != null ? (getLanguageDisplayLabel(normalizedLanguage) ?? null) : null;

        blocks.push({
          from: node.from,
          to: node.to,
          openingFrom: openingLine.from,
          openingTo: openingLine.to,
          closingFrom: closingLine.from,
          closingTo: closingLine.to,
          bodyFrom,
          bodyTo,
          bodyLineCount,
          rawLanguage,
          displayLabel,
        });

        return false;
      },
    });
  }

  return blocks;
}

function isBlockActive(view: EditorView, block: FencedCodeBlockInfo): boolean {
  if (!view.hasFocus) return false;

  return view.state.selection.ranges.some((range) => {
    if (range.empty) {
      return range.from >= block.from && range.from <= block.to;
    }

    return range.from <= block.to && range.to >= block.from;
  });
}

function getBodyText(view: EditorView, block: FencedCodeBlockInfo): string {
  if (block.bodyLineCount === 0 || block.bodyFrom > block.bodyTo) return '';
  const lastBodyLine = view.state.doc.lineAt(block.closingFrom - 1);
  return view.state.doc.sliceString(block.bodyFrom, lastBodyLine.to);
}

function getGutterClass(bodyLineCount: number): string {
  const digits = Math.max(1, String(Math.max(1, bodyLineCount)).length);
  const gutterDigits = Math.min(6, digits) as 1 | 2 | 3 | 4 | 5 | 6;
  return GUTTER_CLASS_BY_DIGITS.get(gutterDigits) ?? 'cm-code-block-live-gutter-6';
}

class CodeBlockLeadingSlotWidget extends WidgetType {
  constructor(
    private readonly text: string,
    private readonly gutterClass: string,
  ) {
    super();
  }

  eq(other: CodeBlockLeadingSlotWidget): boolean {
    return this.text === other.text && this.gutterClass === other.gutterClass;
  }

  toDOM(): HTMLElement {
    const slot = document.createElement('span');
    slot.className = `cm-code-block-live-leading-slot ${this.gutterClass}`;
    slot.textContent = this.text || '\u00a0';
    slot.setAttribute('aria-hidden', 'true');
    return slot;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

class CodeBlockHeaderWidget extends WidgetType {
  constructor(
    private readonly openingFrom: number,
    private readonly displayLabel: string | null,
    private readonly bodyText: string,
  ) {
    super();
  }

  eq(other: CodeBlockHeaderWidget): boolean {
    return (
      this.openingFrom === other.openingFrom &&
      this.displayLabel === other.displayLabel &&
      this.bodyText === other.bodyText
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('span');
    wrapper.className = 'cm-code-block-header-row';
    wrapper.contentEditable = 'false';

    wrapper.addEventListener('mousedown', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('.cm-code-block-copy-button')) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      focusCodeBlockPosition(view, this.openingFrom);
    });

    if (this.displayLabel) {
      const label = document.createElement('span');
      label.className = 'cm-code-block-language-label';
      label.textContent = this.displayLabel;
      wrapper.appendChild(label);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cm-code-block-copy-button';
    button.setAttribute('aria-label', 'Copy code block');
    button.title = 'Copy code block';

    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      void copyTextToClipboard(this.bodyText);
    });

    wrapper.appendChild(button);
    return wrapper;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

class CodeBlockEndCapWidget extends WidgetType {
  constructor(private readonly closingFrom: number) {
    super();
  }

  eq(other: CodeBlockEndCapWidget): boolean {
    return this.closingFrom === other.closingFrom;
  }

  toDOM(view: EditorView): HTMLElement {
    const spacer = document.createElement('span');
    spacer.className = 'cm-code-block-end-cap';
    spacer.textContent = '\u00a0';
    spacer.contentEditable = 'false';
    spacer.setAttribute('aria-hidden', 'true');

    spacer.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      focusCodeBlockPosition(view, this.closingFrom);
    });

    return spacer;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

class CodeBlockLivePreviewPlugin {
  decorations: DecorationSet;

  constructor(
    view: EditorView,
    private readonly options: CodeBlockLivePreviewOptions,
  ) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (
      update.docChanged ||
      update.viewportChanged ||
      update.selectionSet ||
      update.focusChanged ||
      update.geometryChanged
    ) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const decorations: Range<Decoration>[] = [];

    for (const block of resolveVisibleCodeBlocks(view)) {
      const active = isBlockActive(view, block);
      const bodyText = getBodyText(view, block);
      const gutterClass = getGutterClass(block.bodyLineCount);
      const sharedClasses = [
        'cm-code-block-live-shell',
        active ? 'cm-code-block-live-active' : 'cm-code-block-live-inactive',
      ];

      const lines: Array<{
        from: number;
        to: number;
        className: string;
        slotText: string;
        shouldReplaceHeader: boolean;
        shouldReplaceEnd: boolean;
      }> = [];

      const openingLine = view.state.doc.lineAt(block.openingFrom);
      const closingLine = view.state.doc.lineAt(block.closingFrom);

      lines.push({
        from: openingLine.from,
        to: openingLine.to,
        className: ['cm-code-block-live-begin', ...sharedClasses].join(' '),
        slotText: '',
        shouldReplaceHeader: !active,
        shouldReplaceEnd: false,
      });

      for (
        let lineNumber = openingLine.number + 1, bodyLineNumber = 1;
        lineNumber < closingLine.number;
        lineNumber += 1, bodyLineNumber += 1
      ) {
        const line = view.state.doc.line(lineNumber);
        lines.push({
          from: line.from,
          to: line.to,
          className: ['cm-code-block-live-body', ...sharedClasses].join(' '),
          slotText: this.options.showLineNumbers ? String(bodyLineNumber) : '',
          shouldReplaceHeader: false,
          shouldReplaceEnd: false,
        });
      }

      lines.push({
        from: closingLine.from,
        to: closingLine.to,
        className: ['cm-code-block-live-end', ...sharedClasses].join(' '),
        slotText: '',
        shouldReplaceHeader: false,
        shouldReplaceEnd: !active,
      });

      for (const line of lines) {
        const classNames = [line.className];

        if (this.options.showLineNumbers) {
          classNames.push('cm-code-block-live-with-slot', gutterClass);
          decorations.push(
            Decoration.widget({
              widget: new CodeBlockLeadingSlotWidget(line.slotText, gutterClass),
              side: -1,
            }).range(line.from),
          );
        }

        decorations.push(
          Decoration.line({
            class: classNames.join(' '),
          }).range(line.from),
        );

        if (line.shouldReplaceHeader) {
          decorations.push(
            Decoration.replace({
              widget: new CodeBlockHeaderWidget(block.openingFrom, block.displayLabel, bodyText),
            }).range(line.from, line.to),
          );
        }

        if (line.shouldReplaceEnd) {
          decorations.push(
            Decoration.replace({
              widget: new CodeBlockEndCapWidget(block.closingFrom),
            }).range(line.from, line.to),
          );
        }
      }
    }

    return Decoration.set(decorations, true);
  }
}

const CODE_BLOCK_LIVE_PREVIEW_THEME = EditorView.baseTheme({
  '.cm-line.cm-code-block-live-shell': {
    position: 'relative',
    marginLeft: 'var(--cm-code-block-live-inline-inset, 0.5rem)',
    marginRight: 'var(--cm-code-block-live-inline-inset, 0.5rem)',
    paddingLeft:
      'calc(var(--cm-code-block-live-content-padding, 0.75rem) + var(--cm-code-block-live-gutter-width, 0px) + var(--cm-code-block-live-gutter-gap, 0.5rem))',
    paddingRight: 'var(--cm-code-block-live-content-padding, 0.75rem)',
  },
  '.cm-line.cm-code-block-live-begin': {
    paddingTop: '0.12rem',
    paddingBottom: '0.12rem',
    minHeight: '1.6em',
  },
  '.cm-line.cm-code-block-live-end': {
    paddingBottom: '0.16rem',
  },
  '.cm-code-block-live-leading-slot': {
    position: 'absolute',
    left: '0',
    top: '0',
    bottom: '0',
    display: 'inline-flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: '"tnum"',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.9em',
    lineHeight: 'inherit',
    boxSizing: 'border-box',
    paddingLeft: 'var(--cm-code-block-live-content-padding, 0.75rem)',
    paddingRight: '0.32rem',
    userSelect: 'none',
    pointerEvents: 'none',
  },
  '.cm-code-block-header-row': {
    position: 'absolute',
    right: 'var(--cm-code-block-live-content-padding, 0.75rem)',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.35rem',
    maxWidth:
      'calc(100% - var(--cm-code-block-live-content-padding, 0.75rem) * 2 - var(--cm-code-block-live-gutter-width, 0px) - var(--cm-code-block-live-gutter-gap, 0.5rem))',
    whiteSpace: 'nowrap',
    pointerEvents: 'auto',
  },
  '.cm-code-block-language-label': {
    flex: '0 1 auto',
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.72em',
    letterSpacing: '0.01em',
    opacity: '0.78',
  },
  '.cm-code-block-copy-button': {
    border: 'none',
    background: 'transparent',
    padding: '0',
    width: '1.15rem',
    height: '1.15rem',
    borderRadius: '4px',
    cursor: 'pointer',
    lineHeight: '1',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  '.cm-code-block-copy-button::before': {
    content: '""',
    display: 'inline-block',
    width: '14px',
    height: '14px',
    backgroundColor: 'currentColor',
    WebkitMaskImage: COPY_ICON_MASK,
    maskImage: COPY_ICON_MASK,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: '14px 14px',
    maskSize: '14px 14px',
  },
  '.cm-code-block-copy-button:focus-visible': {
    outline: '2px solid currentColor',
    outlineOffset: '1px',
  },
  '.cm-code-block-end-cap': {
    display: 'inline-block',
    width: '100%',
    visibility: 'hidden',
    userSelect: 'none',
  },
  '.cm-line.cm-code-block-live-begin .cm-code-block-live-leading-slot': {
    borderTopLeftRadius: '8px',
  },
  '.cm-line.cm-code-block-live-end .cm-code-block-live-leading-slot': {
    borderBottomLeftRadius: '8px',
  },
  '.cm-line.cm-code-block-live-shell.cm-code-block-line[data-code-line-number]::before': {
    content: 'none',
    display: 'none',
  },
  '.cm-line.cm-code-block-live-gutter-1': {
    '--cm-code-block-live-gutter-width': '1.5rem',
  },
  '.cm-line.cm-code-block-live-gutter-2': {
    '--cm-code-block-live-gutter-width': '2rem',
  },
  '.cm-line.cm-code-block-live-gutter-3': {
    '--cm-code-block-live-gutter-width': '2.5rem',
  },
  '.cm-line.cm-code-block-live-gutter-4': {
    '--cm-code-block-live-gutter-width': '3rem',
  },
  '.cm-line.cm-code-block-live-gutter-5': {
    '--cm-code-block-live-gutter-width': '3.5rem',
  },
  '.cm-line.cm-code-block-live-gutter-6': {
    '--cm-code-block-live-gutter-width': '4rem',
  },
  '.cm-code-block-live-leading-slot.cm-code-block-live-gutter-1': {
    width: 'calc(var(--cm-code-block-live-content-padding, 0.75rem) + 1.5rem)',
  },
  '.cm-code-block-live-leading-slot.cm-code-block-live-gutter-2': {
    width: 'calc(var(--cm-code-block-live-content-padding, 0.75rem) + 2rem)',
  },
  '.cm-code-block-live-leading-slot.cm-code-block-live-gutter-3': {
    width: 'calc(var(--cm-code-block-live-content-padding, 0.75rem) + 2.5rem)',
  },
  '.cm-code-block-live-leading-slot.cm-code-block-live-gutter-4': {
    width: 'calc(var(--cm-code-block-live-content-padding, 0.75rem) + 3rem)',
  },
  '.cm-code-block-live-leading-slot.cm-code-block-live-gutter-5': {
    width: 'calc(var(--cm-code-block-live-content-padding, 0.75rem) + 3.5rem)',
  },
  '.cm-code-block-live-leading-slot.cm-code-block-live-gutter-6': {
    width: 'calc(var(--cm-code-block-live-content-padding, 0.75rem) + 4rem)',
  },
});

export function createCodeBlockLivePreviewExtension(
  options: CodeBlockLivePreviewOptions,
): Extension {
  return [
    ViewPlugin.fromClass(
      class {
        plugin: CodeBlockLivePreviewPlugin;

        constructor(view: EditorView) {
          this.plugin = new CodeBlockLivePreviewPlugin(view, options);
        }

        update(update: ViewUpdate) {
          this.plugin.update(update);
        }

        get decorations() {
          return this.plugin.decorations;
        }
      },
      {
        decorations: (value) => value.decorations,
      },
    ),
    CODE_BLOCK_LIVE_PREVIEW_THEME,
  ];
}
