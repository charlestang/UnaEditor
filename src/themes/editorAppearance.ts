import { getCodeTheme, getDefaultCodeTheme } from './codeThemes';
import { resolveEditorTheme, type ResolvedEditorTheme } from './editorThemes';
import type { CodeTheme, EditorProps } from '../types/editor';

export interface ResolvedEditorAppearance {
  editorTheme: ResolvedEditorTheme;
  codeTheme: CodeTheme;
  fontFamily?: string;
  codeFontFamily?: string;
  fontSize?: number;
  contentMaxWidth: number;
  contentThemeSignature: string;
  codeThemeSignature: string;
  layoutSignature: string;
  containerStyle: Record<string, string>;
}

interface EditorAppearanceOptions {
  theme?: EditorProps['theme'];
  codeTheme?: EditorProps['codeTheme'];
  fontFamily?: EditorProps['fontFamily'];
  codeFontFamily?: EditorProps['codeFontFamily'];
  fontSize?: EditorProps['fontSize'];
  contentMaxWidth?: EditorProps['contentMaxWidth'];
}

function resolveCodeTheme(
  codeTheme: EditorAppearanceOptions['codeTheme'],
  editorThemeType: 'light' | 'dark',
): CodeTheme {
  if (!codeTheme || codeTheme === 'auto') {
    return getDefaultCodeTheme(editorThemeType);
  }

  const resolved = getCodeTheme(codeTheme);
  if (!resolved) {
    console.warn(`Unknown code theme: ${codeTheme}, falling back to default`);
    return getDefaultCodeTheme(editorThemeType);
  }

  return resolved;
}

function createContainerStyle(input: {
  editorTheme: ResolvedEditorTheme;
  fontFamily?: string;
  codeFontFamily?: string;
  fontSize?: number;
  contentMaxWidth: number;
}): Record<string, string> {
  const style: Record<string, string> = {
    '--una-content-max-width': `${input.contentMaxWidth}px`,
    '--una-editor-surface': input.editorTheme.type === 'dark' ? '#282c34' : '#ffffff',
    '--una-table-header-bg': input.editorTheme.table.headerBackground,
  };

  if (input.fontFamily) {
    style['--una-font-family'] = input.fontFamily;
  }
  if (input.codeFontFamily) {
    style['--una-code-font-family'] = input.codeFontFamily;
  }
  if (input.fontSize !== undefined) {
    style['--una-font-size'] = `${input.fontSize}px`;
  }

  return style;
}

export function resolveEditorAppearance(
  options: EditorAppearanceOptions,
): ResolvedEditorAppearance {
  const editorTheme = resolveEditorTheme(options.theme);
  const codeTheme = resolveCodeTheme(options.codeTheme, editorTheme.type);
  const contentMaxWidth = options.contentMaxWidth ?? 720;

  return {
    editorTheme,
    codeTheme,
    fontFamily: options.fontFamily,
    codeFontFamily: options.codeFontFamily,
    fontSize: options.fontSize,
    contentMaxWidth,
    contentThemeSignature: JSON.stringify({
      type: editorTheme.type,
      content: editorTheme.content,
    }),
    codeThemeSignature: JSON.stringify({
      name: codeTheme.name,
      type: codeTheme.type,
      colors: codeTheme.colors,
    }),
    layoutSignature: JSON.stringify({
      fontFamily: options.fontFamily ?? null,
      codeFontFamily: options.codeFontFamily ?? null,
      fontSize: options.fontSize ?? null,
      contentMaxWidth,
    }),
    containerStyle: createContainerStyle({
      editorTheme,
      fontFamily: options.fontFamily,
      codeFontFamily: options.codeFontFamily,
      fontSize: options.fontSize,
      contentMaxWidth,
    }),
  };
}
