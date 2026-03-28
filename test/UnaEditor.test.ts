import { describe, it, expect, vi } from 'vitest';
import { undo } from '@codemirror/commands';
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

async function dispatchEditorKey(view: EditorView, key: string) {
  view.focus();
  const target = view.contentDOM;
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  await nextTick();
}

function installHostSpanReset() {
  const style = document.createElement('style');
  style.textContent = `
    .cm-editor span {
      font-style: normal;
      font-weight: 400;
      text-decoration: none;
      font-family: system-ui;
      font-size: 16px;
      line-height: 1;
      color: rgb(12, 34, 56);
    }
  `;
  document.head.prepend(style);

  return () => {
    style.remove();
  };
}

function getCssRulesContaining(fragment: string): string[] {
  return Array.from(document.styleSheets)
    .flatMap((sheet) => Array.from(sheet.cssRules ?? []))
    .map((rule) => rule.cssText)
    .filter((text) => text.includes(fragment));
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

  it('applies horizontal content padding to keep text away from the editor edges', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'content',
      },
      attachTo: document.body,
    });

    try {
      await getEditorView(wrapper);
      await nextTick();

      const content = wrapper.find('.cm-content');
      expect(content.exists()).toBe(true);

      const styles = getComputedStyle(content.element as HTMLElement);
      expect(styles.paddingLeft).toBe('12px');
      expect(styles.paddingRight).toBe('12px');
    } finally {
      wrapper.unmount();
    }
  });

  it('uses compact tabular numerals for editor gutter line numbers', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'line 1\nline 2\nline 3',
        lineNumbers: true,
      },
      attachTo: document.body,
    });

    try {
      await getEditorView(wrapper);
      await nextTick();

      const gutterRules = getCssRulesContaining('.cm-lineNumbers .cm-gutterElement');
      expect(gutterRules.some((text) => text.includes('font-size: 0.92em'))).toBe(true);
      expect(gutterRules.some((text) => text.includes('align-items: flex-start'))).toBe(true);
      expect(gutterRules.some((text) => text.includes('line-height: inherit'))).toBe(true);
      expect(gutterRules.some((text) => text.includes('font-variant-numeric: tabular-nums'))).toBe(
        true,
      );
      expect(
        gutterRules.some((text) =>
          text.includes('ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'),
        ),
      ).toBe(true);
      expect(gutterRules.some((text) => text.includes('--una-code-font-family'))).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it('accepts custom theme objects', () => {
    const customTheme = {
      type: 'dark' as const,
      content: {
        link: {
          color: '#f59e0b',
        },
      },
    };

    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        theme: customTheme,
      },
    });

    expect(wrapper.props('theme')).toEqual(customTheme);
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

  it('reveals inline markdown source while keeping the strong styling in the active structure', async () => {
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

    // When cursor enters the bold text, source is shown but styling remains.
    expect(wrapper.find('.cm-hybrid-strong').exists()).toBe(true);
    expect(wrapper.find('.cm-content').element.textContent).toContain('**bold**');
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
        anchor: 2,
      },
    });

    await nextTick();

    // The heading line starts at pos 1, "## " occupies pos 1-3, "test" starts at pos 4
    // With replace decoration, cursor should land after the replaced "## " (pos 4)
    const headingLine = view.state.doc.line(2);
    expect(headingLine.text).toBe('## test header');
  });

  it('keeps markdown image preview visible while showing source in the active scope', async () => {
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

    expect(wrapper.find('.cm-hybrid-image').exists()).toBe(true);
    expect(wrapper.find('.cm-hybrid-image-inline-preview').exists()).toBe(true);
    expect(wrapper.find('.cm-content').element.textContent).toContain(markdown);
  });

  it('shows an inline placeholder when the image preview fails to load', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n![Alt](https://example.com/demo.png)',
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const image = wrapper.find('.cm-hybrid-image-element');
    expect(image.exists()).toBe(true);

    image.element.dispatchEvent(new Event('error'));
    await nextTick();

    expect(wrapper.find('.cm-hybrid-image-broken').exists()).toBe(true);
    expect(wrapper.find('.cm-hybrid-image-status').text()).toContain('图片地址错误或无法获取');
  });

  it('applies image render hooks for transformed src and metadata', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n![Alt](https://example.com/demo.png "Preview")',
        livePreview: true,
        renderHooks: {
          image: ({ src, title }) => ({
            src: `https://img-proxy.example.com/?url=${encodeURIComponent(src)}&title=${title ?? ''}`,
            className: 'proxy-image hero-shot',
            dataset: {
              proxyKind: 'cdn',
            },
            style: {
              borderColor: 'rgb(255, 0, 0)',
              borderWidth: '2px',
              borderStyle: 'solid',
            },
          }),
        },
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const image = wrapper.find('.cm-hybrid-image-element');
    expect(image.exists()).toBe(true);
    expect(image.attributes('src')).toContain(
      'https://img-proxy.example.com/?url=https%3A%2F%2Fexample.com%2Fdemo.png',
    );
    expect(image.classes()).toContain('proxy-image');
    expect(image.classes()).toContain('hero-shot');
    expect(image.attributes('data-proxy-kind')).toBe('cdn');
    expect(image.attributes('style')).toContain('border-color: rgb(255, 0, 0);');
    expect(image.attributes('style')).toContain('border-width: 2px;');
  });

  it('applies link render hooks while preserving nested inline formatting', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n[**bold** link](./docs/page.md "Docs")',
        livePreview: true,
        renderHooks: {
          link: ({ href, title }) => ({
            href: `/resolved${href}?title=${title ?? ''}`,
            className: 'is-internal',
            dataset: {
              kind: 'internal',
              href: 'user-should-not-win',
            },
            style: {
              textDecorationColor: 'rgb(34, 197, 94)',
            },
          }),
        },
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const enhancedSegments = wrapper.findAll('.cm-hybrid-link');
    expect(
      enhancedSegments.some(
        (segment) => segment.attributes('data-href') === '/resolved./docs/page.md?title=Docs',
      ),
    ).toBe(true);
    expect(enhancedSegments.some((segment) => segment.attributes('data-kind') === 'internal')).toBe(
      true,
    );
    expect(
      enhancedSegments.some((segment) => segment.attributes('data-href') === 'user-should-not-win'),
    ).toBe(false);
    expect(
      enhancedSegments.some((segment) =>
        segment.attributes('style').includes('text-decoration-color'),
      ),
    ).toBe(true);
    expect(enhancedSegments.some((segment) => segment.classes().includes('is-internal'))).toBe(
      true,
    );
    expect(wrapper.find('.cm-hybrid-strong').text()).toBe('bold');
    expect(wrapper.find('.cm-content').element.textContent).not.toContain('**');
  });

  it('keeps default rendering when hooks are absent or only partially provided', async () => {
    const markdown = '\n[Docs](./guide)\n![Alt](https://example.com/demo.png)';

    const defaultWrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    await getEditorView(defaultWrapper);
    await nextTick();

    const defaultLinkSegments = defaultWrapper.findAll('.cm-hybrid-link');
    expect(defaultLinkSegments.some((segment) => segment.attributes('data-href'))).toBe(false);
    expect(
      defaultWrapper.find('.cm-hybrid-image-element').attributes('data-proxy-kind'),
    ).toBeUndefined();

    const imageOnlyWrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        renderHooks: {
          image: ({ src }) => ({
            src: `${src}?image-only=true`,
            dataset: { proxyKind: 'image-only' },
          }),
        },
      },
    });

    await getEditorView(imageOnlyWrapper);
    await nextTick();

    expect(imageOnlyWrapper.find('.cm-hybrid-image-element').attributes('src')).toContain(
      '?image-only=true',
    );
    expect(imageOnlyWrapper.find('.cm-hybrid-image-element').attributes('data-proxy-kind')).toBe(
      'image-only',
    );
    expect(
      imageOnlyWrapper
        .findAll('.cm-hybrid-link')
        .some((segment) => segment.attributes('data-href')),
    ).toBe(false);

    const linkOnlyWrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        renderHooks: {
          link: ({ href }) => ({
            href: `/link-only${href}`,
            dataset: { source: 'link-only' },
          }),
        },
      },
    });

    await getEditorView(linkOnlyWrapper);
    await nextTick();

    expect(
      linkOnlyWrapper
        .findAll('.cm-hybrid-link')
        .some((segment) => segment.attributes('data-href') === '/link-only./guide'),
    ).toBe(true);
    expect(
      linkOnlyWrapper
        .findAll('.cm-hybrid-link')
        .some((segment) => segment.attributes('data-source') === 'link-only'),
    ).toBe(true);
    expect(linkOnlyWrapper.find('.cm-hybrid-image-element').attributes('src')).toBe(
      'https://example.com/demo.png',
    );
    expect(
      linkOnlyWrapper.find('.cm-hybrid-image-element').attributes('data-source'),
    ).toBeUndefined();
  });

  it('falls back to original values when hooks throw or return nothing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n[Docs](./guide)\n![Alt](https://example.com/demo.png)',
        livePreview: true,
        renderHooks: {
          image: () => {
            throw new Error('image failed');
          },
          link: () => undefined,
        },
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    expect(wrapper.find('.cm-hybrid-image-element').attributes('src')).toBe(
      'https://example.com/demo.png',
    );
    expect(
      wrapper
        .findAll('.cm-hybrid-link')
        .some((segment) => segment.attributes('data-href') === './guide'),
    ).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('reconfigures live preview when renderHooks props change at runtime', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n[Docs](./guide)\n![Alt](https://example.com/demo.png)',
        livePreview: true,
        renderHooks: {
          image: ({ src }) => ({
            src: `${src}?version=1`,
          }),
          link: ({ href }) => ({
            href: `/v1${href}`,
          }),
        },
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    expect(wrapper.find('.cm-hybrid-image-element').attributes('src')).toContain('?version=1');
    expect(
      wrapper
        .findAll('.cm-hybrid-link')
        .some((segment) => segment.attributes('data-href') === '/v1./guide'),
    ).toBe(true);

    await wrapper.setProps({
      renderHooks: {
        image: ({ src }) => ({
          src: `${src}?version=2`,
        }),
        link: ({ href }) => ({
          href: `/v2${href}`,
        }),
      },
    });
    await nextTick();
    await nextTick();

    expect(wrapper.find('.cm-hybrid-image-element').attributes('src')).toContain('?version=2');
    expect(
      wrapper
        .findAll('.cm-hybrid-link')
        .some((segment) => segment.attributes('data-href') === '/v2./guide'),
    ).toBe(true);
  });

  it('does not invoke render hooks when live preview is disabled', async () => {
    const imageHook = vi.fn();
    const linkHook = vi.fn();
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n[Docs](./guide)\n![Alt](https://example.com/demo.png)',
        livePreview: false,
        renderHooks: {
          image: imageHook,
          link: linkHook,
        },
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    expect(imageHook).not.toHaveBeenCalled();
    expect(linkHook).not.toHaveBeenCalled();
    expect(wrapper.find('.cm-hybrid-image').exists()).toBe(false);
  });

  it('keeps active scope source mode when render hooks are enabled', async () => {
    const linkMarkdown = '[Docs](./guide)';
    const imageMarkdown = '![Alt](https://example.com/demo.png)';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: `\n${linkMarkdown}\n${imageMarkdown}`,
        livePreview: true,
        renderHooks: {
          image: ({ src }) => ({ src: `${src}?hooked=true` }),
          link: ({ href }) => ({ href: `/hooked${href}` }),
        },
      },
    });

    const view = await getEditorView(wrapper);
    await focusEditorView(view);

    expect(wrapper.find('.cm-hybrid-image').exists()).toBe(true);
    expect(wrapper.find('.cm-hybrid-link').exists()).toBe(true);

    view.dispatch({
      selection: {
        anchor: 4,
      },
    });
    await nextTick();

    expect(wrapper.find('.cm-hybrid-link').exists()).toBe(true);
    expect(wrapper.find('.cm-content').element.textContent).toContain(linkMarkdown);

    view.dispatch({
      selection: {
        anchor: linkMarkdown.length + 5,
      },
    });
    await nextTick();

    expect(wrapper.find('.cm-hybrid-image').exists()).toBe(true);
    expect(wrapper.find('.cm-content').element.textContent).toContain(imageMarkdown);
  });

  it('keeps emphasis, strong, and inline code styling while showing source in the active scope', async () => {
    const markdown = '*italic* **bold** `code`';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await focusEditorView(view);

    expect(wrapper.find('.cm-hybrid-emphasis').exists()).toBe(true);
    expect(wrapper.find('.cm-hybrid-strong').exists()).toBe(true);
    expect(wrapper.find('.cm-hybrid-inline-code').exists()).toBe(true);

    view.dispatch({
      selection: {
        anchor: 2,
      },
    });
    await nextTick();

    expect(wrapper.find('.cm-hybrid-emphasis').exists()).toBe(true);
    expect(wrapper.find('.cm-content').element.textContent).toContain('*italic*');

    view.dispatch({
      selection: {
        anchor: 12,
      },
    });
    await nextTick();

    expect(wrapper.find('.cm-hybrid-strong').exists()).toBe(true);
    expect(wrapper.find('.cm-content').element.textContent).toContain('**bold**');

    view.dispatch({
      selection: {
        anchor: 21,
      },
    });
    await nextTick();

    expect(wrapper.find('.cm-hybrid-inline-code').exists()).toBe(true);
    expect(wrapper.find('.cm-content').element.textContent).toContain('`code`');
  });

  it('keeps active inline markdown styles under common host span resets', async () => {
    const removeHostReset = installHostSpanReset();
    const markdown = '*italic* **bold** [link](https://example.com) `code`';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
      attachTo: document.body,
    });

    try {
      const view = await getEditorView(wrapper);
      await focusEditorView(view);

      view.dispatch({
        selection: {
          anchor: markdown.indexOf('italic') + 1,
        },
      });
      await nextTick();

      const emphasis = wrapper.element.querySelector('.cm-hybrid-emphasis') as HTMLElement | null;
      const emphasisInner = emphasis?.querySelector('span') as HTMLElement | null;
      expect(emphasis).not.toBeNull();
      expect(emphasisInner).not.toBeNull();
      expect(getComputedStyle(emphasisInner!).fontStyle).toBe('italic');

      view.dispatch({
        selection: {
          anchor: markdown.indexOf('bold') + 1,
        },
      });
      await nextTick();

      const strong = wrapper.element.querySelector('.cm-hybrid-strong') as HTMLElement | null;
      const strongInner = strong?.querySelector('span') as HTMLElement | null;
      expect(strong).not.toBeNull();
      expect(strongInner).not.toBeNull();
      const strongRules = getCssRulesContaining('.cm-hybrid-strong span');
      expect(strongRules.some((text) => text.includes('font-weight: 700'))).toBe(true);

      view.dispatch({
        selection: {
          anchor: markdown.indexOf('link') + 1,
        },
      });
      await nextTick();

      const link = wrapper.element.querySelector('.cm-hybrid-link') as HTMLElement | null;
      const linkInner = link?.querySelector('span') as HTMLElement | null;
      expect(link).not.toBeNull();
      expect(linkInner).not.toBeNull();
      const linkRules = getCssRulesContaining('.cm-hybrid-link span');
      expect(linkRules.some((text) => text.includes('rgb(11, 87, 208)'))).toBe(true);
      expect(linkRules.some((text) => text.includes('text-decoration: underline'))).toBe(true);

      view.dispatch({
        selection: {
          anchor: markdown.indexOf('code') + 1,
        },
      });
      await nextTick();

      const inlineCode = wrapper.element.querySelector(
        '.cm-hybrid-inline-code',
      ) as HTMLElement | null;
      const inlineCodeInner = inlineCode?.querySelector('span') as HTMLElement | null;
      expect(inlineCode).not.toBeNull();
      expect(inlineCodeInner).not.toBeNull();
      const codeFontRules = getCssRulesContaining('.cm-una-code-font span');
      expect(codeFontRules.some((text) => text.includes('--una-code-font-family'))).toBe(true);
    } finally {
      wrapper.unmount();
      removeHostReset();
    }
  });

  it('ignores attempts to change visible link text from render hooks', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n[Original Label](./guide)',
        livePreview: true,
        renderHooks: {
          link: ({ href }) =>
            ({
              href: `/preserved${href}`,
              text: 'Mutated Label',
            }) as unknown as { href: string; text: string },
        },
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    expect(wrapper.find('.cm-content').element.textContent).toContain('Original Label');
    expect(wrapper.find('.cm-content').element.textContent).not.toContain('Mutated Label');
    expect(
      wrapper
        .findAll('.cm-hybrid-link')
        .some((segment) => segment.attributes('data-href') === '/preserved./guide'),
    ).toBe(true);
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

  it('renders legal markdown tables as structured tables when live preview is enabled', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    await getEditorView(wrapper);

    expect(wrapper.find('.cm-structured-table').exists()).toBe(true);
    expect(wrapper.find('table').exists()).toBe(true);
    expect(wrapper.find('.cm-content').element.textContent).not.toContain('| head | value |');
  });

  it('applies delimiter alignment to both header and body cells in structured tables', async () => {
    const markdown = '| left | center | right |\n| :--- | :---: | ---: |\n| a | b | c |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const headerLeft = wrapper.find('[data-cell-row="0"][data-cell-col="0"]');
    const headerCenter = wrapper.find('[data-cell-row="0"][data-cell-col="1"]');
    const headerRight = wrapper.find('[data-cell-row="0"][data-cell-col="2"]');
    const bodyLeft = wrapper.find('[data-cell-row="1"][data-cell-col="0"]');
    const bodyCenter = wrapper.find('[data-cell-row="1"][data-cell-col="1"]');
    const bodyRight = wrapper.find('[data-cell-row="1"][data-cell-col="2"]');

    expect((headerLeft.element as HTMLElement).style.textAlign).toBe('left');
    expect((headerCenter.element as HTMLElement).style.textAlign).toBe('center');
    expect((headerRight.element as HTMLElement).style.textAlign).toBe('right');
    expect((bodyLeft.element as HTMLElement).style.textAlign).toBe('left');
    expect((bodyCenter.element as HTMLElement).style.textAlign).toBe('center');
    expect((bodyRight.element as HTMLElement).style.textAlign).toBe('right');
  });

  it('renders structured table headers with a subtle theme-aware background color', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const lightWrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        theme: 'light',
      },
    });

    await getEditorView(lightWrapper);
    await nextTick();

    const lightHeader = lightWrapper.find('[data-cell-row="0"][data-cell-col="1"]');
    expect(lightHeader.exists()).toBe(true);
    expect(
      (lightWrapper.element as HTMLElement).style.getPropertyValue('--una-table-header-bg'),
    ).toBe('rgba(15, 23, 42, 0.04)');

    const darkWrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        theme: 'dark',
      },
    });

    await getEditorView(darkWrapper);
    await nextTick();

    const darkHeader = darkWrapper.find('[data-cell-row="0"][data-cell-col="1"]');
    expect(darkHeader.exists()).toBe(true);
    expect(
      (darkWrapper.element as HTMLElement).style.getPropertyValue('--una-table-header-bg'),
    ).toBe('rgba(148, 163, 184, 0.12)');

    const customWrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        theme: {
          type: 'dark',
          table: {
            headerBackground: 'rgba(245, 158, 11, 0.12)',
          },
        },
      },
    });

    await getEditorView(customWrapper);
    await nextTick();

    const customHeader = customWrapper.find('[data-cell-row="0"][data-cell-col="1"]');
    expect(customHeader.exists()).toBe(true);
    expect(
      (customWrapper.element as HTMLElement).style.getPropertyValue('--una-table-header-bg'),
    ).toBe('rgba(245, 158, 11, 0.12)');
  });

  it('keeps incomplete tables in source mode while live preview is enabled', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    await getEditorView(wrapper);

    expect(wrapper.find('.cm-structured-table').exists()).toBe(false);
    expect(wrapper.find('.cm-content').element.textContent).toContain('| head | value |');
  });

  it('keeps tables in source mode when live preview is disabled', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: false,
      },
    });

    await getEditorView(wrapper);

    expect(wrapper.find('.cm-structured-table').exists()).toBe(false);
    expect(wrapper.find('.cm-content').element.textContent).toContain('| head | value |');
  });

  it('opens a cell editor and writes back markdown table source', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    const targetCell = wrapper.find('[data-cell-row="1"][data-cell-col="1"]');
    expect(targetCell.exists()).toBe(true);

    await targetCell.trigger('click');
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay');
    expect(textarea.exists()).toBe(true);
    expect(textarea.classes()).toContain('cm-structured-table-overlay-visible');
    expect(targetCell.classes()).not.toContain('cm-structured-table-cell-selected');

    const element = textarea.element as HTMLTextAreaElement;
    element.value = 'updated';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(view.state.doc.toString()).toContain('| cell | updated |');
  });

  it('places the non-vim cell caret close to the click position', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const content = wrapper.find(
      '[data-cell-row="1"][data-cell-col="1"] .cm-structured-table-cell-content',
    );
    const textNode = content.element.firstChild as Text;
    const originalCaretRangeFromPoint = (
      document as Document & {
        caretRangeFromPoint?: (
          x: number,
          y: number,
        ) => { startContainer: Node; startOffset: number };
      }
    ).caretRangeFromPoint;

    Object.defineProperty(document, 'caretRangeFromPoint', {
      configurable: true,
      value: () => ({
        startContainer: textNode,
        startOffset: 2,
      }),
    });

    content.element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 16, clientY: 8 }),
    );
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    expect(textarea.selectionStart).toBe(2);
    expect(textarea.selectionEnd).toBe(2);

    Object.defineProperty(document, 'caretRangeFromPoint', {
      configurable: true,
      value: originalCaretRangeFromPoint,
    });
  });

  it('normalizes pasted newlines into br tags inside the active cell', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="1"]').trigger('click');
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    const pasteEvent = new Event('paste', { bubbles: true }) as Event & {
      clipboardData: { getData(type: string): string };
    };
    pasteEvent.clipboardData = {
      getData: (type: string) => (type === 'text/plain' ? 'text\nnext' : ''),
    };

    textarea.setSelectionRange(0, textarea.value.length);
    textarea.dispatchEvent(pasteEvent);
    await nextTick();

    expect(view.state.doc.toString()).toContain('text<br>next');
  });

  it('keeps plain-text paste inside one cell and ignores html clipboard payloads', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="1"]').trigger('click');
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    const pasteEvent = new Event('paste', { bubbles: true }) as Event & {
      clipboardData: { getData(type: string): string };
    };
    pasteEvent.clipboardData = {
      getData: (type: string) => {
        if (type === 'text/plain') return 'alpha\tbeta\nnext';
        if (type === 'text/html') return '<table><tr><td>ignored</td></tr></table>';
        return '';
      },
    };

    textarea.setSelectionRange(0, textarea.value.length);
    textarea.dispatchEvent(pasteEvent);
    await nextTick();

    expect(view.state.doc.toString()).toContain('alpha\tbeta<br>next');
    expect(view.state.doc.toString()).not.toContain('ignored');
    expect(view.state.doc.toString().split('\n')).toHaveLength(3);
  });

  it('preserves undo order across structured cell edit sessions', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="0"]').trigger('click');
    await nextTick();

    let textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    textarea.value = 'alpha';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="1"]').trigger('click');
    await nextTick();

    textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    textarea.value = 'beta';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(view.state.doc.toString()).toContain('| alpha | beta |');

    expect(undo(view)).toBe(true);
    await nextTick();
    expect(view.state.doc.toString()).toContain('| alpha | text |');

    expect(undo(view)).toBe(true);
    await nextTick();
    expect(view.state.doc.toString()).toContain('| cell | text |');
  });

  it('routes Mod-z from the active table overlay into the editor undo history', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="0"]').trigger('click');
    await nextTick();

    let textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    textarea.value = 'alpha';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="1"]').trigger('click');
    await nextTick();

    textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    textarea.value = 'beta';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    textarea.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    await nextTick();

    expect(view.state.doc.toString()).toContain('| alpha | text |');
  });

  it('escapes plain pipes while preserving inline code pipes in table cells', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="1"]').trigger('click');
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    textarea.value = 'plain | `code|span`';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(view.state.doc.toString()).toContain('plain \\| `code|span`');
  });

  it('keeps a typed space visible in the active overlay instead of immediately trimming it away', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| alpha | beta |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="0"]').trigger('click');
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    textarea.value = 'alpha ';
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(textarea.value).toBe('alpha ');

    textarea.value = 'alpha b';
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(view.state.doc.toString()).toContain('| alpha b');
  });

  it('keeps the structured table widget visible while an active cell contains an unfinished inline code marker', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| alpha | beta |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="1"]').trigger('click');
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    textarea.value = '`';
    textarea.setSelectionRange(1, 1);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(view.state.doc.toString()).toContain('| alpha | ` |');
    expect(wrapper.find('.cm-structured-table').exists()).toBe(true);
    expect(wrapper.find('.cm-structured-table-overlay').classes()).toContain(
      'cm-structured-table-overlay-visible',
    );
  });

  it('keeps the editing session alive when the active cell leaves the viewport and scrolls it back on input', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| alpha | beta |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    const cell = wrapper.find('[data-cell-row="1"][data-cell-col="1"]');
    await cell.trigger('click');
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    expect(textarea.classList.contains('cm-structured-table-overlay-visible')).toBe(true);
    const originalCellRect = cell.element.getBoundingClientRect.bind(cell.element);
    const originalEditorRect = view.dom.getBoundingClientRect.bind(view.dom);
    Object.defineProperty(cell.element, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(0, 600, 120, 32),
    });
    Object.defineProperty(view.dom, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(0, 0, 600, 300),
    });

    textarea.value = 'beta!';
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(wrapper.find('.cm-structured-table-overlay').classes()).toContain(
      'cm-structured-table-overlay-visible',
    );
    expect(view.state.doc.toString()).toContain('beta!');

    Object.defineProperty(cell.element, 'getBoundingClientRect', {
      configurable: true,
      value: originalCellRect,
    });
    Object.defineProperty(view.dom, 'getBoundingClientRect', {
      configurable: true,
      value: originalEditorRect,
    });
  });

  it('uses Enter and Tab to navigate and append rows in structured tables', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="1"]').trigger('click');
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await nextTick();

    expect(view.state.doc.toString()).toContain('|  |  |');
    expect(wrapper.find('[data-cell-row="2"][data-cell-col="1"]').exists()).toBe(true);

    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await nextTick();

    expect(wrapper.find('[data-cell-row="2"][data-cell-col="0"]').exists()).toBe(true);
  });

  it('enters the structured table from adjacent plain-text lines with ArrowDown in standard mode', async () => {
    const markdown = 'intro\n\n| head | value |\n| --- | --- |\n| alpha | beta |\n\noutro';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);

    view.dispatch({ selection: { anchor: markdown.indexOf('\n\n') + 1 } });
    await dispatchEditorKey(view, 'ArrowDown');

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    expect(textarea.classList.contains('cm-structured-table-overlay-visible')).toBe(true);
    expect(view.state.selection.main.head).toBe(markdown.indexOf('head'));
    expect(textarea.selectionStart).toBe(0);
  });

  it('does not skip a blank line before entering a structured table with ArrowDown in standard mode', async () => {
    const markdown = '## heading\n\n| head | value |\n| --- | --- |\n| alpha | beta |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    const headingLine = view.state.doc.line(1);
    view.dispatch({ selection: { anchor: headingLine.from } });

    await dispatchEditorKey(view, 'ArrowDown');

    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(2);
    expect(wrapper.find('.cm-structured-table-overlay').classes()).not.toContain(
      'cm-structured-table-overlay-visible',
    );
    expect(wrapper.find('.cm-structured-table-cell-active').exists()).toBe(false);
  });

  it('requests scroll into view when ArrowDown moves the caret in non-vim mode', async () => {
    const markdown = 'line 1\nline 2\nline 3\nline 4';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    view.dispatch({ selection: { anchor: view.state.doc.line(1).from } });
    const dispatchSpy = vi.spyOn(view, 'dispatch');

    await dispatchEditorKey(view, 'ArrowDown');

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userEvent: 'select.livepreview-vertical',
        scrollIntoView: true,
      }),
    );
  });

  it('leaves the table instead of appending rows when ArrowDown is pressed from the last row', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| cell | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="1"]').trigger('click');
    await nextTick();

    const before = view.state.doc.toString();
    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await nextTick();

    expect(view.state.doc.toString()).toBe(before);
    expect(wrapper.find('.cm-structured-table-overlay').classes()).not.toContain(
      'cm-structured-table-overlay-visible',
    );
  });

  it('exits the active cell when clicking outside the table and keeps the external caret position', async () => {
    const markdown =
      'intro text\n\n| head | value |\n| --- | --- |\n| alpha | beta |\n\noutro text';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="1"]').trigger('click');
    await nextTick();
    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    expect(wrapper.find('.cm-structured-table-overlay').classes()).toContain(
      'cm-structured-table-overlay-visible',
    );

    const outsidePosition = markdown.indexOf('outro');
    view.dispatch({ selection: { anchor: outsidePosition } });
    await wrapper.find('.cm-content').trigger('click');
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    await nextTick();

    expect(wrapper.find('.cm-structured-table-overlay').classes()).not.toContain(
      'cm-structured-table-overlay-visible',
    );
    expect(document.activeElement).not.toBe(textarea);

    const beforeMove = view.state.selection.main.head;
    await dispatchEditorKey(view, 'ArrowRight');
    expect(view.state.selection.main.head).toBe(beforeMove + 1);
  });

  it('leaves the last table cell without keeping the bottom-right cell active', async () => {
    const markdown =
      'intro\n\n| h1 | h2 | h3 |\n| --- | --- | --- |\n| a | b | c |\n| d | e | f |\n\noutro';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="2"][data-cell-col="2"]').trigger('click');
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await nextTick();
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await nextTick();

    expect(wrapper.find('.cm-structured-table-overlay').classes()).not.toContain(
      'cm-structured-table-overlay-visible',
    );
    expect(wrapper.findAll('.cm-structured-table-cell-active')).toHaveLength(0);
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(7);
  });

  it('keeps the same cell in editing mode when clicking its overlay again', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| alpha | beta |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="1"]').trigger('click');
    await nextTick();

    const overlay = wrapper.find('.cm-structured-table-overlay');
    expect(overlay.classes()).toContain('cm-structured-table-overlay-visible');
    expect(wrapper.find('[data-cell-row="1"][data-cell-col="1"]').classes()).toContain(
      'cm-structured-table-cell-active',
    );

    overlay.element.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }),
    );
    overlay.element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
    );
    await nextTick();

    expect(wrapper.find('.cm-structured-table-overlay').classes()).toContain(
      'cm-structured-table-overlay-visible',
    );
    expect(wrapper.find('[data-cell-row="1"][data-cell-col="1"]').classes()).toContain(
      'cm-structured-table-cell-active',
    );
  });

  it('switches directly to the next clicked cell on the first pointer interaction', async () => {
    const markdown =
      '| feature | status | notes |\n| :--- | :---: | ---: |\n| navigation | ready | directions |\n| source fallback | stable | keep source |\n| image | ![demo](https://placehold.co/120x72/0f172a/ffffff?text=Cell) | preview |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const firstCell = wrapper.find('[data-cell-row="2"][data-cell-col="2"]');
    firstCell.element.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }),
    );
    firstCell.element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
    );
    await nextTick();

    let overlay = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    expect(overlay.classList.contains('cm-structured-table-overlay-visible')).toBe(true);
    expect(wrapper.find('[data-cell-row="2"][data-cell-col="2"]').classes()).toContain(
      'cm-structured-table-cell-active',
    );

    const nextCell = wrapper.find('[data-cell-row="3"][data-cell-col="0"]');
    nextCell.element.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }),
    );
    nextCell.element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
    );
    await nextTick();

    overlay = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    expect(overlay.classList.contains('cm-structured-table-overlay-visible')).toBe(true);
    expect(wrapper.find('[data-cell-row="3"][data-cell-col="0"]').classes()).toContain(
      'cm-structured-table-cell-active',
    );
    expect(wrapper.find('[data-cell-row="2"][data-cell-col="2"]').classes()).not.toContain(
      'cm-structured-table-cell-active',
    );
  });

  it('deletes the last empty row with Backspace from the first cell start', async () => {
    const markdown = '| head | value |\n| --- | --- |\n|  |  |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="0"]').trigger('click');
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    textarea.setSelectionRange(0, 0);
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    await nextTick();

    expect(view.state.doc.toString()).toBe('| head | value |\n| --- | --- |');
  });

  it('renders inline markdown features and whitelisted br tags in inactive cells', async () => {
    const markdown =
      '| head | value |\n| --- | --- |\n| **bold** [link](https://example.com) `code|span` | first<br>second ![alt](https://example.com/image.png) |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const firstCell = wrapper.find('[data-cell-row="1"][data-cell-col="0"]');
    const secondCell = wrapper.find('[data-cell-row="1"][data-cell-col="1"]');

    expect(firstCell.find('strong').text()).toBe('bold');
    expect(firstCell.find('.cm-structured-table-link').attributes('href')).toBe(
      'https://example.com',
    );
    expect(firstCell.find('.cm-structured-table-inline-code').text()).toBe('code|span');
    expect(secondCell.find('br').exists()).toBe(true);
    expect(secondCell.find('.cm-structured-table-image').attributes('src')).toBe(
      'https://example.com/image.png',
    );
  });

  it('keeps the first table line number visible in the gutter when a table is replaced by a widget', async () => {
    const markdown = 'intro\n\n| head | value |\n| --- | --- |\n| alpha | beta |\n\noutro';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        lineNumbers: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const gutterTexts = wrapper
      .findAll('.cm-lineNumbers .cm-gutterElement')
      .map((item) => item.text().trim())
      .filter(Boolean);

    expect(gutterTexts).toContain('3');
    expect(gutterTexts).toContain('7');
  });

  it('reveals markdown image source when a vim normal-mode caret enters the active cell', async () => {
    const markdown =
      '| head | value |\n| --- | --- |\n| ![alt](https://example.com/image.png) | text |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        vimMode: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="0"]').trigger('click');
    await nextTick();

    const cell = wrapper.find('[data-cell-row="1"][data-cell-col="0"]');
    expect(cell.classes()).toContain('cm-structured-table-cell-active');
    expect(cell.find('.cm-structured-table-image').exists()).toBe(false);
    expect(cell.find('.cm-structured-table-cell-content').text()).toContain(
      '![alt](https://example.com/image.png)',
    );
  });

  it('requests a remeasure when structured table preview images are mounted', async () => {
    const markdown =
      '| head | value |\n| --- | --- |\n| text | ![alt](https://example.com/image.png) |';
    const requestMeasureSpy = vi.spyOn(EditorView.prototype, 'requestMeasure');
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const image = wrapper.find('.cm-structured-table-image');
    expect(image.exists()).toBe(true);
    expect(requestMeasureSpy).toHaveBeenCalled();
  });

  it('renders neutral controls and supports append and delete row and column actions', async () => {
    const markdown = '| h1 | h2 | h3 |\n| --- | --- | --- |\n| a | b | c |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    expect(wrapper.find('.cm-structured-table-control-row').exists()).toBe(false);
    expect(wrapper.find('.cm-structured-table-footer-row').exists()).toBe(false);

    await wrapper.find('[data-action="append-column"]').trigger('click');
    await nextTick();
    expect(view.state.doc.toString()).toContain('| h1 | h2 | h3 |  |');

    await wrapper.find('[data-action="append-row"]').trigger('click');
    await nextTick();
    expect(view.state.doc.toString()).toContain('|  |  |  |  |');

    const columnHandle = wrapper.find('[data-structure-kind="column"][data-structure-index="3"]');
    await columnHandle.trigger('contextmenu', { clientX: 24, clientY: 24, button: 2 });
    await nextTick();
    await wrapper.find('[data-action="menu-delete"]').trigger('click');
    await nextTick();
    expect(view.state.doc.toString()).not.toContain('| h1 | h2 | h3 |  |');

    const rowHandle = wrapper.find('[data-structure-kind="row"][data-structure-index="2"]');
    await rowHandle.trigger('contextmenu', { clientX: 24, clientY: 24, button: 2 });
    await nextTick();
    await wrapper.find('[data-action="menu-delete"]').trigger('click');
    await nextTick();

    expect(view.state.doc.toString()).not.toContain('|  |  |  |');
  });

  it('removes the whole table when the last remaining column is deleted from the structure menu', async () => {
    const markdown = 'before\n\n| only |\n| --- |\n| value |\n\nafter';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    const columnHandle = wrapper.find('[data-structure-kind="column"][data-structure-index="0"]');
    await columnHandle.trigger('contextmenu', { clientX: 24, clientY: 24, button: 2 });
    await nextTick();
    await wrapper.find('[data-action="menu-delete"]').trigger('click');
    await nextTick();

    expect(view.state.doc.toString()).toContain('before');
    expect(view.state.doc.toString()).toContain('after');
    expect(view.state.doc.toString()).not.toContain('| only |');
    expect(view.state.doc.toString()).not.toContain('| --- |');
    expect(view.state.doc.toString()).not.toContain('| value |');
    expect(wrapper.find('.cm-table-widget').exists()).toBe(false);
  });

  it('uses only structure selection styling when a column handle is clicked during cell editing', async () => {
    const markdown = '| h1 | h2 | h3 |\n| --- | --- | --- |\n| a | b | c |\n| d | e | f |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-cell-row="2"][data-cell-col="2"]').trigger('click');
    await nextTick();
    expect(wrapper.find('.cm-structured-table-overlay').classes()).toContain(
      'cm-structured-table-overlay-visible',
    );

    await wrapper.find('[data-structure-kind="column"][data-structure-index="2"]').trigger('click');
    await nextTick();

    expect(wrapper.find('.cm-structured-table-overlay').classes()).not.toContain(
      'cm-structured-table-overlay-visible',
    );
    expect(wrapper.findAll('.cm-structured-table-cell-active')).toHaveLength(0);
    expect(wrapper.find('[data-cell-row="0"][data-cell-col="2"]').classes()).toContain(
      'cm-structured-table-cell-selected',
    );
    expect(wrapper.find('[data-cell-row="2"][data-cell-col="2"]').classes()).toContain(
      'cm-structured-table-cell-selected',
    );
  });

  it('allows deleting a selected column by right-clicking inside the selected column region', async () => {
    const markdown = '| h1 | h2 | h3 |\n| --- | --- | --- |\n| a | b | c |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    await wrapper.find('[data-structure-kind="column"][data-structure-index="1"]').trigger('click');
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="1"]').trigger('contextmenu', {
      clientX: 24,
      clientY: 24,
      button: 2,
    });
    await nextTick();
    await wrapper.find('[data-action="menu-delete"]').trigger('click');
    await nextTick();

    expect(view.state.doc.toString()).toContain('| h1 | h3 |');
    expect(view.state.doc.toString()).not.toContain('| h1 | h2 | h3 |');
    expect(view.state.doc.toString()).toContain('| a | c |');
  });

  it('reveals row and column handles only for the hovered edge cell and shows floating add buttons on the table edge', async () => {
    const markdown = '| h1 | h2 |\n| --- | --- |\n| a | b |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const rowHandle = wrapper.find('[data-row-handle="true"][data-structure-index="1"]');
    const colHandle = wrapper.find('[data-col-handle="true"][data-structure-index="0"]');
    const sideAdd = wrapper.find('[data-side-add="true"]');
    const bottomAdd = wrapper.find('[data-bottom-add="true"]');

    expect(rowHandle.classes()).not.toContain('cm-structured-table-handle-visible');
    expect(colHandle.classes()).not.toContain('cm-structured-table-handle-visible');
    expect(sideAdd.classes()).not.toContain('cm-structured-table-add-visible');
    expect(bottomAdd.classes()).not.toContain('cm-structured-table-add-visible');

    await wrapper.find('[data-cell-row="1"][data-cell-col="0"]').trigger('mousemove');
    await nextTick();
    expect(rowHandle.classes()).toContain('cm-structured-table-handle-visible');
    expect(bottomAdd.classes()).toContain('cm-structured-table-add-visible');

    await wrapper.find('[data-cell-row="0"][data-cell-col="0"]').trigger('mousemove');
    await nextTick();
    expect(colHandle.classes()).toContain('cm-structured-table-handle-visible');

    colHandle.element.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(colHandle.classes()).toContain('cm-structured-table-handle-visible');

    await wrapper.find('[data-cell-row="1"][data-cell-col="1"]').trigger('mousemove');
    await nextTick();
    expect(sideAdd.classes()).toContain('cm-structured-table-add-visible');
  });

  it('removes the whole table when the last remaining column is deleted from the context menu', async () => {
    const markdown = 'before\n\n| head |\n| --- |\n| cell |\n\nafter';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    const columnHandle = wrapper.find('[data-structure-kind="column"][data-structure-index="0"]');
    await columnHandle.trigger('contextmenu', { clientX: 24, clientY: 24, button: 2 });
    await nextTick();
    await wrapper.find('[data-action="menu-delete"]').trigger('click');
    await nextTick();

    expect(view.state.doc.toString()).toContain('before');
    expect(view.state.doc.toString()).toContain('after');
    expect(view.state.doc.toString()).not.toContain('| head |');
    expect(view.state.doc.toString()).not.toContain('| --- |');
    expect(view.state.doc.toString()).not.toContain('| cell |');
  });

  it('keeps global vim navigation intact before reaching a structured table', async () => {
    const markdown = 'line 1\nline 2\nline 3\n\n| head | value |\n| --- | --- |\n| alpha | beta |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        vimMode: true,
      },
    });

    const view = await getEditorView(wrapper);
    const cm = getCM(view);
    expect(cm).not.toBeNull();

    await focusEditorView(view);
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(1);

    Vim.handleKey(cm!, 'j', 'test');
    await nextTick();
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(2);

    Vim.handleKey(cm!, 'j', 'test');
    await nextTick();
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(3);
    expect(wrapper.find('.cm-structured-table-cell-active').exists()).toBe(false);
  });

  it('enters the structured table from adjacent plain-text lines in vim normal mode', async () => {
    const markdown = 'intro\n\n| head | value |\n| --- | --- |\n| alpha | beta |\n\noutro';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        vimMode: true,
      },
    });

    const view = await getEditorView(wrapper);
    const cm = getCM(view);
    expect(cm).not.toBeNull();
    await focusEditorView(view);

    view.dispatch({ selection: { anchor: markdown.indexOf('\n\n') + 1 } });
    Vim.handleKey(cm!, 'j', 'test');
    await nextTick();
    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    expect(wrapper.find('[data-cell-row="0"][data-cell-col="0"]').classes()).toContain(
      'cm-structured-table-cell-active',
    );
    expect(view.state.selection.main.head).toBe(markdown.indexOf('head'));
    expect(textarea.classList.contains('cm-structured-table-overlay-visible')).toBe(false);
    expect(view.coordsAtPos(view.state.selection.main.head)).not.toBeNull();

    view.dispatch({ selection: { anchor: markdown.lastIndexOf('\n\noutro') + 1 } });
    await nextTick();
    Vim.handleKey(cm!, 'k', 'test');
    await nextTick();
    expect(wrapper.find('[data-cell-row="1"][data-cell-col="0"]').classes()).toContain(
      'cm-structured-table-cell-active',
    );
    expect(view.state.selection.main.head).toBe(markdown.indexOf('alpha'));
  });

  it('keeps vim normal mode on the main selection and enters insert mode with i', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| alpha | beta |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        vimMode: true,
      },
    });

    const view = await getEditorView(wrapper);
    const cm = getCM(view);
    expect(cm).not.toBeNull();
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="0"]').trigger('click');
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    expect(textarea.classList.contains('cm-structured-table-overlay-visible')).toBe(false);
    expect(cm!.state.vim?.insertMode).toBe(false);
    expect(view.coordsAtPos(view.state.selection.main.head)).not.toBeNull();

    await dispatchEditorKey(view, 'i');
    await nextTick();

    expect(cm!.state.vim?.insertMode).toBe(true);
    expect(textarea.classList.contains('cm-structured-table-overlay-visible')).toBe(true);
    expect(textarea.readOnly).toBe(false);
  });

  it('returns control to the main selection on Escape inside a table cell', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| alpha | beta |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        vimMode: true,
      },
    });

    const view = await getEditorView(wrapper);
    const cm = getCM(view);
    expect(cm).not.toBeNull();
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="0"]').trigger('click');
    await nextTick();

    const textarea = wrapper.find('.cm-structured-table-overlay').element as HTMLTextAreaElement;
    await dispatchEditorKey(view, 'i');
    await nextTick();
    expect(cm!.state.vim?.insertMode).toBe(true);
    expect(textarea.classList.contains('cm-structured-table-overlay-visible')).toBe(true);

    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await nextTick();

    expect(cm!.state.vim?.insertMode).toBe(false);
    expect(textarea.classList.contains('cm-structured-table-overlay-visible')).toBe(false);
    expect(view.coordsAtPos(view.state.selection.main.head)).not.toBeNull();
  });

  it('supports local vim table navigation and protects the header row on dd', async () => {
    const markdown = '| head | value |\n| --- | --- |\n| alpha beta | text |\n| gamma | tail |';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        vimMode: true,
      },
    });

    const view = await getEditorView(wrapper);
    const cm = getCM(view);
    expect(cm).not.toBeNull();
    await nextTick();

    await wrapper.find('[data-cell-row="1"][data-cell-col="0"]').trigger('click');
    await nextTick();
    const alphaStart = markdown.indexOf('alpha beta');
    const gammaStart = markdown.indexOf('gamma');
    const gammaLength = 'gamma'.length;
    const tailStart = markdown.indexOf('tail');
    expect(view.state.selection.main.head).toBe(alphaStart);

    await dispatchEditorKey(view, 'l');
    expect(wrapper.find('[data-cell-row="1"][data-cell-col="0"]').classes()).toContain(
      'cm-structured-table-cell-active',
    );
    expect(view.state.selection.main.head).toBe(alphaStart + 1);

    await dispatchEditorKey(view, 'l');
    await dispatchEditorKey(view, 'l');
    expect(view.state.selection.main.head).toBe(alphaStart + 3);

    await dispatchEditorKey(view, 'j');
    expect(wrapper.find('[data-cell-row="2"][data-cell-col="0"]').classes()).toContain(
      'cm-structured-table-cell-active',
    );
    expect(view.state.selection.main.head).toBe(gammaStart + 3);

    await dispatchEditorKey(view, 'h');
    expect(wrapper.find('[data-cell-row="2"][data-cell-col="0"]').classes()).toContain(
      'cm-structured-table-cell-active',
    );
    expect(view.state.selection.main.head).toBe(gammaStart + 2);

    for (let index = 0; index < gammaLength - 2; index += 1) {
      await dispatchEditorKey(view, 'l');
    }
    expect(view.state.selection.main.head).toBe(gammaStart + gammaLength);

    await dispatchEditorKey(view, 'l');
    expect(wrapper.find('[data-cell-row="2"][data-cell-col="1"]').classes()).toContain(
      'cm-structured-table-cell-active',
    );
    expect(view.state.selection.main.head).toBe(tailStart);

    await wrapper.find('[data-cell-row="0"][data-cell-col="0"]').trigger('click');
    await nextTick();
    const beforeHeaderDelete = view.state.doc.toString();
    Vim.handleKey(cm!, 'd', 'test');
    Vim.handleKey(cm!, 'd', 'test');
    await nextTick();
    expect(view.state.doc.toString()).toBe(beforeHeaderDelete);

    await wrapper.find('[data-cell-row="2"][data-cell-col="0"]').trigger('click');
    await nextTick();
    expect(wrapper.find('[data-cell-row="2"][data-cell-col="0"]').classes()).toContain(
      'cm-structured-table-cell-active',
    );

    Vim.handleKey(cm!, 'd', 'test');
    Vim.handleKey(cm!, 'd', 'test');
    await nextTick();
    expect(view.state.doc.toString()).not.toContain('| gamma | tail |');
  });

  it('removes the whole table when vim dd is used on the header row of a header-only table', async () => {
    const markdown = 'before\n\n| head | value |\n| --- | --- |\n\nafter';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        vimMode: true,
      },
    });

    const view = await getEditorView(wrapper);
    const cm = getCM(view);
    expect(cm).not.toBeNull();
    await nextTick();

    await wrapper.find('[data-cell-row="0"][data-cell-col="0"]').trigger('click');
    await nextTick();

    Vim.handleKey(cm!, 'd', 'test');
    Vim.handleKey(cm!, 'd', 'test');
    await nextTick();

    expect(view.state.doc.toString()).toContain('before');
    expect(view.state.doc.toString()).toContain('after');
    expect(view.state.doc.toString()).not.toContain('| head | value |');
    expect(view.state.doc.toString()).not.toContain('| --- | --- |');
    expect(wrapper.find('.cm-table-widget').exists()).toBe(false);
    expect(view.state.selection.main.head).toBeLessThanOrEqual(view.state.doc.length);
  });

  it('moves from the final document line to the blank line first, then re-enters the last table row with k in vim normal mode', async () => {
    const markdown =
      '| feature | status | notes |\n| --- | --- | --- |\n| navigation | ready | text |\n| image | demo | rendered |\n\n| action | shortcut | result |\n| --- | --- | --- |\n| move down | Enter | row |\n| move up | Shift+Enter | row |\n| paste | text/plain | row |\n\nabcdef';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        vimMode: true,
      },
    });

    const view = await getEditorView(wrapper);
    const cm = getCM(view);
    expect(cm).not.toBeNull();
    await focusEditorView(view);

    const belowTextLine = view.state.doc.line(view.state.doc.lines);
    view.dispatch({
      selection: {
        anchor: belowTextLine.from + 3,
      },
    });
    await nextTick();

    Vim.handleKey(cm!, 'k', 'test');
    await nextTick();
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(11);

    Vim.handleKey(cm!, 'k', 'test');
    await nextTick();
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(10);
    expect(view.state.selection.main.head).toBe(markdown.indexOf('paste'));
    expect(wrapper.find('[data-cell-row="3"][data-cell-col="0"]').classes()).toContain(
      'cm-structured-table-cell-active',
    );
  });

  it('uses the real keydown path to move from the final document line to the blank line before re-entering a table with k', async () => {
    const markdown =
      '# title\n\n| feature | status | notes |\n| --- | --- | --- |\n| navigation | ready | text |\n| image | demo | rendered |\n\n| action | shortcut | result |\n| --- | --- | --- |\n| move down | Enter | row |\n| move up | Shift+Enter | row |\n| paste | text/plain | row |\n\nabcdef';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        vimMode: true,
      },
    });

    const view = await getEditorView(wrapper);
    await focusEditorView(view);

    const finalLine = view.state.doc.line(view.state.doc.lines);
    view.dispatch({
      selection: {
        anchor: finalLine.from + 2,
      },
    });
    await nextTick();

    await dispatchEditorKey(view, 'k');
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(13);

    await dispatchEditorKey(view, 'k');
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(12);
    expect(view.state.selection.main.head).toBe(markdown.indexOf('paste'));
  });

  it('renders standard unordered list markers in live preview', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '* item\n+ another',
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const markers = wrapper.findAll('.cm-hybrid-list-marker-bullet');
    expect(markers).toHaveLength(2);
    expect(markers[0].text()).toBe('•');
    expect(markers[1].text()).toBe('•');
    expect(wrapper.find('.cm-content').element.textContent).not.toContain('* item');
    expect(wrapper.find('.cm-content').element.textContent).not.toContain('+ another');
  });

  it('renders ordered list markers for dot and paren delimiters in live preview', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '1. first\n2) second',
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const markers = wrapper.findAll('.cm-hybrid-list-marker-ordered');
    expect(markers).toHaveLength(2);
    expect(markers[0].text()).toBe('1.');
    expect(markers[1].text()).toBe('2)');
  });

  it('renders GFM task list items as read-only checkboxes', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '- [ ] todo\n+ [x] done\n1) [X] ship',
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const checkboxes = wrapper.findAll('.cm-hybrid-task-checkbox');
    expect(checkboxes).toHaveLength(3);
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(false);
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[2].element as HTMLInputElement).checked).toBe(true);
  });

  it('reveals markdown list source when the cursor enters the current list item', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '\n* item',
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await focusEditorView(view);
    await nextTick();

    expect(wrapper.find('.cm-hybrid-list-marker-bullet').exists()).toBe(true);

    view.dispatch({
      selection: {
        anchor: 3,
      },
    });

    await nextTick();

    expect(wrapper.find('.cm-hybrid-list-marker-bullet').exists()).toBe(false);
    expect(wrapper.find('.cm-content').element.textContent).toContain('* item');
  });

  it('keeps nested and mixed list structures readable in live preview', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '- parent\n  1) child\n  + [ ] task',
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    expect(wrapper.findAll('.cm-hybrid-list-marker-bullet')).toHaveLength(1);
    expect(wrapper.findAll('.cm-hybrid-list-marker-ordered')).toHaveLength(1);
    expect(wrapper.findAll('.cm-hybrid-list-marker-task')).toHaveLength(1);
  });

  it('does not toggle task list state when clicking the rendered checkbox', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '- [ ] todo',
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    const checkbox = wrapper.find('.cm-hybrid-task-checkbox');
    expect(checkbox.exists()).toBe(true);

    await checkbox.trigger('click');
    await nextTick();

    expect(view.state.doc.toString()).toBe('- [ ] todo');
    expect(wrapper.find('.cm-hybrid-task-checkbox').exists()).toBe(true);
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

  it('applies fontFamily prop as CSS variable on the container', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        fontFamily: 'Georgia, serif',
      },
    });

    const style = wrapper.attributes('style') ?? '';
    expect(style).toContain('--una-font-family: Georgia, serif');
  });

  it('applies codeFontFamily prop as CSS variable on the container', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        codeFontFamily: 'Fira Code, monospace',
      },
    });

    const style = wrapper.attributes('style') ?? '';
    expect(style).toContain('--una-code-font-family: Fira Code, monospace');
  });

  it('applies fontSize prop as CSS variable on the container', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        fontSize: 18,
      },
    });

    const style = wrapper.attributes('style') ?? '';
    expect(style).toContain('--una-font-size: 18px');
  });

  it('does not set font CSS variables when font props are not provided', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
      },
    });

    const style = wrapper.attributes('style') ?? '';
    expect(style).not.toContain('--una-font-family');
    expect(style).not.toContain('--una-code-font-family');
    expect(style).not.toContain('--una-font-size');
  });

  it('updates font CSS variable when fontSize prop changes at runtime', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        fontSize: 14,
      },
    });

    expect(wrapper.attributes('style')).toContain('--una-font-size: 14px');

    await wrapper.setProps({ fontSize: 20 });

    expect(wrapper.attributes('style')).toContain('--una-font-size: 20px');
  });

  it('applies cm-una-code-font decoration to inline code in non-livePreview mode', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'Hello `world` text',
        livePreview: false,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    expect(wrapper.find('.cm-una-code-font').exists()).toBe(true);
  });

  it('applies cm-una-code-font decoration to fenced code block in non-livePreview mode', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '```\nconst x = 1;\n```',
        livePreview: false,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    expect(wrapper.find('.cm-una-code-font').exists()).toBe(true);
  });

  it('adds code decoration when switching from livePreview to non-livePreview', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'Hello `world` text',
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    await wrapper.setProps({ livePreview: false });
    await nextTick();

    expect(wrapper.find('.cm-una-code-font').exists()).toBe(true);
  });

  it('removes standalone code decoration when switching from non-livePreview to livePreview', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '# Heading',
        livePreview: false,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    // No heading decoration in non-livePreview
    expect(wrapper.find('.cm-hybrid-heading-1').exists()).toBe(false);

    await wrapper.setProps({ livePreview: true });
    await nextTick();

    // Heading decoration appears after switching to livePreview
    expect(wrapper.find('.cm-hybrid-heading-1').exists()).toBe(true);
  });

  it('keeps heading line decoration when entering an ATX heading', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '# Heading',
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    expect(wrapper.find('.cm-line.cm-heading-line-1').exists()).toBe(true);

    view.dispatch({ selection: { anchor: 2 } });
    await nextTick();

    expect(wrapper.find('.cm-line.cm-heading-line-1').exists()).toBe(true);
  });

  it('keeps the same computed heading font size between live preview and source states', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '# Heading',
        livePreview: true,
      },
    });

    const view = await getEditorView(wrapper);
    await nextTick();

    const previewHeading = wrapper.element.querySelector('.cm-hybrid-heading-1 .tok-heading');
    expect(previewHeading).not.toBeNull();
    const previewFontSize = getComputedStyle(previewHeading as Element).fontSize;

    view.dispatch({ selection: { anchor: 2 } });
    await nextTick();

    const sourceHeading = wrapper.element.querySelector(
      '.cm-line.cm-heading-line-1 .tok-heading:not(.tok-meta)',
    );
    expect(sourceHeading).not.toBeNull();
    const sourceFontSize = getComputedStyle(sourceHeading as Element).fontSize;

    expect(sourceFontSize).toBe(previewFontSize);
    expect(sourceFontSize).toBe('1.875em');
  });

  it('keeps heading source styles under common host span resets', async () => {
    const removeHostReset = installHostSpanReset();
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '# Heading',
        livePreview: true,
      },
      attachTo: document.body,
    });

    try {
      const view = await getEditorView(wrapper);
      await nextTick();

      const previewHeading = wrapper.element.querySelector('.cm-hybrid-heading-1 .tok-heading');
      expect(previewHeading).not.toBeNull();
      const previewStyles = getComputedStyle(previewHeading as Element);

      view.dispatch({ selection: { anchor: 2 } });
      await nextTick();

      const sourceHeading = wrapper.element.querySelector(
        '.cm-line.cm-heading-line-1 .tok-heading:not(.tok-meta)',
      );
      const sourceMeta = wrapper.element.querySelector('.cm-line.cm-heading-line-1 .tok-meta');
      expect(sourceHeading).not.toBeNull();
      expect(sourceMeta).not.toBeNull();

      const sourceStyles = getComputedStyle(sourceHeading as Element);
      expect(sourceStyles.fontSize).toBe(previewStyles.fontSize);
      expect(sourceStyles.fontWeight).toBe(previewStyles.fontWeight);
      expect(sourceStyles.lineHeight).toBe(previewStyles.lineHeight);
      expect(sourceStyles.fontSize).not.toBe('16px');
      expect(sourceStyles.lineHeight).not.toBe('1');
      expect(getComputedStyle(sourceMeta as Element).color).toBe('rgb(107, 114, 128)');
    } finally {
      wrapper.unmount();
      removeHostReset();
    }
  });

  it('applies Setext heading line decoration only to the content line', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'Heading\n---',
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    expect(wrapper.findAll('.cm-line.cm-heading-line-2')).toHaveLength(1);
  });

  it('updates live preview content styles when switching themes at runtime', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '[link](https://example.com)',
        livePreview: true,
        theme: 'light',
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const link = wrapper.find('.cm-hybrid-link');
    expect(link.exists()).toBe(true);
    expect(getComputedStyle(link.element).color).toBe('rgb(11, 87, 208)');

    await wrapper.setProps({
      theme: {
        type: 'dark',
        content: {
          link: {
            color: '#f59e0b',
          },
        },
      },
    });
    await nextTick();

    expect(getComputedStyle(link.element).color).toBe('rgb(245, 158, 11)');
  });

  it('updates code block theme when codeTheme prop changes', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '```ts\nconst x = 1;\n```',
        theme: 'light',
        codeTheme: 'auto',
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const codeLine = wrapper.find('.cm-code-block-line');
    expect(codeLine.exists()).toBe(true);
    expect(getComputedStyle(codeLine.element).backgroundColor).toBe('rgb(255, 255, 255)');

    await wrapper.setProps({ codeTheme: 'one-dark' });
    await nextTick();

    expect(getComputedStyle(codeLine.element).backgroundColor).toBe('rgb(40, 44, 52)');
  });

  it('uses resolved custom theme type for auto code block themes', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '```ts\nconst x = 1;\n```',
        theme: {
          type: 'dark',
          content: {
            link: {
              color: '#f59e0b',
            },
          },
        },
        codeTheme: 'auto',
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const codeLine = wrapper.find('.cm-code-block-line');
    expect(codeLine.exists()).toBe(true);
    expect(getComputedStyle(codeLine.element).backgroundColor).toBe('rgb(0, 43, 54)');

    await wrapper.setProps({
      theme: {
        type: 'light',
        content: {
          link: {
            color: '#0b57d0',
          },
        },
      },
    });
    await nextTick();

    expect(getComputedStyle(codeLine.element).backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('renders an inactive fenced code block opening line as a header row and hides the closing fence source', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '```js\nconsole.log("Hello")\n```',
        livePreview: true,
        codeLineNumbers: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const beginLine = wrapper.element.querySelector('.cm-line.cm-code-block-live-begin');
    const endLine = wrapper.element.querySelector('.cm-line.cm-code-block-live-end');
    const headerRules = getCssRulesContaining('.cm-code-block-header-row');
    const copyIconRules = getCssRulesContaining('.cm-code-block-copy-button::before');

    expect(beginLine).not.toBeNull();
    expect(endLine).not.toBeNull();
    expect(beginLine?.querySelector('.cm-code-block-header-row')).not.toBeNull();
    expect(beginLine?.querySelector('.cm-code-block-language-label')?.textContent).toBe(
      'JavaScript',
    );
    expect(beginLine?.querySelector('.cm-code-block-copy-button')).not.toBeNull();
    expect(beginLine?.textContent).not.toContain('```js');
    expect(endLine?.textContent).not.toContain('```');
    expect(endLine?.querySelector('.cm-code-block-end-cap')).not.toBeNull();
    expect(headerRules.some((text) => text.includes('position: absolute'))).toBe(true);
    expect(headerRules.some((text) => text.includes('justify-content: flex-end'))).toBe(true);
    expect(headerRules.some((text) => text.includes('width: 100%'))).toBe(false);
    expect(copyIconRules.some((text) => text.includes('mask-image'))).toBe(true);
  });

  it('does not invent a language label for fences without a language identifier', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '```\nplain text body\n```',
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const beginLine = wrapper.element.querySelector('.cm-line.cm-code-block-live-begin');
    expect(beginLine).not.toBeNull();
    expect(beginLine?.querySelector('.cm-code-block-header-row')).not.toBeNull();
    expect(beginLine?.querySelector('.cm-code-block-language-label')).toBeNull();
    expect(beginLine?.querySelector('.cm-code-block-copy-button')).not.toBeNull();
  });

  it('restores raw fences for the whole code block when the selection enters the active scope', async () => {
    const markdown = '```js\nconsole.log("Hello")\n```';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        codeLineNumbers: true,
      },
      attachTo: document.body,
    });

    try {
      const view = await getEditorView(wrapper);
      await focusEditorView(view);

      view.dispatch({
        selection: {
          anchor: markdown.indexOf('console') + 1,
        },
      });
      await nextTick();

      const beginLine = wrapper.element.querySelector('.cm-line.cm-code-block-live-begin');
      const endLine = wrapper.element.querySelector('.cm-line.cm-code-block-live-end');

      expect(beginLine).not.toBeNull();
      expect(endLine).not.toBeNull();
      expect(beginLine?.classList.contains('cm-code-block-live-shell')).toBe(true);
      expect(endLine?.classList.contains('cm-code-block-live-shell')).toBe(true);
      expect(beginLine?.textContent).toContain('```js');
      expect(endLine?.textContent).toContain('```');
      expect(wrapper.element.querySelector('.cm-code-block-header-row')).toBeNull();
    } finally {
      wrapper.unmount();
    }
  });

  it('uses canonical labels for known aliases and does not mis-normalize unknown languages', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '```js\nconsole.log(1)\n```\n\n```foobar\nconsole.log(2)\n```',
        livePreview: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const beginLines = wrapper.element.querySelectorAll('.cm-line.cm-code-block-live-begin');
    expect(beginLines).toHaveLength(2);

    const knownLabel = beginLines[0]?.querySelector('.cm-code-block-language-label');
    const unknownLabel = beginLines[1]?.querySelector('.cm-code-block-language-label');

    expect(knownLabel?.textContent).toBe('JavaScript');
    expect(unknownLabel).toBeNull();
    expect(beginLines[1]?.textContent).not.toContain('foobar');
  });

  it('copies only the code body from the header affordance without forcing source mode first', async () => {
    const originalClipboard = (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '```ts\nconst answer = 42;\nconsole.log(answer)\n```',
        livePreview: true,
        codeLineNumbers: true,
      },
    });

    try {
      await getEditorView(wrapper);
      await nextTick();

      const button = wrapper.element.querySelector(
        '.cm-code-block-copy-button',
      ) as HTMLButtonElement | null;
      expect(button).not.toBeNull();

      button?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await nextTick();

      expect(writeText).toHaveBeenCalledWith('const answer = 42;\nconsole.log(answer)');
      expect(wrapper.element.querySelector('.cm-code-block-header-row')).not.toBeNull();
      expect(
        wrapper.element.querySelector('.cm-line.cm-code-block-live-begin')?.textContent,
      ).not.toContain('```ts');
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
    }
  });

  it('falls back to execCommand copy when the Clipboard API is unavailable', async () => {
    const originalClipboard = (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
    const originalExecCommand = document.execCommand;
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard unavailable'));
    const execCommand = vi.fn().mockReturnValue(true);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '```ts\nconst fallback = true\n```',
        livePreview: true,
      },
    });

    try {
      await getEditorView(wrapper);
      await nextTick();

      const button = wrapper.element.querySelector(
        '.cm-code-block-copy-button',
      ) as HTMLButtonElement | null;
      expect(button).not.toBeNull();

      button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await nextTick();

      expect(writeText).toHaveBeenCalledWith('const fallback = true');
      expect(execCommand).toHaveBeenCalledWith('copy');
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: originalExecCommand,
      });
    }
  });

  it('keeps the copy affordance available in readonly live preview mode', async () => {
    const originalClipboard = (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '```ts\nconst readonlyValue = true\n```',
        livePreview: true,
        readonly: true,
      },
    });

    try {
      await getEditorView(wrapper);
      await nextTick();

      const button = wrapper.element.querySelector(
        '.cm-code-block-copy-button',
      ) as HTMLButtonElement | null;
      expect(button).not.toBeNull();

      button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await Promise.resolve();

      expect(writeText).toHaveBeenCalledWith('const readonlyValue = true');
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
    }
  });

  it('renders begin body end lines with a shared faux gutter width in live preview code blocks', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '```js\nconsole.log(1)\nconsole.log(2)\n```',
        livePreview: true,
        codeLineNumbers: true,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const beginLine = wrapper.element.querySelector('.cm-line.cm-code-block-live-begin');
    const bodyLines = wrapper.element.querySelectorAll('.cm-line.cm-code-block-live-body');
    const endLine = wrapper.element.querySelector('.cm-line.cm-code-block-live-end');

    expect(beginLine).not.toBeNull();
    expect(bodyLines).toHaveLength(2);
    expect(endLine).not.toBeNull();

    const beginSlot = beginLine?.querySelector('.cm-code-block-live-leading-slot');
    const firstBodySlot = bodyLines[0]?.querySelector('.cm-code-block-live-leading-slot');
    const secondBodySlot = bodyLines[1]?.querySelector('.cm-code-block-live-leading-slot');
    const endSlot = endLine?.querySelector('.cm-code-block-live-leading-slot');

    const getGutterClass = (element: Element | null | undefined) =>
      Array.from(element?.classList ?? []).find((className) =>
        className.startsWith('cm-code-block-live-gutter-'),
      );

    expect(beginSlot?.textContent?.trim()).toBe('');
    expect(firstBodySlot?.textContent).toBe('1');
    expect(secondBodySlot?.textContent).toBe('2');
    expect(endSlot?.textContent?.trim()).toBe('');
    expect(getGutterClass(beginLine)).toBe(getGutterClass(bodyLines[0] ?? null));
    expect(getGutterClass(endLine)).toBe(getGutterClass(bodyLines[0] ?? null));
  });

  it('keeps live preview code block shell theming stable across light dark and custom editor themes', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '```ts\nconst themed = true\n```',
        livePreview: true,
        theme: 'light',
        codeTheme: 'auto',
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    const getBodyLine = () => wrapper.find('.cm-line.cm-code-block-live-body');
    expect(getBodyLine().exists()).toBe(true);
    expect(getComputedStyle(getBodyLine().element).backgroundColor).toBe('rgb(246, 248, 250)');

    await wrapper.setProps({ theme: 'dark' });
    await nextTick();

    expect(getComputedStyle(getBodyLine().element).backgroundColor).toBe('rgb(0, 43, 54)');

    await wrapper.setProps({
      theme: {
        type: 'dark',
        content: {
          link: {
            color: '#f59e0b',
          },
        },
      },
    });
    await nextTick();

    expect(getComputedStyle(getBodyLine().element).backgroundColor).toBe('rgb(0, 43, 54)');
  });

  it('hides the old pseudo-element line numbers and keeps wrapped code lines aligned to the body column', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue:
          '```js\nconst veryLongValue = "This line is intentionally long so the wrapped alignment rule stays under test."\n```',
        livePreview: true,
        codeLineNumbers: true,
        lineWrap: true,
      },
      attachTo: document.body,
    });

    try {
      await getEditorView(wrapper);
      await nextTick();

      expect(wrapper.element.querySelector('.cm-lineWrapping')).not.toBeNull();
      expect(wrapper.element.querySelector('.cm-code-block-live-leading-slot')).not.toBeNull();

      const hiddenBeforeRules = getCssRulesContaining(
        '.cm-line.cm-code-block-live-shell.cm-code-block-line[data-code-line-number]::before',
      );
      const shellRules = getCssRulesContaining('.cm-line.cm-code-block-live-shell');
      const slotRules = getCssRulesContaining('.cm-code-block-live-leading-slot');
      const themedSlotRules = getCssRulesContaining(
        '.cm-line.cm-code-block-live-shell .cm-code-block-live-leading-slot',
      );

      expect(hiddenBeforeRules.some((text) => text.includes('display: none'))).toBe(true);
      expect(
        shellRules.some((text) =>
          text.includes(
            'padding-left: calc(var(--cm-code-block-live-content-padding, 0.75rem) + var(--cm-code-block-live-gutter-width, 0px) + var(--cm-code-block-live-gutter-gap, 0.5rem))',
          ),
        ),
      ).toBe(true);
      expect(
        shellRules.some((text) =>
          text.includes('margin-left: var(--cm-code-block-live-inline-inset, 0.5rem)'),
        ),
      ).toBe(true);
      expect(
        shellRules.some((text) =>
          text.includes('margin-right: var(--cm-code-block-live-inline-inset, 0.5rem)'),
        ),
      ).toBe(true);
      expect(slotRules.some((text) => text.includes('font-size: 0.9em'))).toBe(true);
      expect(slotRules.some((text) => text.includes('align-items: flex-start'))).toBe(true);
      expect(slotRules.some((text) => text.includes('line-height: inherit'))).toBe(true);
      expect(slotRules.some((text) => text.includes('font-variant-numeric: tabular-nums'))).toBe(
        true,
      );
      expect(
        slotRules.some((text) =>
          text.includes('ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'),
        ),
      ).toBe(true);
      expect(slotRules.some((text) => text.includes('--una-code-font-family'))).toBe(false);
      expect(slotRules.some((text) => text.includes('position: absolute'))).toBe(true);
      expect(slotRules.some((text) => text.includes('left: 0'))).toBe(true);
      expect(
        slotRules.some((text) =>
          text.includes('padding-left: var(--cm-code-block-live-content-padding, 0.75rem)'),
        ),
      ).toBe(true);
      expect(slotRules.some((text) => text.includes('padding-right: 0.32rem'))).toBe(true);
      expect(
        slotRules.some((text) =>
          text.includes('width: calc(var(--cm-code-block-live-content-padding, 0.75rem) + 1.5rem)'),
        ),
      ).toBe(true);
      expect(slotRules.some((text) => text.includes('border-right'))).toBe(false);
      expect(shellRules.some((text) => text.includes('box-shadow'))).toBe(true);
      expect(themedSlotRules.some((text) => text.includes('background-color'))).toBe(true);
    } finally {
      wrapper.unmount();
    }
  });

  it('keeps copy clicks inactive and restores raw fences when entering leaving and selecting across a code block', async () => {
    const originalClipboard = (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const markdown = 'before\n```js\nconsole.log("Hello")\n```\nafter';
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: markdown,
        livePreview: true,
        codeLineNumbers: true,
      },
      attachTo: document.body,
    });

    try {
      const view = await getEditorView(wrapper);
      await nextTick();

      const getBeginLine = () => wrapper.element.querySelector('.cm-line.cm-code-block-live-begin');
      const getEndLine = () => wrapper.element.querySelector('.cm-line.cm-code-block-live-end');

      const button = wrapper.element.querySelector(
        '.cm-code-block-copy-button',
      ) as HTMLButtonElement | null;
      expect(button).not.toBeNull();

      button?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await nextTick();

      expect(writeText).toHaveBeenCalledWith('console.log("Hello")');
      expect(getBeginLine()?.textContent).not.toContain('```js');

      const headerRow = wrapper.element.querySelector('.cm-code-block-header-row');
      expect(headerRow).not.toBeNull();
      headerRow?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      await nextTick();

      expect(getBeginLine()?.textContent).toContain('```js');
      expect(getEndLine()?.textContent).toContain('```');

      const blockStart = markdown.indexOf('```js');
      const blockEnd = markdown.lastIndexOf('```') + 3;
      view.dispatch({
        selection: {
          anchor: blockStart,
          head: blockEnd,
        },
      });
      await nextTick();

      expect(getBeginLine()?.textContent).toContain('```js');

      view.dispatch({
        selection: {
          anchor: markdown.indexOf('after') + 1,
        },
      });
      await nextTick();

      expect(getBeginLine()?.textContent).not.toContain('```js');
      expect(wrapper.element.querySelector('.cm-code-block-header-row')).not.toBeNull();
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
      wrapper.unmount();
    }
  });

  it('keeps gutter fonts independent from codeFontFamily', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: ['```ts', 'const answer = 42', '```'].join('\n'),
        livePreview: true,
        lineNumbers: true,
        codeLineNumbers: true,
        codeFontFamily: 'Fira Code, monospace',
      },
      attachTo: document.body,
    });

    try {
      await getEditorView(wrapper);
      await nextTick();

      const gutterRules = getCssRulesContaining('.cm-lineNumbers .cm-gutterElement');
      const sourceCodeLineRules = getCssRulesContaining(
        '.cm-line.cm-code-block-line[data-code-line-number]::before',
      );
      const liveSlotRules = getCssRulesContaining('.cm-code-block-live-leading-slot');

      expect(gutterRules.some((text) => text.includes('--una-code-font-family'))).toBe(false);
      expect(sourceCodeLineRules.some((text) => text.includes('--una-code-font-family'))).toBe(
        false,
      );
      expect(liveSlotRules.some((text) => text.includes('--una-code-font-family'))).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it('toggles code block line numbers at runtime', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '~~~ts\nconst x = 1;\n~~~',
        codeLineNumbers: false,
      },
    });

    await getEditorView(wrapper);
    await nextTick();

    expect(wrapper.find('.cm-code-block-fence').exists()).toBe(true);
    expect(wrapper.find('.cm-code-block-line[data-code-line-number="1"]').exists()).toBe(false);

    await wrapper.setProps({ codeLineNumbers: true });
    await nextTick();

    expect(wrapper.find('.cm-code-block-line[data-code-line-number="1"]').exists()).toBe(true);
  });
});
