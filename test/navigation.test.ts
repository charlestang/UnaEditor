import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { vim, getCM, Vim } from '@replit/codemirror-vim';
import {
  createLivePreviewExtensions,
  setupVimLogicalNavigation,
} from '../src/extensions/hybridMarkdown';

if (typeof Range !== 'undefined') {
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  }
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0);
  }
}

// Multi-line fixture with headings for navigation tests
// Line 1: "first line"      (offset 0..10)
// Line 2: "## heading"      (offset 11..21)  — "## " hidden by livePreview
// Line 3: "third line"      (offset 22..32)
const FIXTURE = 'first line\n## heading\nthird line';

function createVimLivePreviewEditor(doc: string) {
  setupVimLogicalNavigation();

  const state = EditorState.create({
    doc,
    extensions: [
      keymap.of(defaultKeymap),
      markdown(),
      vim({ status: false }),
      createLivePreviewExtensions(),
    ],
  });

  const parent = document.createElement('div');
  document.body.appendChild(parent);

  const view = new EditorView({ state, parent });
  return { view, parent };
}

function setCursor(view: EditorView, pos: number) {
  view.dispatch({ selection: { anchor: pos } });
}

function cursorPos(view: EditorView) {
  const pos = view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);
  return { line: line.number, col: pos - line.from, offset: pos };
}

describe('Navigation: vim + livePreview logical line movement', () => {
  it('j moves cursor to the next logical line at the corresponding column', () => {
    const { view, parent } = createVimLivePreviewEditor(FIXTURE);

    // Place cursor at line 1, col 0 ("f" in "first line")
    setCursor(view, 0);
    const cm = getCM(view)!;

    Vim.handleKey(cm, 'j', 'test');

    const pos = cursorPos(view);
    // Should be on line 2, col 0 (the "#" in "## heading")
    expect(pos.line).toBe(2);
    expect(pos.col).toBe(0);

    parent.remove();
  });

  it('k moves cursor to the previous logical line at the corresponding column', () => {
    const { view, parent } = createVimLivePreviewEditor(FIXTURE);

    // Place cursor at line 3, col 0 ("t" in "third line")
    setCursor(view, 22);
    const cm = getCM(view)!;

    Vim.handleKey(cm, 'k', 'test');

    const pos = cursorPos(view);
    // Should be on line 2, col 0
    expect(pos.line).toBe(2);
    expect(pos.col).toBe(0);

    parent.remove();
  });

  it('ArrowDown moves cursor to the next logical line', () => {
    const { view, parent } = createVimLivePreviewEditor(FIXTURE);

    setCursor(view, 0);
    const cm = getCM(view)!;

    Vim.handleKey(cm, '<Down>', 'test');

    const pos = cursorPos(view);
    expect(pos.line).toBe(2);
    expect(pos.col).toBe(0);

    parent.remove();
  });

  it('ArrowUp moves cursor to the previous logical line', () => {
    const { view, parent } = createVimLivePreviewEditor(FIXTURE);

    setCursor(view, 22);
    const cm = getCM(view)!;

    Vim.handleKey(cm, '<Up>', 'test');

    const pos = cursorPos(view);
    expect(pos.line).toBe(2);
    expect(pos.col).toBe(0);

    parent.remove();
  });
});
