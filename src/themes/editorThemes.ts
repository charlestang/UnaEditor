import type { Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import type { EditorTheme, EditorThemeContent, EditorThemeTable } from '../types/editor';

export interface ResolvedEditorTheme {
  name: string;
  type: 'light' | 'dark';
  chrome: Extension;
  content: EditorThemeContent;
  table: EditorThemeTable;
}

export const lightEditorTheme: EditorTheme = {
  name: 'Light',
  type: 'light',
  content: {
    heading1: { fontSize: '1.875em', fontWeight: '700', lineHeight: '1.25' },
    heading2: { fontSize: '1.5em', fontWeight: '700', lineHeight: '1.3' },
    heading3: { fontSize: '1.25em', fontWeight: '700', lineHeight: '1.35' },
    heading4: { fontSize: '1em', fontWeight: '700', lineHeight: '1.4' },
    heading5: { fontSize: '1em', fontWeight: '700', lineHeight: '1.4' },
    heading6: { fontSize: '1em', fontWeight: '700', lineHeight: '1.4' },
    link: {
      color: '#0b57d0',
      textDecoration: 'underline',
      textUnderlineOffset: '0.18em',
    },
    emphasis: { fontStyle: 'italic' },
    strong: { fontWeight: '700' },
    inlineCode: {
      backgroundColor: 'rgba(15, 23, 42, 0.08)',
      borderRadius: '4px',
      padding: '0.1em 0.3em',
    },
    blockquote: {
      borderColor: 'rgba(100, 116, 139, 0.5)',
      backgroundColor: 'rgba(148, 163, 184, 0.08)',
      paddingLeft: '0.75rem',
      fontStyle: 'italic',
    },
    syntaxMark: { color: '#6b7280' },
    listMarker: { color: 'rgba(100, 116, 139, 0.9)' },
    taskCheckbox: { accentColor: '#14b8a6' },
  },
  table: {
    headerBackground: 'rgba(15, 23, 42, 0.04)',
  },
};

export const darkEditorTheme: EditorTheme = {
  name: 'Dark',
  type: 'dark',
  content: {
    heading1: { fontSize: '1.875em', fontWeight: '700', lineHeight: '1.25' },
    heading2: { fontSize: '1.5em', fontWeight: '700', lineHeight: '1.3' },
    heading3: { fontSize: '1.25em', fontWeight: '700', lineHeight: '1.35' },
    heading4: { fontSize: '1em', fontWeight: '700', lineHeight: '1.4' },
    heading5: { fontSize: '1em', fontWeight: '700', lineHeight: '1.4' },
    heading6: { fontSize: '1em', fontWeight: '700', lineHeight: '1.4' },
    link: {
      color: '#8ab4f8',
      textDecoration: 'underline',
      textUnderlineOffset: '0.18em',
    },
    emphasis: { fontStyle: 'italic' },
    strong: { fontWeight: '700' },
    inlineCode: {
      backgroundColor: 'rgba(148, 163, 184, 0.18)',
      borderRadius: '4px',
      padding: '0.1em 0.3em',
    },
    blockquote: {
      borderColor: 'rgba(148, 163, 184, 0.38)',
      backgroundColor: 'rgba(148, 163, 184, 0.12)',
      paddingLeft: '0.75rem',
      fontStyle: 'italic',
    },
    syntaxMark: { color: '#9aa5ce' },
    listMarker: { color: 'rgba(148, 163, 184, 0.9)' },
    taskCheckbox: { accentColor: '#2dd4bf' },
  },
  table: {
    headerBackground: 'rgba(148, 163, 184, 0.12)',
  },
};

const NO_CHROME_THEME: Extension = [];

const PRESET_CHROME: Record<'light' | 'dark', Extension> = {
  light: NO_CHROME_THEME,
  dark: oneDark,
};

function mergeContent(
  base: EditorThemeContent,
  overrides?: EditorTheme['content'],
): EditorThemeContent {
  return {
    heading1: { ...base.heading1, ...overrides?.heading1 },
    heading2: { ...base.heading2, ...overrides?.heading2 },
    heading3: { ...base.heading3, ...overrides?.heading3 },
    heading4: { ...base.heading4, ...overrides?.heading4 },
    heading5: { ...base.heading5, ...overrides?.heading5 },
    heading6: { ...base.heading6, ...overrides?.heading6 },
    link: { ...base.link, ...overrides?.link },
    emphasis: { ...base.emphasis, ...overrides?.emphasis },
    strong: { ...base.strong, ...overrides?.strong },
    inlineCode: { ...base.inlineCode, ...overrides?.inlineCode },
    blockquote: { ...base.blockquote, ...overrides?.blockquote },
    syntaxMark: { ...base.syntaxMark, ...overrides?.syntaxMark },
    listMarker: { ...base.listMarker, ...overrides?.listMarker },
    taskCheckbox: { ...base.taskCheckbox, ...overrides?.taskCheckbox },
  };
}

function mergeTable(base: EditorThemeTable, overrides?: EditorTheme['table']): EditorThemeTable {
  return {
    ...base,
    ...overrides,
  };
}

function getPresetTheme(type: 'light' | 'dark'): EditorTheme {
  return type === 'dark' ? darkEditorTheme : lightEditorTheme;
}

export function resolveEditorTheme(
  theme: 'light' | 'dark' | EditorTheme | undefined,
): ResolvedEditorTheme {
  if (theme === 'dark' || theme === 'light' || !theme) {
    const type = theme ?? 'light';
    const preset = getPresetTheme(type);

    return {
      name: preset.name ?? (type === 'dark' ? 'Dark' : 'Light'),
      type,
      chrome: PRESET_CHROME[type],
      content: mergeContent(getPresetTheme(type).content as EditorThemeContent),
      table: mergeTable(getPresetTheme(type).table as EditorThemeTable),
    };
  }

  const preset = getPresetTheme(theme.type);

  return {
    name: theme.name ?? preset.name ?? (theme.type === 'dark' ? 'Dark' : 'Light'),
    type: theme.type,
    chrome: PRESET_CHROME[theme.type],
    content: mergeContent(preset.content as EditorThemeContent, theme.content),
    table: mergeTable(preset.table as EditorThemeTable, theme.table),
  };
}
