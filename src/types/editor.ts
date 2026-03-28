import type { EditorView } from '@codemirror/view';

/**
 * Shared document position for render hook contexts.
 */
export interface RenderHookPosition {
  from: number;
  to: number;
}

/**
 * Inline style object accepted by render hooks.
 */
export interface RenderHookStyle {
  [property: string]: string;
}

/**
 * Dataset object accepted by render hooks.
 */
export interface RenderHookDataset {
  [key: string]: string;
}

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

/**
 * Context passed to image render hooks.
 */
export interface ImageRenderContext {
  src: string;
  alt: string;
  title?: string;
  raw: string;
  position: RenderHookPosition;
}

/**
 * Partial render result returned from image render hooks.
 */
export interface ImageRenderResult {
  src: string;
  className?: string;
  dataset?: RenderHookDataset;
  style?: RenderHookStyle;
}

/**
 * Context passed to link render hooks.
 */
export interface LinkRenderContext {
  href: string;
  text: string;
  title?: string;
  raw: string;
  position: RenderHookPosition;
}

/**
 * Partial render result returned from link render hooks.
 */
export interface LinkRenderResult {
  href: string;
  className?: string;
  dataset?: RenderHookDataset;
  style?: RenderHookStyle;
}

/**
 * Optional render-time hooks for live preview elements.
 */
export interface RenderHooks {
  image?: (context: ImageRenderContext) => Partial<ImageRenderResult> | void;
  link?: (context: LinkRenderContext) => Partial<LinkRenderResult> | void;
}

// Editor component props
export interface EditorProps {
  modelValue: string;
  lineNumbers?: boolean;
  lineWrap?: boolean;
  livePreview?: boolean;
  renderHooks?: RenderHooks;
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
  undoHistory: () => boolean;
  redoHistory: () => boolean;
}

// Locale types
export interface CustomLocale {
  [key: string]: string;
}

export type Locale = 'zh-CN' | 'en-US' | CustomLocale;
