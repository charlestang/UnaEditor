import type { EditorView } from '@codemirror/view';

// Code theme names
export type CodeThemeName =
  // Dark themes
  | 'one-dark'
  | 'dracula'
  | 'monokai'
  | 'solarized-dark'
  | 'nord'
  | 'tokyo-night'
  // Light themes
  | 'github-light'
  | 'solarized-light'
  | 'atom-one-light';

// Code theme color definitions
export interface CodeThemeColors {
  background: string;
  foreground: string;
  selection: string;
  lineNumber: string;
  keyword: string;
  function: string;
  string: string;
  number: string;
  comment: string;
  operator: string;
  variable: string;
  type: string;
  // Additional token types
  constant?: string;
  property?: string;
  tag?: string;
  attribute?: string;
  regexp?: string;
  escape?: string;
}

// Code theme structure
export interface CodeTheme {
  name: string;
  type: 'light' | 'dark';
  colors: CodeThemeColors;
}

// Editor component props
export interface EditorProps {
  modelValue: string;
  lineNumbers?: boolean;
  lineWrap?: boolean;
  livePreview?: boolean;
  vimMode?: boolean;
  locale?: string | CustomLocale;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  theme?: 'light' | 'dark';
  fontFamily?: string;
  codeFontFamily?: string;
  fontSize?: number;

  /**
   * Code block theme
   * - 'auto': Follow editor theme
   * - CodeThemeName: Use specified color scheme
   * @default 'auto'
   */
  codeTheme?: 'auto' | CodeThemeName;

  /**
   * Show line numbers in code blocks
   * @default false
   */
  codeLineNumbers?: boolean;
}

// Editor component events
export interface EditorEvents {
  'update:modelValue': (value: string) => void;
  change: (value: string) => void;
  save: () => void;
  focus: () => void;
  blur: () => void;
  drop: (files: File[]) => void;
}

// Heading structure for TOC extraction
export interface Heading {
  text: string;
  level: number;
  line: number;
}

// Editor exposed methods
export interface EditorExposed {
  focus: () => void;
  getSelection: () => string;
  toggleFullscreen: (mode?: 'browser' | 'screen') => void;
  exitFullscreen: () => void;
  getEditorView: () => EditorView | undefined;
  insertText: (text: string) => void;
  getHeadings: () => Heading[];
  scrollToLine: (lineNumber: number) => void;
}

// Locale types
export interface CustomLocale {
  [key: string]: string;
}

export type Locale = 'zh-CN' | 'en-US' | CustomLocale;
