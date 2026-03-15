import type { EditorView } from '@codemirror/view';

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
