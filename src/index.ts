// Main entry point for una-editor package
export const version = '0.1.0';

// Export UnaEditor component
export { default as UnaEditor } from './components/UnaEditor.vue';

// Export types
export type {
  EditorProps,
  EditorEvents,
  EditorExposed,
  CustomLocale,
  Locale,
} from './types/editor';

// Export locale utilities
export { locales, defaultLocale, defineLocale, zhCN, enUS } from './locales';
