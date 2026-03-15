import { Decoration, EditorView, ViewPlugin, WidgetType, keymap } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Prec, StateEffect, type Extension, type Range } from '@codemirror/state';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { Vim } from '@replit/codemirror-vim';

// Effect dispatched after font CSS variables are updated, to signal
// HybridMarkdownPlugin to rebuild decorations within a real transaction.
export const remeasureEffect = StateEffect.define<null>();

let vimHybridNavInitialized = false;

export function setupVimLogicalNavigation() {
  if (vimHybridNavInitialized) return;
  vimHybridNavInitialized = true;

  try {
    // Define a custom strict-logical motion for Vim mode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Vim.defineMotion('hybridMoveByLines', (cm: any, head: any, motionArgs: any, vimState: any) => {
      const view = cm.cm6;
      if (!view) return head;

      const direction = motionArgs.forward ? 1 : -1;
      const count = motionArgs.repeat || 1;

      const currentLine = view.state.doc.lineAt(cm.indexFromPos(head));
      const targetLineNumber = currentLine.number + direction * count;

      if (targetLineNumber < 1) {
        return cm.posFromIndex(0);
      }
      if (targetLineNumber > view.state.doc.lines) {
        return cm.posFromIndex(view.state.doc.length);
      }

      const targetLine = view.state.doc.line(targetLineNumber);

      // Use Vim's internal goal column state (lastHPos)
      let goalColumn = vimState.lastHPos;
      if (goalColumn === undefined || goalColumn < 0) {
        goalColumn = head.ch;
      }

      const targetPosition = Math.min(targetLine.to, targetLine.from + goalColumn);
      return cm.posFromIndex(targetPosition);
    });

    // Map j/k and arrow keys to logical line motion (Vim convention)
    Vim.mapCommand('j', 'motion', 'hybridMoveByLines', { forward: true, linewise: true }, {});
    Vim.mapCommand('k', 'motion', 'hybridMoveByLines', { forward: false, linewise: true }, {});
    Vim.mapCommand('<Down>', 'motion', 'hybridMoveByLines', { forward: true, linewise: true }, {});
    Vim.mapCommand('<Up>', 'motion', 'hybridMoveByLines', { forward: false, linewise: true }, {});
  } catch {
    // Silently ignore if Vim is not fully available or compatible
  }
}

interface HybridScope {
  from: number;
  to: number;
  name: string;
}

interface ActiveSyntaxNode {
  from: number;
  to: number;
  name: string;
  parent: ActiveSyntaxNode | null;
}

const HYBRID_SCOPE_NODES = new Set([
  'ATXHeading1',
  'ATXHeading2',
  'ATXHeading3',
  'ATXHeading4',
  'ATXHeading5',
  'ATXHeading6',
  'SetextHeading1',
  'SetextHeading2',
  'Emphasis',
  'StrongEmphasis',
  'Link',
  'InlineCode',
  'Image',
  'Blockquote',
  'FencedCode',
]);

const HYBRID_THEME = EditorView.theme({
  '.cm-una-code-font': {
    fontFamily:
      'var(--una-code-font-family, ui-monospace, SFMono-Regular, Menlo, monospace)',
  },
  '.cm-hybrid-heading-1': {
    fontSize: '1.875em',
    fontWeight: '700',
    lineHeight: '1.25',
  },
  '.cm-hybrid-heading-2': {
    fontSize: '1.5em',
    fontWeight: '700',
    lineHeight: '1.3',
  },
  '.cm-hybrid-heading-3': {
    fontSize: '1.25em',
    fontWeight: '700',
    lineHeight: '1.35',
  },
  '.cm-hybrid-heading-4, .cm-hybrid-heading-5, .cm-hybrid-heading-6': {
    fontWeight: '700',
    lineHeight: '1.4',
  },
  '.cm-hybrid-emphasis': {
    fontStyle: 'italic',
  },
  '.cm-hybrid-strong': {
    fontWeight: '700',
  },
  '.cm-hybrid-link': {
    color: '#0b57d0',
    textDecoration: 'underline',
    textUnderlineOffset: '0.18em',
  },
  '.cm-hybrid-inline-code': {
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: '4px',
    padding: '0.1em 0.3em',
  },
  '.cm-line.cm-hybrid-blockquote-line': {
    borderLeft: '3px solid rgba(100, 116, 139, 0.5)',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    paddingLeft: '0.75rem',
    fontStyle: 'italic',
  },
  '.cm-line.cm-hybrid-fenced-code-line': {
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
  },
  '.cm-hybrid-image': {
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: '100%',
    verticalAlign: 'middle',
  },
  '.cm-hybrid-image-element': {
    display: 'block',
    maxWidth: 'min(100%, 28rem)',
    maxHeight: '14rem',
    borderRadius: '8px',
    objectFit: 'contain',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
  },
  '&.cm-focused .cm-hybrid-image-element': {
    outline: 'none',
  },
});

const hiddenDecoration = Decoration.replace({});
const emphasisDecoration = Decoration.mark({ class: 'cm-hybrid-emphasis' });
const strongDecoration = Decoration.mark({ class: 'cm-hybrid-strong' });
const linkDecoration = Decoration.mark({ class: 'cm-hybrid-link' });
const inlineCodeDecoration = Decoration.mark({
  class: 'cm-una-code-font cm-hybrid-inline-code',
});

class ImageWidget extends WidgetType {
  constructor(
    private readonly source: string,
    private readonly alt: string,
  ) {
    super();
  }

  eq(other: ImageWidget): boolean {
    return this.source === other.source && this.alt === other.alt;
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('span');
    wrapper.className = 'cm-hybrid-image';
    wrapper.contentEditable = 'false';

    const image = document.createElement('img');
    image.className = 'cm-hybrid-image-element';
    image.src = this.source;
    image.alt = this.alt;
    image.loading = 'lazy';

    wrapper.appendChild(image);
    return wrapper;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

class HybridMarkdownPlugin {
  decorations: DecorationSet;
  private activeScopes: HybridScope[];

  constructor(view: EditorView) {
    this.activeScopes = getActiveScopes(view);
    this.decorations = buildDecorations(view, this.activeScopes);
  }

  update(update: ViewUpdate): void {
    const nextScopes = getActiveScopes(update.view);
    const activeChanged = !sameScopes(this.activeScopes, nextScopes);
    const hasRemeasure = update.transactions.some((tr) => tr.effects.some((e) => e.is(remeasureEffect)));

    if (
      update.docChanged ||
      update.viewportChanged ||
      update.focusChanged ||
      activeChanged ||
      hasRemeasure
    ) {
      this.activeScopes = nextScopes;
      this.decorations = buildDecorations(update.view, nextScopes);
      return;
    }

    this.activeScopes = nextScopes;
  }
}

function addScopeFromNode(
  node: ActiveSyntaxNode | null,
  selection: { from: number; to: number },
  scopes: HybridScope[],
  seen: Set<string>,
): void {
  let current = node;

  while (current) {
    if (
      current.from <= selection.from &&
      current.to >= selection.to &&
      HYBRID_SCOPE_NODES.has(current.name)
    ) {
      const key = `${current.name}:${current.from}:${current.to}`;

      if (!seen.has(key)) {
        seen.add(key);
        scopes.push({
          from: current.from,
          to: current.to,
          name: current.name,
        });
      }
    }

    current = current.parent;
  }
}

function getActiveScopes(view: EditorView): HybridScope[] {
  const selection = view.state.selection.main;

  if (!view.hasFocus && selection.from === 0 && selection.to === 0) {
    return [];
  }

  const scopes: HybridScope[] = [];
  const seen = new Set<string>();
  const anchorLeft = syntaxTree(view.state).resolveInner(selection.from, -1) as ActiveSyntaxNode;
  const anchorRight = syntaxTree(view.state).resolveInner(selection.from, 1) as ActiveSyntaxNode;

  addScopeFromNode(anchorLeft, selection, scopes, seen);
  addScopeFromNode(anchorRight, selection, scopes, seen);

  if (selection.to !== selection.from) {
    const headLeft = syntaxTree(view.state).resolveInner(selection.to, -1) as ActiveSyntaxNode;
    const headRight = syntaxTree(view.state).resolveInner(selection.to, 1) as ActiveSyntaxNode;

    addScopeFromNode(headLeft, selection, scopes, seen);
    addScopeFromNode(headRight, selection, scopes, seen);
  }

  return scopes;
}

function sameScopes(left: HybridScope[], right: HybridScope[]): boolean {
  if (left.length !== right.length) return false;

  return left.every((scope, index) => {
    const other = right[index];
    return scope.from === other.from && scope.to === other.to && scope.name === other.name;
  });
}

function isInActiveScope(node: { from: number; to: number }, scopes: HybridScope[]): boolean {
  return scopes.some((scope) => node.from >= scope.from && node.to <= scope.to);
}


function getBufferedVisibleRanges(view: EditorView, buffer = 160): { from: number; to: number }[] {
  const ranges = view.visibleRanges.map((range) => ({
    from: Math.max(0, range.from - buffer),
    to: Math.min(view.state.doc.length, range.to + buffer),
  }));

  if (ranges.length <= 1) return ranges;

  const merged = [ranges[0]];

  for (let index = 1; index < ranges.length; index += 1) {
    const range = ranges[index];
    const previous = merged[merged.length - 1];

    if (range.from <= previous.to) {
      previous.to = Math.max(previous.to, range.to);
      continue;
    }

    merged.push(range);
  }

  return merged;
}

function getHeadingDecoration(name: string): Decoration | null {
  const level = name.startsWith('ATXHeading')
    ? name.slice('ATXHeading'.length)
    : name.slice('SetextHeading'.length);

  if (!level) return null;

  return Decoration.mark({ class: `cm-hybrid-heading-${level}` });
}

function addLineDecorations(
  decorations: Array<ReturnType<typeof hiddenDecoration.range>>,
  view: EditorView,
  from: number,
  to: number,
  className: string,
): void {
  const startLine = view.state.doc.lineAt(from);
  const endLine = view.state.doc.lineAt(Math.max(from, to - 1));

  for (let lineNo = startLine.number; lineNo <= endLine.number; lineNo += 1) {
    const line = view.state.doc.line(lineNo);
    decorations.push(Decoration.line({ class: className }).range(line.from));
  }
}

function parseImage(nodeText: string): { alt: string; source: string } | null {
  const match = nodeText.match(/^!\[(?<alt>[^\]]*)\]\((?<source>\S+?)(?:\s+["'][^"']*["'])?\)$/);

  if (!match?.groups?.source) return null;

  return {
    alt: match.groups.alt ?? '',
    source: match.groups.source,
  };
}

function buildDecorations(view: EditorView, activeScopes: HybridScope[]): DecorationSet {
  const decorations: Array<ReturnType<typeof hiddenDecoration.range>> = [];

  for (const range of getBufferedVisibleRanges(view)) {
    syntaxTree(view.state).iterate({
      from: range.from,
      to: range.to,
      enter(node) {
        if (isInActiveScope(node, activeScopes)) return;

        if (node.name === 'Image') {
          const parsed = parseImage(view.state.doc.sliceString(node.from, node.to));

          if (parsed) {
            decorations.push(
              Decoration.replace({
                widget: new ImageWidget(parsed.source, parsed.alt),
              }).range(node.from, node.to),
            );
          }

          return false;
        }

        if (node.name.startsWith('ATXHeading') || node.name.startsWith('SetextHeading')) {
          const decoration = getHeadingDecoration(node.name);
          if (decoration) decorations.push(decoration.range(node.from, node.to));
          return;
        }

        if (node.name === 'Emphasis') {
          decorations.push(emphasisDecoration.range(node.from, node.to));
          return;
        }

        if (node.name === 'StrongEmphasis') {
          decorations.push(strongDecoration.range(node.from, node.to));
          return;
        }

        if (node.name === 'Link') {
          decorations.push(linkDecoration.range(node.from, node.to));
          return;
        }

        if (node.name === 'InlineCode') {
          decorations.push(inlineCodeDecoration.range(node.from, node.to));
          return;
        }

        if (node.name === 'HeaderMark' || node.name === 'QuoteMark') {
          let hideTo = node.to;
          const textAfter = view.state.doc.sliceString(
            node.to,
            Math.min(node.to + 10, view.state.doc.length),
          );
          const spaceMatch = textAfter.match(/^[ \t]+/);

          // If it's a HeaderMark, only swallow spaces if it starts with '#' (ATX Heading)
          const isATXHeader =
            node.name === 'HeaderMark' &&
            view.state.doc.sliceString(node.from, node.from + 1) === '#';
          const isQuote = node.name === 'QuoteMark';

          if ((isATXHeader || isQuote) && spaceMatch) {
            hideTo += spaceMatch[0].length;
          }

          decorations.push(hiddenDecoration.range(node.from, hideTo));
          return;
        }

        if (node.name === 'LinkMark' || node.name === 'URL' || node.name === 'EmphasisMark') {
          decorations.push(hiddenDecoration.range(node.from, node.to));
          return;
        }

        if (node.name === 'CodeMark' && node.node.parent?.name === 'InlineCode') {
          decorations.push(hiddenDecoration.range(node.from, node.to));
          return;
        }

        if (node.name === 'Blockquote') {
          addLineDecorations(decorations, view, node.from, node.to, 'cm-hybrid-blockquote-line');
          return;
        }

        if (node.name === 'FencedCode') {
          addLineDecorations(
            decorations,
            view,
            node.from,
            node.to,
            'cm-una-code-font cm-hybrid-fenced-code-line',
          );
        }
      },
    });
  }

  return Decoration.set(decorations, true);
}

// Goal column tracker for vertical navigation in non-vim mode
let goalColumn: number | null = null;

function moveByLogicalLine(view: EditorView, direction: 1 | -1): boolean {
  const selection = view.state.selection.main;
  if (!selection.empty) return false;

  const currentLine = view.state.doc.lineAt(selection.head);
  const targetLineNumber = currentLine.number + direction;

  if (targetLineNumber < 1 || targetLineNumber > view.state.doc.lines) {
    goalColumn = null;
    return false;
  }

  const targetLine = view.state.doc.line(targetLineNumber);
  const currentCol = selection.head - currentLine.from;

  if (goalColumn === null) {
    goalColumn = currentCol;
  }

  const targetPos = Math.min(targetLine.to, targetLine.from + goalColumn);

  view.dispatch({
    selection: { anchor: targetPos },
    userEvent: 'select.livepreview-vertical',
  });

  return true;
}

// Reset goal column on any non-vertical cursor movement
const goalColumnResetPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      if (
        update.selectionSet &&
        !update.transactions.some((tr) => tr.isUserEvent('select.livepreview-vertical'))
      ) {
        goalColumn = null;
      }
    }
  },
);

export function createLivePreviewExtensions(): Extension {
  return [
    HYBRID_THEME,
    goalColumnResetPlugin,
    Prec.highest(
      keymap.of([
        { key: 'ArrowDown', run: (view) => moveByLogicalLine(view, 1) },
        { key: 'ArrowUp', run: (view) => moveByLogicalLine(view, -1) },
      ]),
    ),
    ViewPlugin.fromClass(HybridMarkdownPlugin, {
      decorations: (value) => value.decorations,
    }),
  ];
}

// Code decoration plugin for non-livePreview mode
const codeFontDecoration = Decoration.mark({ class: 'cm-una-code-font' });

class CodeDecorationPlugin {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const decorations: Range<Decoration>[] = [];
    const tree = syntaxTree(view.state);

    for (const { from, to } of view.visibleRanges) {
      tree.iterate({
        from,
        to,
        enter: (node) => {
          // Add code font decoration to inline code
          if (node.name === 'InlineCode') {
            decorations.push(codeFontDecoration.range(node.from, node.to));
          }

          // Add code font decoration to fenced code block lines
          if (node.name === 'FencedCode') {
            addLineDecorations(decorations, view, node.from, node.to, 'cm-una-code-font');
          }
        },
      });
    }

    return Decoration.set(decorations, true);
  }
}

export function createCodeDecorationExtension(): Extension {
  return [
    HYBRID_THEME, // Include theme for cm-una-code-font class
    ViewPlugin.fromClass(CodeDecorationPlugin, {
      decorations: (value) => value.decorations,
    }),
  ];
}
