import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { EditorView } from '@codemirror/view';
import UnaEditor from '../src/components/UnaEditor.vue';
import { getCodeTheme, getDefaultCodeTheme } from '../src/themes/codeThemes';
import { getSupportedLanguages, isLanguageSupported } from '../src/extensions/languageSupport';

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

describe('Code Block Syntax Highlighting', () => {
  describe('Theme System', () => {
    it('should get theme by name', () => {
      const theme = getCodeTheme('dracula');
      expect(theme).toBeDefined();
      expect(theme?.name).toBe('Dracula');
      expect(theme?.type).toBe('dark');
      expect(theme?.colors.background).toBe('#282a36');
    });

    it('should return undefined for unknown theme', () => {
      const theme = getCodeTheme('unknown-theme');
      expect(theme).toBeUndefined();
    });

    it('should get default theme for dark editor', () => {
      const theme = getDefaultCodeTheme('dark');
      expect(theme).toBeDefined();
      expect(theme.name).toBe('One Dark');
      expect(theme.type).toBe('dark');
    });

    it('should get default theme for light editor', () => {
      const theme = getDefaultCodeTheme('light');
      expect(theme).toBeDefined();
      expect(theme.name).toBe('GitHub Light');
      expect(theme.type).toBe('light');
    });

    it('should have all 9 themes available', () => {
      const themeNames = [
        'one-dark',
        'dracula',
        'monokai',
        'solarized-dark',
        'nord',
        'tokyo-night',
        'github-light',
        'solarized-light',
        'atom-one-light',
      ];

      themeNames.forEach((name) => {
        const theme = getCodeTheme(name);
        expect(theme).toBeDefined();
        expect(theme?.colors).toBeDefined();
        expect(theme?.colors.background).toBeTruthy();
        expect(theme?.colors.foreground).toBeTruthy();
        expect(theme?.colors.keyword).toBeTruthy();
      });
    });
  });

  describe('Language Support', () => {
    it('should support core languages', () => {
      expect(isLanguageSupported('javascript')).toBe(true);
      expect(isLanguageSupported('typescript')).toBe(true);
      expect(isLanguageSupported('css')).toBe(true);
      expect(isLanguageSupported('shell')).toBe(true);
    });

    it('should support language aliases', () => {
      expect(isLanguageSupported('js')).toBe(true);
      expect(isLanguageSupported('ts')).toBe(true);
      expect(isLanguageSupported('tsx')).toBe(true);
      expect(isLanguageSupported('bash')).toBe(true);
    });

    it('should support extended languages', () => {
      expect(isLanguageSupported('python')).toBe(true);
      expect(isLanguageSupported('php')).toBe(true);
      expect(isLanguageSupported('java')).toBe(true);
      expect(isLanguageSupported('go')).toBe(true);
      expect(isLanguageSupported('rust')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(isLanguageSupported('unknown')).toBe(false);
      expect(isLanguageSupported('foobar')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isLanguageSupported('JavaScript')).toBe(true);
      expect(isLanguageSupported('PYTHON')).toBe(true);
      expect(isLanguageSupported('TypeScript')).toBe(true);
    });

    it('should return list of supported languages', () => {
      const languages = getSupportedLanguages();
      expect(languages).toBeInstanceOf(Array);
      expect(languages.length).toBeGreaterThan(0);
      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
      expect(languages).toContain('typescript');
    });
  });

  describe('Code Block Line Numbers', () => {
    it('should display line numbers when codeLineNumbers is true', async () => {
      const wrapper = mount(UnaEditor, {
        props: {
          modelValue: '```ts\nconst a = 1;\nconst b = 2;\n```',
          codeLineNumbers: true,
        },
      });

      await getEditorView(wrapper);
      await nextTick();

      expect(wrapper.find('.cm-code-block-line[data-code-line-number="1"]').exists()).toBe(true);
      expect(wrapper.find('.cm-code-block-line[data-code-line-number="2"]').exists()).toBe(true);
    });

    it('should not display line numbers when codeLineNumbers is false', async () => {
      const wrapper = mount(UnaEditor, {
        props: {
          modelValue: '```ts\nconst a = 1;\n```',
          codeLineNumbers: false,
        },
      });

      await getEditorView(wrapper);
      await nextTick();

      expect(wrapper.find('.cm-code-block-line').exists()).toBe(true);
      expect(wrapper.find('.cm-code-block-line[data-code-line-number]').exists()).toBe(false);
    });

    it('should exclude fence markers from line numbering', async () => {
      const wrapper = mount(UnaEditor, {
        props: {
          modelValue: '```ts\nline one\nline two\n```',
          codeLineNumbers: true,
        },
      });

      await getEditorView(wrapper);
      await nextTick();

      // Fence lines should have cm-code-block-fence, not cm-code-block-line
      expect(wrapper.find('.cm-code-block-fence').exists()).toBe(true);
      // Fence lines should not have line numbers
      expect(wrapper.find('.cm-code-block-fence[data-code-line-number]').exists()).toBe(false);
      // Content lines should have line numbers starting from 1
      expect(wrapper.find('.cm-code-block-line[data-code-line-number="1"]').exists()).toBe(true);
      expect(wrapper.find('.cm-code-block-line[data-code-line-number="2"]').exists()).toBe(true);
    });

    it('should work alongside syntax highlighting', async () => {
      const wrapper = mount(UnaEditor, {
        props: {
          modelValue: '```ts\nconst x = 1;\n```',
          codeLineNumbers: true,
          codeTheme: 'dracula',
        },
      });

      await getEditorView(wrapper);
      await nextTick();

      // Both line numbers and code block line class should be present
      const codeLine = wrapper.find('.cm-code-block-line[data-code-line-number="1"]');
      expect(codeLine.exists()).toBe(true);
      // Code block fence should also be present
      expect(wrapper.find('.cm-code-block-fence').exists()).toBe(true);
    });
  });
});
