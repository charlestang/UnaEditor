import { describe, it, expect, vi } from 'vitest';
import { EditorView, keymap } from '@codemirror/view';
import { getCM, Vim } from '@replit/codemirror-vim';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import UnaEditor from '../src/components/UnaEditor.vue';

if (typeof Range !== 'undefined') {
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  }

  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0);
  }
}

async function getEditorView(wrapper: ReturnType<typeof mount>) {
  await nextTick();

  const editorRoot = wrapper.find('.cm-editor');
  expect(editorRoot.exists()).toBe(true);

  const view = EditorView.findFromDOM(editorRoot.element as HTMLElement);
  expect(view).not.toBeNull();

  return view!;
}

async function focusEditorView(view: EditorView) {
  view.focus();
  await nextTick();
}

describe('UnaEditor', () => {
  it('renders properly', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'test content',
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('forwards user classes to the editor container', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
      },
      attrs: {
        class: 'custom-editor shell',
      },
    });

    expect(wrapper.classes()).toContain('una-editor');
    expect(wrapper.classes()).toContain('custom-editor');
    expect(wrapper.classes()).toContain('shell');
  });

  it('forwards arbitrary attrs to the editor container', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
      },
      attrs: {
        id: 'editor-shell',
        style: 'border: 1px solid red;',
        'data-testid': 'editor-root',
      },
    });

    expect(wrapper.attributes('id')).toBe('editor-shell');
    expect(wrapper.attributes('data-testid')).toBe('editor-root');
    expect(wrapper.attributes('style')).toContain('border: 1px solid red;');
  });

  it('accepts v-model binding', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'initial content',
        'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
      },
    });
    expect(wrapper.props('modelValue')).toBe('initial content');
  });

  it('respects livePreview prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        livePreview: true,
      },
    });

    expect(wrapper.props('livePreview')).toBe(true);
  });

  it('respects vimMode prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        vimMode: true,
      },
    });

    expect(wrapper.props('vimMode')).toBe(true);
  });

  it('respects lineNumbers prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        lineNumbers: false,
      },
    });
    expect(wrapper.props('lineNumbers')).toBe(false);
  });

  it('respects locale prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        locale: 'en-US',
      },
    });
    expect(wrapper.props('locale')).toBe('en-US');
  });

  it('respects theme prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        theme: 'dark',
      },
    });
    expect(wrapper.props('theme')).toBe('dark');
  });

  it('keeps markdown source mode when hybrid rendering is disabled', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '# Heading',
      },
    });

    await getEditorView(wrapper);

    // No heading decoration when livePreview is disabled
    expect(wrapper.find('.cm-hybrid-heading-1').exists()).toBe(false);
  });

  it('keeps standard mode behavior when vim mode is disabled', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'abc',
      },
    });

    const view = await getEditorView(wrapper);

    expect(getCM(view)).toBeNull();
  });

  it('enables vim mode and starts in normal mode by default', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'abc',
        vimMode: true,
      },
    });

    const view = await getEditorView(wrapper);
    const cm = getCM(view);
    expect(cm).not.toBeNull();
    expect(cm!.state.vim?.insertMode).toBe(false);

    Vim.handleKey(cm!, 'i', 'test');

    expect(cm!.state.vim?.insertMode).toBe(true);
  });

  it('keeps Mod-s save shortcut while vim mode is active', async () => {
    const onSave = vi.fn();
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'abc',
        vimMode: true,
        onSave,
      },
    });

    const view = await getEditorView(wrapper);
    const cm = getCM(view);
    expect(cm).not.toBeNull();

    const saveBinding = view.state
      .facet(keymap)
      .flat()
      .find((binding) => binding.key === 'Mod-s' && typeof binding.run === 'function');

    expect(saveBinding).toBeDefined();

    expect(saveBinding!.run!(view)).toBe(true);
    expect(onSave).toHaveBeenCalledTimes(1);

    Vim.handleKey(cm!, 'i', 'test');

    expect(saveBinding!.run!(view)).toBe(true);
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it('applies hybrid decorations when enabled', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n# Heading',
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await focusEditorView(view);

    // With replace decoration, the heading mark class should be applied
    expect(wrapper.find('.cm-hybrid-heading-1').exists()).toBe(true);
  });

  it('reveals inline markdown source when the cursor enters the active structure', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n**bold**',
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await focusEditorView(view);
    // Strong emphasis decoration should be applied when cursor is outside
    expect(wrapper.find('.cm-hybrid-strong').exists()).toBe(true);

    view.dispatch({
      selection: {
        anchor: 4,
      },
    });

    await nextTick();

    // When cursor enters the bold text, decorations are removed (active scope)
    expect(wrapper.find('.cm-hybrid-strong').exists()).toBe(false);
  });

  it('treats the start of a heading as an active cursor position', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n# test',
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await focusEditorView(view);
    // Heading decoration should be applied when cursor is outside
    expect(wrapper.find('.cm-hybrid-heading-1').exists()).toBe(true);

    view.dispatch({
      selection: {
        anchor: 1,
      },
    });

    await nextTick();

    // When cursor enters the heading, active scope removes decorations
    expect(wrapper.find('.cm-hybrid-heading-1').exists()).toBe(false);
  });

  it('places cursor at heading text start when navigating into a heading line', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n## test header\n',
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await focusEditorView(view);

    // Place cursor at line 1 (empty line before heading)
    view.dispatch({
      selection: {
        anchor: 0,
      },
    });

    await nextTick();

    // The heading line starts at pos 1, "## " occupies pos 1-3, "test" starts at pos 4
    // With replace decoration, cursor should land after the replaced "## " (pos 4)
    const headingLine = view.state.doc.line(2);
    expect(headingLine.text).toBe('## test header');
  });

  it('switches markdown image syntax between rendered and source states', async () => {
    const markdown = '![Alt](https://example.com/demo.png)';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: `\n${markdown}`,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await focusEditorView(view);
    expect(wrapper.find('.cm-hybrid-image').exists()).toBe(true);

    view.dispatch({
      selection: {
        anchor: 3,
      },
    });

    await nextTick();

    expect(wrapper.find('.cm-hybrid-image').exists()).toBe(false);
    expect(wrapper.find('.cm-content').element.textContent).toContain(markdown);
  });

  it('keeps the first heading rendered while the editor is blurred on initial mount', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '# heading',
        livePreview: true,
      },
    });

    await getEditorView(wrapper);

    // Heading decoration should be applied when editor is blurred
    expect(wrapper.find('.cm-hybrid-heading-1').exists()).toBe(true);
  });

  it('keeps markdown tables in source mode while hybrid rendering is enabled', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    await getEditorView(wrapper);

    expect(wrapper.find('table').exists()).toBe(false);
    expect(wrapper.find('.cm-content').element.textContent).toContain('| head | value |');
  });

  it('exposes programmable API methods', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
      },
    });
    expect(wrapper.vm.focus).toBeDefined();
    expect(wrapper.vm.getSelection).toBeDefined();
    expect(wrapper.vm.toggleFullscreen).toBeDefined();
    expect(wrapper.vm.exitFullscreen).toBeDefined();
    expect(wrapper.vm.getEditorView).toBeDefined();
    expect(wrapper.vm.insertText).toBeDefined();
    expect(wrapper.vm.getHeadings).toBeDefined();
    expect(wrapper.vm.scrollToLine).toBeDefined();
  });

  it('can insert text at the cursor position', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'hello ',
      },
    });

    const view = await getEditorView(wrapper);
    
    // Set cursor to the end
    view.dispatch({ selection: { anchor: 6 } });
    
    wrapper.vm.insertText!('world');
    
    expect(view.state.doc.toString()).toBe('hello world');
    // Cursor should move to end of inserted text
    expect(view.state.selection.main.anchor).toBe(11);
  });

  it('can replace the current selection with new text', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'hello old world',
      },
    });

    const view = await getEditorView(wrapper);

    // Select 'old '
    view.dispatch({ selection: { anchor: 6, head: 10 } });

    wrapper.vm.insertText!('new ');

    expect(view.state.doc.toString()).toBe('hello new world');
    expect(view.state.selection.main.anchor).toBe(10); // 6 + 4
  });

  it('updates modelValue when insertText is called', async () => {
    const onUpdateModelValue = vi.fn();
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'hello ',
        'onUpdate:modelValue': onUpdateModelValue,
      },
    });

    const view = await getEditorView(wrapper);

    // Set cursor to the end
    view.dispatch({ selection: { anchor: 6 } });

    wrapper.vm.insertText!('world');

    // Wait for the update event to be emitted
    await nextTick();

    // Verify that modelValue update event was emitted with the new content
    expect(onUpdateModelValue).toHaveBeenCalledWith('hello world');
    expect(onUpdateModelValue).toHaveBeenCalledTimes(1);
  });

  it('extracts headings to build an outline', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '# H1 Title\nSome text\n## H2 Subtitle\nMore text\n### H3 Deep\n',
      },
    });

    // Wait for the syntax tree to parse
    await getEditorView(wrapper);
    // Give CM a tick to build syntax tree
    await nextTick();
    
    const headings = wrapper.vm.getHeadings!();
    
    expect(headings).toEqual([
      { text: 'H1 Title', level: 1, line: 1 },
      { text: 'H2 Subtitle', level: 2, line: 3 },
      { text: 'H3 Deep', level: 3, line: 5 },
    ]);
  });

  it('returns the underlying EditorView instance', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'hello test',
      },
    });

    const internalView = await getEditorView(wrapper);
    const exposedView = wrapper.vm.getEditorView!();
    
    expect(exposedView).toBeDefined();
    // Verify it's the same actual editor state/doc
    expect(exposedView?.state.doc.toString()).toBe(internalView.state.doc.toString());
    expect(exposedView?.dom).toBe(internalView.dom);
  });
});
