import { Decoration, EditorView, ViewPlugin, WidgetType, keymap } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Prec, StateEffect, type Extension, type Range } from '@codemirror/state';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { Vim } from '@replit/codemirror-vim';
import { createStructuredTableExtensions, enterStructuredTableFromAdjacentText } from './structuredTable';
import type {
  ImageRenderContext,
  ImageRenderResult,
  LinkRenderContext,
  LinkRenderResult,
  RenderHookDataset,
  RenderHookStyle,
  RenderHooks,
} from '../types/editor';

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
      const headIndex = cm.indexFromPos(head);

      if (
        count === 1 &&
        enterStructuredTableFromAdjacentText(view, direction, false, headIndex)
      ) {
        return cm.posFromIndex(view.state.selection.main.head);
      }

      const currentLine = view.state.doc.lineAt(headIndex);
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

interface ListItemRenderData {
  from: number;
  to: number;
  kind: 'bullet' | 'ordered' | 'task';
  label: string;
  isChecked?: boolean;
}

interface ParsedImageData {
  alt: string;
  source: string;
  title?: string;
}

interface ChildSyntaxNode {
  name: string;
  from: number;
  to: number;
  nextSibling: ChildSyntaxNode | null;
}

interface LinkSyntaxNodeRef {
  from: number;
  to: number;
  node: {
    firstChild: ChildSyntaxNode | null;
  };
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
  // Note: FencedCode removed - handled by independent code block decorator plugin
]);

const HYBRID_THEME = EditorView.theme({
  '.cm-una-code-font': {
    fontFamily: 'var(--una-code-font-family, ui-monospace, SFMono-Regular, Menlo, monospace)',
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
  '.cm-hybrid-list-marker': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '0.22em',
    color: 'rgba(100, 116, 139, 0.9)',
    userSelect: 'none',
    verticalAlign: 'baseline',
  },
  '.cm-hybrid-list-marker-ordered': {
    justifyContent: 'flex-end',
    minWidth: '2ch',
  },
  '.cm-hybrid-list-marker-task': {
    minWidth: '1.4em',
  },
  '.cm-hybrid-task-checkbox': {
    width: '0.95em',
    height: '0.95em',
    margin: '0',
    accentColor: '#14b8a6',
    pointerEvents: 'none',
    flex: '0 0 auto',
    position: 'relative',
    top: '0.08em',
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
const LINK_RESERVED_DATA_KEYS = new Set(['href']);
const LINK_TEXT_MARK_NAMES = new Set(['LinkMark', 'EmphasisMark', 'CodeMark']);

class ImageWidget extends WidgetType {
  constructor(
    private readonly source: string,
    private readonly alt: string,
    private readonly className?: string,
    private readonly dataset?: RenderHookDataset,
    private readonly style?: RenderHookStyle,
  ) {
    super();
  }

  eq(other: ImageWidget): boolean {
    return (
      this.source === other.source &&
      this.alt === other.alt &&
      this.className === other.className &&
      sameStringRecord(this.dataset, other.dataset) &&
      sameStringRecord(this.style, other.style)
    );
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
    appendClassName(image, this.className);
    applyDatasetAttributes(image, this.dataset);
    applyInlineStyle(image, this.style);

    wrapper.appendChild(image);
    return wrapper;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

class ListMarkerWidget extends WidgetType {
  constructor(private readonly data: ListItemRenderData) {
    super();
  }

  eq(other: ListMarkerWidget): boolean {
    return (
      this.data.kind === other.data.kind &&
      this.data.label === other.data.label &&
      this.data.isChecked === other.data.isChecked
    );
  }

  toDOM(): HTMLElement {
    const marker = document.createElement('span');
    marker.className = `cm-hybrid-list-marker cm-hybrid-list-marker-${this.data.kind}`;
    marker.contentEditable = 'false';
    marker.setAttribute('aria-hidden', 'true');

    if (this.data.kind === 'task') {
      const checkbox = document.createElement('input');
      checkbox.className = 'cm-hybrid-task-checkbox';
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(this.data.isChecked);
      checkbox.tabIndex = -1;
      checkbox.setAttribute('aria-hidden', 'true');

      marker.appendChild(checkbox);
      return marker;
    }

    marker.textContent = this.data.label;

    if (this.data.kind === 'ordered') {
      marker.style.minWidth = `${Math.max(2, this.data.label.length)}ch`;
    }

    return marker;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

function addNearestListItemScope(
  node: ActiveSyntaxNode | null,
  selection: { from: number; to: number },
  scopes: HybridScope[],
  seen: Set<string>,
): void {
  let current = node;

  while (current) {
    if (current.name === 'ListItem' && current.from <= selection.from && current.to >= selection.to) {
      const key = `${current.name}:${current.from}:${current.to}`;

      if (!seen.has(key)) {
        seen.add(key);
        scopes.push({
          from: current.from,
          to: current.to,
          name: current.name,
        });
      }

      return;
    }

    current = current.parent;
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

  addNearestListItemScope(anchorLeft, selection, scopes, seen);
  addNearestListItemScope(anchorRight, selection, scopes, seen);
  addScopeFromNode(anchorLeft, selection, scopes, seen);
  addScopeFromNode(anchorRight, selection, scopes, seen);

  if (selection.to !== selection.from) {
    const headLeft = syntaxTree(view.state).resolveInner(selection.to, -1) as ActiveSyntaxNode;
    const headRight = syntaxTree(view.state).resolveInner(selection.to, 1) as ActiveSyntaxNode;

    addNearestListItemScope(headLeft, selection, scopes, seen);
    addNearestListItemScope(headRight, selection, scopes, seen);
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

function parseImage(nodeText: string): ParsedImageData | null {
  const match = nodeText.match(
    /^!\[(?<alt>[^\]]*)\]\((?<source>\S+?)(?:\s+(?<title>["'][^"']*["']))?\)$/,
  );

  if (!match?.groups?.source) return null;

  return {
    alt: match.groups.alt ?? '',
    source: match.groups.source,
    title: stripEnclosingQuotes(match.groups.title),
  };
}

function getListItemRenderData(view: EditorView, node: { from: number; to: number }): ListItemRenderData | null {
  const line = view.state.doc.lineAt(node.from);
  const lineText = view.state.doc.sliceString(node.from, line.to);
  const markerMatch = lineText.match(/^(?<marker>(?:[-+*])|(?:\d+[.)]))(?<spacing>[ \t]+)/);

  if (!markerMatch?.groups?.marker || !markerMatch.groups.spacing) return null;

  const markerText = markerMatch.groups.marker;
  const markerEnd = node.from + markerMatch[0].length;
  const rest = lineText.slice(markerMatch[0].length);
  const taskMatch = rest.match(/^\[(?<state>[ xX])\](?<spacing>[ \t]+|$)/);

  if (taskMatch?.groups?.state) {
    return {
      from: node.from,
      to: markerEnd + taskMatch[0].length,
      kind: 'task',
      label: taskMatch.groups.state,
      isChecked: taskMatch.groups.state.toLowerCase() === 'x',
    };
  }

  if (/^[-+*]$/.test(markerText)) {
    return {
      from: node.from,
      to: markerEnd,
      kind: 'bullet',
      label: '•',
    };
  }

  return {
    from: node.from,
    to: markerEnd,
    kind: 'ordered',
    label: markerText,
  };
}

function buildDecorations(
  view: EditorView,
  activeScopes: HybridScope[],
  renderHooks?: RenderHooks,
): DecorationSet {
  const decorations: Range<Decoration>[] = [];

  for (const range of getBufferedVisibleRanges(view)) {
    syntaxTree(view.state).iterate({
      from: range.from,
      to: range.to,
      enter(node) {
        if (isInActiveScope(node, activeScopes)) return;

        if (node.name === 'ListItem') {
          const renderData = getListItemRenderData(view, node);

          if (renderData) {
            decorations.push(
              Decoration.replace({
                widget: new ListMarkerWidget(renderData),
              }).range(renderData.from, renderData.to),
            );
          }

          return;
        }

        if (node.name === 'Image') {
          const parsed = parseImage(view.state.doc.sliceString(node.from, node.to));

          if (parsed) {
            const context: ImageRenderContext = {
              src: parsed.source,
              alt: parsed.alt,
              title: parsed.title,
              raw: view.state.doc.sliceString(node.from, node.to),
              position: {
                from: node.from,
                to: node.to,
              },
            };
            const imageResult = safeCallImageHook(context, renderHooks?.image);
            decorations.push(
              Decoration.replace({
                widget: new ImageWidget(
                  imageResult.src,
                  parsed.alt,
                  imageResult.className,
                  imageResult.dataset,
                  imageResult.style,
                ),
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
          const linkContext = buildLinkRenderContext(view, node);
          if (!renderHooks?.link || !linkContext) {
            decorations.push(linkDecoration.range(node.from, node.to));
            return;
          }

          const linkResult = safeCallLinkHook(linkContext, renderHooks.link);
          decorations.push(buildLinkDecoration(linkResult).range(node.from, node.to));
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
            'cm-una-code-font',
          );
        }
      },
    });
  }

  return Decoration.set(decorations, true);
}

/**
 * Strip surrounding quote characters from a Markdown title literal.
 */
function stripEnclosingQuotes(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

/**
 * Normalize a dataset key to kebab-case without the `data-` prefix.
 */
function normalizeDataKey(key: string): string {
  const withoutPrefix = key.startsWith('data-') ? key.slice(5) : key;
  return withoutPrefix
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

/**
 * Apply a user class list on top of the default element class.
 */
function appendClassName(element: HTMLElement, className?: string): void {
  if (!className) return;

  for (const token of className.split(/\s+/)) {
    if (token) {
      element.classList.add(token);
    }
  }
}

/**
 * Apply dataset entries as `data-*` attributes.
 */
function applyDatasetAttributes(element: HTMLElement, dataset?: RenderHookDataset): void {
  if (!dataset) return;

  for (const [key, value] of Object.entries(dataset)) {
    element.setAttribute(`data-${normalizeDataKey(key)}`, value);
  }
}

/**
 * Apply inline styles to a DOM element using CSS property names.
 */
function applyInlineStyle(element: HTMLElement, style?: RenderHookStyle): void {
  if (!style) return;

  for (const [property, value] of Object.entries(style)) {
    element.style.setProperty(normalizeDataKey(property), value);
  }
}

/**
 * Compare two record-like objects by value.
 */
function sameStringRecord(
  left?: Record<string, string>,
  right?: Record<string, string>,
): boolean {
  if (left === right) return true;
  if (!left || !right) return !left && !right;

  const leftEntries = Object.entries(left).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
  const rightEntries = Object.entries(right).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  if (leftEntries.length !== rightEntries.length) return false;

  return leftEntries.every(
    ([key, value], index) => key === rightEntries[index][0] && value === rightEntries[index][1],
  );
}

/**
 * Serialize an inline style object to an attribute-safe CSS string.
 */
function serializeInlineStyle(style?: RenderHookStyle): string | undefined {
  if (!style) return undefined;

  const serialized = Object.entries(style)
    .map(([property, value]) => `${normalizeDataKey(property)}: ${value}`)
    .join('; ');

  return serialized || undefined;
}

/**
 * Collect the visible label text inside a link by excluding Markdown marker nodes.
 */
function extractLinkLabelText(view: EditorView, from: number, to: number): string {
  const hiddenRanges: Array<{ from: number; to: number }> = [];

  syntaxTree(view.state).iterate({
    from,
    to,
    enter(node) {
      if (node.from < from || node.to > to) return;
      if (LINK_TEXT_MARK_NAMES.has(node.name)) {
        hiddenRanges.push({ from: node.from, to: node.to });
      }
    },
  });

  hiddenRanges.sort((left, right) => left.from - right.from || left.to - right.to);

  let cursor = from;
  let text = '';

  for (const range of hiddenRanges) {
    if (range.from > cursor) {
      text += view.state.doc.sliceString(cursor, range.from);
    }
    cursor = Math.max(cursor, range.to);
  }

  if (cursor < to) {
    text += view.state.doc.sliceString(cursor, to);
  }

  return text;
}

/**
 * Build a link hook context from the Markdown syntax tree.
 */
function buildLinkRenderContext(
  view: EditorView,
  node: LinkSyntaxNodeRef,
): LinkRenderContext | null {
  let child: ChildSyntaxNode | null = node.node.firstChild;
  let href: string | null = null;
  let title: string | undefined;
  let labelStart: number | null = null;
  let labelEnd: number | null = null;

  while (child) {
    if (child.name === 'LinkMark') {
      const text = view.state.doc.sliceString(child.from, child.to);
      if (text === '[') {
        labelStart = child.to;
      } else if (text === ']') {
        labelEnd = child.from;
      }
    } else if (child.name === 'URL') {
      href = view.state.doc.sliceString(child.from, child.to);
    } else if (child.name === 'LinkTitle') {
      title = stripEnclosingQuotes(view.state.doc.sliceString(child.from, child.to));
    }
    child = child.nextSibling;
  }

  if (!href) return null;

  const text =
    labelStart != null && labelEnd != null && labelEnd >= labelStart
      ? extractLinkLabelText(view, labelStart, labelEnd)
      : '';

  return {
    href,
    text,
    title,
    raw: view.state.doc.sliceString(node.from, node.to),
    position: {
      from: node.from,
      to: node.to,
    },
  };
}

/**
 * Call the image hook safely and fall back to the original context on failure.
 */
function safeCallImageHook(
  context: ImageRenderContext,
  hook?: RenderHooks['image'],
): ImageRenderResult {
  const fallback: ImageRenderResult = {
    src: context.src,
  };

  if (!hook) return fallback;

  try {
    const result = hook(context);
    if (!result) return fallback;

    return {
      src: result.src ?? context.src,
      className: result.className,
      dataset: result.dataset,
      style: result.style,
    };
  } catch (error) {
    console.warn('Image render hook failed.', error);
    return fallback;
  }
}

/**
 * Call the link hook safely and fall back to the original context on failure.
 */
function safeCallLinkHook(
  context: LinkRenderContext,
  hook?: RenderHooks['link'],
): LinkRenderResult {
  const fallback: LinkRenderResult = {
    href: context.href,
  };

  if (!hook) return fallback;

  try {
    const result = hook(context);
    if (!result) return fallback;

    return {
      href: result.href ?? context.href,
      className: result.className,
      dataset: result.dataset,
      style: result.style,
    };
  } catch (error) {
    console.warn('Link render hook failed.', error);
    return fallback;
  }
}

/**
 * Build an enhanced link mark decoration that preserves the existing text model.
 */
function buildLinkDecoration(result: LinkRenderResult): Decoration {
  const attributes: Record<string, string> = {
    'data-href': result.href,
  };

  for (const [key, value] of Object.entries(result.dataset ?? {})) {
    const normalizedKey = normalizeDataKey(key);
    if (LINK_RESERVED_DATA_KEYS.has(normalizedKey)) {
      continue;
    }
    attributes[`data-${normalizedKey}`] = value;
  }

  const styleText = serializeInlineStyle(result.style);
  if (styleText) {
    attributes.style = styleText;
  }

  return Decoration.mark({
    tagName: 'span',
    class: ['cm-hybrid-link', result.className].filter(Boolean).join(' '),
    attributes,
  });
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
    scrollIntoView: true,
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

function createHybridMarkdownViewPlugin(renderHooks?: RenderHooks): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private activeScopes: HybridScope[];

      constructor(view: EditorView) {
        this.activeScopes = getActiveScopes(view);
        this.decorations = buildDecorations(view, this.activeScopes, renderHooks);
      }

      update(update: ViewUpdate): void {
        const nextScopes = getActiveScopes(update.view);
        const activeChanged = !sameScopes(this.activeScopes, nextScopes);
        const hasRemeasure = update.transactions.some((tr) =>
          tr.effects.some((e) => e.is(remeasureEffect)),
        );

        if (
          update.docChanged ||
          update.viewportChanged ||
          update.focusChanged ||
          activeChanged ||
          hasRemeasure
        ) {
          this.activeScopes = nextScopes;
          this.decorations = buildDecorations(update.view, nextScopes, renderHooks);
          return;
        }

        this.activeScopes = nextScopes;
      }
    },
    {
      decorations: (value) => value.decorations,
    },
  );
}

export function createLivePreviewExtensions(renderHooks?: RenderHooks): Extension {
  return [
    HYBRID_THEME,
    createStructuredTableExtensions(),
    goalColumnResetPlugin,
    Prec.highest(
      keymap.of([
        { key: 'ArrowDown', run: (view) => moveByLogicalLine(view, 1) },
        { key: 'ArrowUp', run: (view) => moveByLogicalLine(view, -1) },
      ]),
    ),
    createHybridMarkdownViewPlugin(renderHooks),
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
