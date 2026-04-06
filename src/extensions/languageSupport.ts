import { LanguageDescription, LanguageSupport } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { StreamLanguage } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';

// Language cache to avoid re-creating language supports
const languageCache = new Map<string, LanguageSupport>();

// Core languages (loaded synchronously)
const CORE_LANGUAGES: Record<string, () => LanguageSupport> = {
  javascript: () => javascript(),
  js: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  ts: () => javascript({ typescript: true }),
  jsx: () => javascript({ jsx: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  css: () => css(),
  html: () => html(),
  shell: () => new LanguageSupport(StreamLanguage.define(shell)),
  bash: () => new LanguageSupport(StreamLanguage.define(shell)),
  sh: () => new LanguageSupport(StreamLanguage.define(shell)),
};

// Extended languages (loaded lazily)
const EXTENDED_LANGUAGES: Record<string, () => Promise<LanguageSupport>> = {
  python: async () => {
    const { python } = await import('@codemirror/lang-python');
    return python();
  },
  py: async () => {
    const { python } = await import('@codemirror/lang-python');
    return python();
  },
  php: async () => {
    const { php } = await import('@codemirror/lang-php');
    return php();
  },
  java: async () => {
    const { java } = await import('@codemirror/lang-java');
    return java();
  },
  go: async () => {
    const { StreamLanguage } = await import('@codemirror/language');
    const { go } = await import('@codemirror/legacy-modes/mode/go');
    return new LanguageSupport(StreamLanguage.define(go));
  },
  rust: async () => {
    const { StreamLanguage } = await import('@codemirror/language');
    const { rust } = await import('@codemirror/legacy-modes/mode/rust');
    return new LanguageSupport(StreamLanguage.define(rust));
  },
  c: async () => {
    const { StreamLanguage } = await import('@codemirror/language');
    const { c } = await import('@codemirror/legacy-modes/mode/clike');
    return new LanguageSupport(StreamLanguage.define(c));
  },
  cpp: async () => {
    const { StreamLanguage } = await import('@codemirror/language');
    const { cpp } = await import('@codemirror/legacy-modes/mode/clike');
    return new LanguageSupport(StreamLanguage.define(cpp));
  },
  'c++': async () => {
    const { StreamLanguage } = await import('@codemirror/language');
    const { cpp } = await import('@codemirror/legacy-modes/mode/clike');
    return new LanguageSupport(StreamLanguage.define(cpp));
  },
};

const LANGUAGE_DISPLAY_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  css: 'CSS',
  html: 'HTML',
  shell: 'Shell',
  bash: 'Shell',
  sh: 'Shell',
  python: 'Python',
  py: 'Python',
  php: 'PHP',
  java: 'Java',
  go: 'Go',
  rust: 'Rust',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
};

const LANGUAGE_CANONICAL_IDS: Record<string, string> = {
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  css: 'css',
  html: 'html',
  shell: 'shell',
  bash: 'shell',
  sh: 'shell',
  python: 'python',
  py: 'python',
  php: 'php',
  java: 'java',
  go: 'go',
  rust: 'rust',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
};

export function normalizeLanguageIdentifier(language: string): string | undefined {
  const normalized = language.trim().toLowerCase();
  if (!normalized) return undefined;
  return LANGUAGE_CANONICAL_IDS[normalized] ?? normalized;
}

export function getLanguageDisplayLabel(language: string): string | undefined {
  const normalized = language.trim().toLowerCase();
  if (!normalized) return undefined;
  return LANGUAGE_DISPLAY_LABELS[normalized];
}

/**
 * Get language support for a given language name
 * @param language - Language name (e.g., 'typescript', 'python')
 * @returns Language support or undefined if not supported
 */
export async function getLanguageSupport(language: string): Promise<LanguageSupport | undefined> {
  const normalizedLang = normalizeLanguageIdentifier(language) ?? language.toLowerCase();

  // Check cache first
  if (languageCache.has(normalizedLang)) {
    return languageCache.get(normalizedLang);
  }

  // Try core languages (synchronous)
  if (CORE_LANGUAGES[normalizedLang]) {
    const support = CORE_LANGUAGES[normalizedLang]();
    languageCache.set(normalizedLang, support);
    return support;
  }

  // Try extended languages (asynchronous)
  if (EXTENDED_LANGUAGES[normalizedLang]) {
    const support = await EXTENDED_LANGUAGES[normalizedLang]();
    languageCache.set(normalizedLang, support);
    return support;
  }

  return undefined;
}

/**
 * Get list of all supported languages
 */
export function getSupportedLanguages(): string[] {
  return [...Object.keys(CORE_LANGUAGES), ...Object.keys(EXTENDED_LANGUAGES)];
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
  const normalizedLang = normalizeLanguageIdentifier(language) ?? language.toLowerCase();
  return normalizedLang in CORE_LANGUAGES || normalizedLang in EXTENDED_LANGUAGES;
}

/**
 * Create LanguageDescription array for markdown codeLanguages
 */
export function createLanguageDescriptions(): LanguageDescription[] {
  const descriptions: LanguageDescription[] = [];

  // Add core languages
  for (const [name, loader] of Object.entries(CORE_LANGUAGES)) {
    descriptions.push(
      LanguageDescription.of({
        name,
        support: loader(),
      }),
    );
  }

  // Add extended languages
  for (const [name, loader] of Object.entries(EXTENDED_LANGUAGES)) {
    descriptions.push(
      LanguageDescription.of({
        name,
        load: loader,
      }),
    );
  }

  return descriptions;
}
