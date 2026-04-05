import { Vim, vim } from '@replit/codemirror-vim';
import type { EditorView } from '@codemirror/view';
import { setupVimLogicalNavigation } from './hybridMarkdown';
import { setupStructuredTableVim } from './structuredTable';

let isGlobalVimSetupReady = false;
let saveHandlers = new WeakMap<EditorView, () => void>();

interface VimCommandContext {
  cm6?: EditorView;
}

export function ensureVimGlobalSetup(): void {
  if (isGlobalVimSetupReady) return;
  isGlobalVimSetupReady = true;

  try {
    setupVimLogicalNavigation();
    setupStructuredTableVim();
    Vim.defineEx('write', 'w', (cm?: VimCommandContext) => {
      const view = cm?.cm6;
      if (!view) return;
      saveHandlers.get(view)?.();
    });
  } catch {
    // Silently ignore if Vim is not fully available or compatible.
  }
}

export function registerVimSaveHandler(view: EditorView, handler: () => void): void {
  saveHandlers.set(view, handler);
}

export function unregisterVimSaveHandler(view: EditorView): void {
  saveHandlers.delete(view);
}

export function __resetVimGlobalSetupForTest(): void {
  isGlobalVimSetupReady = false;
  saveHandlers = new WeakMap<EditorView, () => void>();
}

export { vim };
