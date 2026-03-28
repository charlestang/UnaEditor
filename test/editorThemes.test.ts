import { describe, expect, it } from 'vitest';
import {
  darkEditorTheme,
  lightEditorTheme,
  resolveEditorTheme,
} from '../src/themes/editorThemes';

describe('editorThemes', () => {
  it('resolves light and dark preset themes', () => {
    const light = resolveEditorTheme('light');
    const dark = resolveEditorTheme('dark');

    expect(light.type).toBe('light');
    expect(light.name).toBe(lightEditorTheme.name);
    expect(light.table.headerBackground).toBe('rgba(15, 23, 42, 0.04)');

    expect(dark.type).toBe('dark');
    expect(dark.name).toBe(darkEditorTheme.name);
    expect(dark.table.headerBackground).toBe('rgba(148, 163, 184, 0.12)');
  });

  it('merges custom overrides with preset defaults', () => {
    const theme = resolveEditorTheme({
      type: 'dark',
      content: {
        link: {
          color: '#f59e0b',
        },
      },
      table: {
        headerBackground: 'rgba(245, 158, 11, 0.12)',
      },
    });

    expect(theme.type).toBe('dark');
    expect(theme.content.link.color).toBe('#f59e0b');
    expect(theme.content.link.textDecoration).toBe('underline');
    expect(theme.content.heading1.fontSize).toBe(darkEditorTheme.content?.heading1?.fontSize);
    expect(theme.table.headerBackground).toBe('rgba(245, 158, 11, 0.12)');
  });
});
