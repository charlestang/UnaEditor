// Editor component props
export interface EditorProps {
  modelValue: string
  language?: string
  lineNumbers?: boolean
  hybridMarkdown?: boolean
  vimMode?: boolean
  locale?: string | CustomLocale
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  theme?: 'light' | 'dark'
}

// Editor component events
export interface EditorEvents {
  'update:modelValue': (value: string) => void
  change: (value: string) => void
  save: () => void
  focus: () => void
  blur: () => void
  drop: (files: File[]) => void
}

// Editor exposed methods
export interface EditorExposed {
  focus: () => void
  getSelection: () => string
  toggleFullscreen: (mode?: 'browser' | 'screen') => void
  exitFullscreen: () => void
}

// Locale types
export interface CustomLocale {
  [key: string]: string
}

export type Locale = 'zh-CN' | 'en-US' | CustomLocale
