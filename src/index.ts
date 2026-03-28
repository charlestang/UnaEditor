// Main entry point for una-editor package
export const version = __UNA_EDITOR_VERSION__;

// Export UnaEditor component
export { default as UnaEditor } from './components/UnaEditor.vue';

// Export types
export type {
  EditorTheme,
  EditorThemeContent,
  EditorThemeContentOverrides,
  EditorThemeTable,
  EditorProps,
  EditorEvents,
  EditorExposed,
  ImageRenderContext,
  ImageRenderResult,
  LinkRenderContext,
  LinkRenderResult,
  RenderHooks,
  CustomLocale,
  Locale,
} from './types/editor';

export { darkEditorTheme, lightEditorTheme } from './themes/editorThemes';

// Export locale utilities
export { locales, defaultLocale, defineLocale, zhCN, enUS } from './locales';
