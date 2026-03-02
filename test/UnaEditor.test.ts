import { describe, it, expect, vi } from 'vitest'
import { EditorView, keymap } from '@codemirror/view'
import { getCM, Vim } from '@replit/codemirror-vim'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import UnaEditor from '../src/components/UnaEditor.vue'
import { moveHybridCursorVertically } from '../src/extensions/hybridMarkdown'

if (typeof Range !== 'undefined') {
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  }

  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0)
  }
}

async function getEditorView(wrapper: ReturnType<typeof mount>) {
  await nextTick()

  const editorRoot = wrapper.find('.cm-editor')
  expect(editorRoot.exists()).toBe(true)

  const view = EditorView.findFromDOM(editorRoot.element as HTMLElement)
  expect(view).not.toBeNull()

  return view!
}

async function focusEditorView(view: EditorView) {
  view.focus()
  await nextTick()
}

describe('UnaEditor', () => {
  it('renders properly', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'test content',
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('forwards user classes to the editor container', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
      },
      attrs: {
        class: 'custom-editor shell',
      },
    })

    expect(wrapper.classes()).toContain('una-editor')
    expect(wrapper.classes()).toContain('custom-editor')
    expect(wrapper.classes()).toContain('shell')
  })

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
    })

    expect(wrapper.attributes('id')).toBe('editor-shell')
    expect(wrapper.attributes('data-testid')).toBe('editor-root')
    expect(wrapper.attributes('style')).toContain('border: 1px solid red;')
  })

  it('accepts v-model binding', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'initial content',
        'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
      },
    })
    expect(wrapper.props('modelValue')).toBe('initial content')
  })

  it('respects hybridMarkdown prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        hybridMarkdown: true,
      },
    })

    expect(wrapper.props('hybridMarkdown')).toBe(true)
  })

  it('respects vimMode prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        vimMode: true,
      },
    })

    expect(wrapper.props('vimMode')).toBe(true)
  })

  it('respects lineNumbers prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        lineNumbers: false,
      },
    })
    expect(wrapper.props('lineNumbers')).toBe(false)
  })

  it('respects locale prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        locale: 'en-US',
      },
    })
    expect(wrapper.props('locale')).toBe('en-US')
  })

  it('respects theme prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        theme: 'dark',
      },
    })
    expect(wrapper.props('theme')).toBe('dark')
  })

  it('keeps markdown source mode when hybrid rendering is disabled', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '# Heading',
      },
    })

    await getEditorView(wrapper)

    expect(wrapper.find('.cm-hybrid-hidden').exists()).toBe(false)
  })

  it('keeps standard mode behavior when vim mode is disabled', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'abc',
      },
    })

    const view = await getEditorView(wrapper)

    expect(getCM(view)).toBeNull()
  })

  it('enables vim mode and starts in normal mode by default', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'abc',
        vimMode: true,
      },
    })

    const view = await getEditorView(wrapper)
    const cm = getCM(view)
    expect(cm).not.toBeNull()
    expect(cm!.state.vim?.insertMode).toBe(false)

    Vim.handleKey(cm!, 'i', 'test')

    expect(cm!.state.vim?.insertMode).toBe(true)
  })

  it('keeps Mod-s save shortcut while vim mode is active', async () => {
    const onSave = vi.fn()
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'abc',
        vimMode: true,
        onSave,
      },
    })

    const view = await getEditorView(wrapper)
    const cm = getCM(view)
    expect(cm).not.toBeNull()

    const saveBinding = view.state
      .facet(keymap)
      .flat()
      .find((binding) => binding.key === 'Mod-s' && typeof binding.run === 'function')

    expect(saveBinding).toBeDefined()

    expect(saveBinding!.run!(view)).toBe(true)
    expect(onSave).toHaveBeenCalledTimes(1)

    Vim.handleKey(cm!, 'i', 'test')

    expect(saveBinding!.run!(view)).toBe(true)
    expect(onSave).toHaveBeenCalledTimes(2)
  })

  it('applies hybrid decorations when enabled', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n# Heading',
        hybridMarkdown: true,
      },
    })

    const view = await getEditorView(wrapper)
    await focusEditorView(view)

    expect(wrapper.find('.cm-hybrid-hidden').exists()).toBe(true)
  })

  it('reveals inline markdown source when the cursor enters the active structure', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n**bold**',
        hybridMarkdown: true,
      },
    })

    const view = await getEditorView(wrapper)
    await focusEditorView(view)
    expect(wrapper.findAll('.cm-hybrid-hidden').length).toBeGreaterThan(0)

    view.dispatch({
      selection: {
        anchor: 4,
      },
    })

    await nextTick()

    expect(wrapper.find('.cm-hybrid-hidden').exists()).toBe(false)
  })

  it('treats the start of a heading as an active cursor position', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n# test',
        hybridMarkdown: true,
      },
    })

    const view = await getEditorView(wrapper)
    await focusEditorView(view)
    expect(wrapper.findAll('.cm-hybrid-hidden').length).toBeGreaterThan(0)

    view.dispatch({
      selection: {
        anchor: 1,
      },
    })

    await nextTick()

    expect(wrapper.find('.cm-hybrid-hidden').exists()).toBe(false)
  })

  it('keeps the source column when moving vertically into a hybrid heading line', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n## test header\n',
        hybridMarkdown: true,
      },
    })

    const view = await getEditorView(wrapper)
    await focusEditorView(view)

    view.dispatch({
      selection: {
        anchor: 0,
      },
    })

    await nextTick()

    expect(moveHybridCursorVertically(view, 1)).toBe(true)
    await nextTick()

    expect(view.state.selection.main.from).toBe(1)
    expect(wrapper.find('.cm-hybrid-hidden').exists()).toBe(false)

    view.dispatch({
      selection: {
        anchor: 4,
      },
    })

    await nextTick()

    expect(moveHybridCursorVertically(view, -1)).toBe(true)
    await nextTick()

    expect(view.state.selection.main.from).toBe(0)
  })

  it('switches markdown image syntax between rendered and source states', async () => {
    const markdown = '![Alt](https://example.com/demo.png)'
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: `\n${markdown}`,
        hybridMarkdown: true,
      },
    })

    const view = await getEditorView(wrapper)
    await focusEditorView(view)
    expect(wrapper.find('.cm-hybrid-image').exists()).toBe(true)

    view.dispatch({
      selection: {
        anchor: 3,
      },
    })

    await nextTick()

    expect(wrapper.find('.cm-hybrid-image').exists()).toBe(false)
    expect(wrapper.find('.cm-content').element.textContent).toContain(markdown)
  })

  it('keeps the first heading rendered while the editor is blurred on initial mount', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '# heading',
        hybridMarkdown: true,
      },
    })

    await getEditorView(wrapper)

    expect(wrapper.find('.cm-hybrid-hidden').exists()).toBe(true)
  })

  it('keeps markdown tables in source mode while hybrid rendering is enabled', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |'
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        hybridMarkdown: true,
      },
    })

    await getEditorView(wrapper)

    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.find('.cm-content').element.textContent).toContain('| head | value |')
  })

  it('exposes focus and getSelection methods', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
      },
    })
    expect(wrapper.vm.focus).toBeDefined()
    expect(wrapper.vm.getSelection).toBeDefined()
    expect(wrapper.vm.toggleFullscreen).toBeDefined()
    expect(wrapper.vm.exitFullscreen).toBeDefined()
  })
})
