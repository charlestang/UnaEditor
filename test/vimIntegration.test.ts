import { describe, it, expect, vi, afterEach } from 'vitest';
import type { EditorView } from '@codemirror/view';
import { Vim } from '@replit/codemirror-vim';
import {
  __resetVimGlobalSetupForTest,
  ensureVimGlobalSetup,
  registerVimSaveHandler,
  unregisterVimSaveHandler,
} from '../src/extensions/vim';

describe('vim global integration', () => {
  afterEach(() => {
    __resetVimGlobalSetupForTest();
    vi.restoreAllMocks();
  });

  it('initializes global vim hooks once and routes :w to the active editor instance', () => {
    const defineExSpy = vi.spyOn(Vim, 'defineEx');

    ensureVimGlobalSetup();
    ensureVimGlobalSetup();

    expect(defineExSpy).toHaveBeenCalledTimes(1);
    expect(defineExSpy).toHaveBeenCalledWith('write', 'w', expect.any(Function));

    const exHandler = defineExSpy.mock.calls[0]?.[2] as (cm?: { cm6?: EditorView }) => void;
    const viewA = {} as EditorView;
    const viewB = {} as EditorView;
    const saveA = vi.fn();
    const saveB = vi.fn();

    registerVimSaveHandler(viewA, saveA);
    registerVimSaveHandler(viewB, saveB);

    exHandler({ cm6: viewA });
    expect(saveA).toHaveBeenCalledTimes(1);
    expect(saveB).not.toHaveBeenCalled();

    exHandler({ cm6: viewB });
    expect(saveA).toHaveBeenCalledTimes(1);
    expect(saveB).toHaveBeenCalledTimes(1);

    unregisterVimSaveHandler(viewA);
    exHandler({ cm6: viewA });
    expect(saveA).toHaveBeenCalledTimes(1);
  });
});
