# Language Support Strategy

## Supported Languages

Based on user requirements, we need to support a wide range of languages. Here's the comprehensive list:

### Tier 1: Core Languages (Bundled by Default)

These are the most commonly used languages and will be included in the main bundle:

| Language   | Package                       | Size (gzipped)     | Priority |
| ---------- | ----------------------------- | ------------------ | -------- |
| JavaScript | `@codemirror/lang-javascript` | ~25 KB             | High     |
| TypeScript | `@codemirror/lang-javascript` | (included)         | High     |
| CSS        | `@codemirror/lang-css`        | ~15 KB             | High     |
| Markdown   | `@codemirror/lang-markdown`   | (already included) | High     |
| Shell/Bash | `@codemirror/legacy-modes`    | ~5 KB              | Medium   |

**Subtotal: ~45 KB**

### Tier 2: Extended Languages (Lazy Loaded)

These languages will be loaded on-demand when first encountered:

| Language | Package                    | Size (gzipped) | Priority |
| -------- | -------------------------- | -------------- | -------- |
| PHP      | `@codemirror/lang-php`     | ~20 KB         | Medium   |
| Go       | `@codemirror/legacy-modes` | ~8 KB          | Medium   |
| Java     | `@codemirror/lang-java`    | ~18 KB         | Medium   |
| Python   | `@codemirror/lang-python`  | ~20 KB         | Medium   |
| Rust     | `@codemirror/lang-rust`    | ~22 KB         | Low      |
| C/C++    | `@codemirror/lang-cpp`     | ~20 KB         | Low      |
| JSON     | `@codemirror/lang-json`    | ~5 KB          | Medium   |
| HTML     | `@codemirror/lang-html`    | ~15 KB         | Medium   |
| XML      | `@codemirror/lang-xml`     | ~12 KB         | Low      |
| SQL      | `@codemirror/lang-sql`     | ~15 KB         | Low      |
| YAML     | `@codemirror/legacy-modes` | ~5 KB          | Low      |

**Subtotal: ~160 KB (loaded on demand)**

### Tier 3: Additional Languages (via language-data)

All other languages supported by CodeMirror through `@codemirror/language-data`:

- Ruby, Swift, Kotlin, Scala
- Haskell, Elixir, Clojure
- Lua, Perl, R
- And 50+ more...

## Implementation Strategy

### Approach: Hybrid Loading

```typescript
// src/extensions/languageSupport.ts

import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { markdown } from '@codemirror/lang-markdown';
import { StreamLanguage } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';

// Core languages (bundled)
const CORE_LANGUAGES = {
  javascript: javascript({ jsx: true, typescript: false }),
  typescript: javascript({ jsx: true, typescript: true }),
  js: javascript({ jsx: true, typescript: false }),
  ts: javascript({ jsx: true, typescript: true }),
  jsx: javascript({ jsx: true, typescript: false }),
  tsx: javascript({ jsx: true, typescript: true }),
  css: css(),
  markdown: markdown(),
  md: markdown(),
  shell: StreamLanguage.define(shell),
  bash: StreamLanguage.define(shell),
  sh: StreamLanguage.define(shell),
};

// Extended languages (lazy loaded)
const EXTENDED_LANGUAGES = {
  php: () => import('@codemirror/lang-php').then((m) => m.php()),
  go: () => import('@codemirror/legacy-modes/mode/go').then((m) => StreamLanguage.define(m.go)),
  java: () => import('@codemirror/lang-java').then((m) => m.java()),
  python: () => import('@codemirror/lang-python').then((m) => m.python()),
  py: () => import('@codemirror/lang-python').then((m) => m.python()),
  rust: () => import('@codemirror/lang-rust').then((m) => m.rust()),
  rs: () => import('@codemirror/lang-rust').then((m) => m.rust()),
  cpp: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  c: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  json: () => import('@codemirror/lang-json').then((m) => m.json()),
  html: () => import('@codemirror/lang-html').then((m) => m.html()),
  xml: () => import('@codemirror/lang-xml').then((m) => m.xml()),
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  yaml: () =>
    import('@codemirror/legacy-modes/mode/yaml').then((m) => StreamLanguage.define(m.yaml)),
  yml: () =>
    import('@codemirror/legacy-modes/mode/yaml').then((m) => StreamLanguage.define(m.yaml)),
};

// Language cache to avoid re-loading
const languageCache = new Map<string, any>();

/**
 * Get language support for a given language name
 * Returns immediately for core languages, async for extended languages
 */
export async function getLanguageSupport(lang: string): Promise<any> {
  const normalized = lang.toLowerCase();

  // Check core languages first
  if (normalized in CORE_LANGUAGES) {
    return CORE_LANGUAGES[normalized as keyof typeof CORE_LANGUAGES];
  }

  // Check cache
  if (languageCache.has(normalized)) {
    return languageCache.get(normalized);
  }

  // Load extended language
  if (normalized in EXTENDED_LANGUAGES) {
    const loader = EXTENDED_LANGUAGES[normalized as keyof typeof EXTENDED_LANGUAGES];
    const support = await loader();
    languageCache.set(normalized, support);
    return support;
  }

  // Fallback: try language-data for other languages
  try {
    const { languages } = await import('@codemirror/language-data');
    const langData = languages.find(
      (l) =>
        l.name.toLowerCase() === normalized || l.alias?.some((a) => a.toLowerCase() === normalized),
    );

    if (langData) {
      const support = await langData.load();
      languageCache.set(normalized, support);
      return support;
    }
  } catch (error) {
    console.warn(`Failed to load language: ${lang}`, error);
  }

  return null;
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
export function isLanguageSupported(lang: string): boolean {
  const normalized = lang.toLowerCase();
  return normalized in CORE_LANGUAGES || normalized in EXTENDED_LANGUAGES;
}
```

### Integration with Markdown Parser

```typescript
// src/composables/useEditor.ts

import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { LanguageDescription } from '@codemirror/language';
import { getLanguageSupport } from '../extensions/languageSupport';

// Create language descriptions for code blocks
const codeLanguages = [
  // Core languages (immediate)
  LanguageDescription.of({
    name: 'JavaScript',
    alias: ['javascript', 'js'],
    support: javascript({ jsx: true }),
  }),
  LanguageDescription.of({
    name: 'TypeScript',
    alias: ['typescript', 'ts'],
    support: javascript({ jsx: true, typescript: true }),
  }),
  LanguageDescription.of({
    name: 'CSS',
    alias: ['css'],
    support: css(),
  }),
  // ... other core languages

  // Extended languages (lazy)
  LanguageDescription.of({
    name: 'PHP',
    alias: ['php'],
    load: async () => {
      const { php } = await import('@codemirror/lang-php');
      return php();
    },
  }),
  LanguageDescription.of({
    name: 'Go',
    alias: ['go', 'golang'],
    load: async () => {
      const { go } = await import('@codemirror/legacy-modes/mode/go');
      return StreamLanguage.define(go);
    },
  }),
  // ... other extended languages
];

// Configure markdown with code languages
markdown({
  base: markdownLanguage,
  codeLanguages,
});
```

## Bundle Size Analysis

### Current Bundle

```
Base editor:              120 KB (gzipped)
```

### With Core Languages (Tier 1)

```
Base editor:              120 KB
+ Core languages:          45 KB
─────────────────────────────────
Total:                    165 KB (gzipped)
Increase:                  37.5%
```

### With All Languages Loaded (Worst Case)

```
Base editor:              120 KB
+ Core languages:          45 KB
+ Extended languages:     160 KB
─────────────────────────────────
Total:                    325 KB (gzipped)
Increase:                 170%
```

### Realistic Usage

Most documents will only use 2-3 different languages, so typical bundle size:

```
Base editor:              120 KB
+ Core languages:          45 KB
+ 2-3 extended languages:  40-60 KB
─────────────────────────────────
Total:                    205-225 KB (gzipped)
Increase:                  70-87%
```

## Performance Optimization

### 1. Lazy Loading with Caching

````typescript
// First time loading PHP
```php
echo "Hello";
````

// → Loads @codemirror/lang-php (~20 KB)

// Second PHP block in same document

```php
echo "World";
```

// → Uses cached language support (0 KB)

````

### 2. Preloading Common Languages

```typescript
// Optionally preload languages on idle
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Preload commonly used languages
    getLanguageSupport('python');
    getLanguageSupport('java');
    getLanguageSupport('go');
  });
}
````

### 3. Code Splitting

```typescript
// Vite will automatically code-split dynamic imports
const { php } = await import('@codemirror/lang-php');
// → Creates separate chunk: lang-php.[hash].js
```

## Language Aliases

Support common aliases for better UX:

````markdown
````js → JavaScript
```javascript → JavaScript
```ts        → TypeScript
```typescript → TypeScript
```py        → Python
```python    → Python
```golang    → Go
```go        → Go
```sh        → Shell
```bash      → Shell
```shell     → Shell
```yml       → YAML
```yaml      → YAML
````
````

````

## Fallback Behavior

When language is not recognized:

```markdown
```unknownlang
code here
````

````

Options:
1. **No highlighting** - Show as plain text with code font
2. **Generic highlighting** - Basic keyword/string/comment detection
3. **Show warning** - Console warning about unsupported language

**Recommendation**: Option 1 (no highlighting) for clean UX

## Testing Strategy

### Language Coverage Tests

```typescript
describe('Language Support', () => {
  const testCases = [
    { lang: 'javascript', code: 'const x = 1;' },
    { lang: 'typescript', code: 'const x: number = 1;' },
    { lang: 'css', code: '.class { color: red; }' },
    { lang: 'php', code: '<?php echo "hi"; ?>' },
    { lang: 'go', code: 'func main() {}' },
    { lang: 'java', code: 'public class Main {}' },
    { lang: 'shell', code: 'echo "hello"' },
  ];

  testCases.forEach(({ lang, code }) => {
    it(`should highlight ${lang}`, async () => {
      const support = await getLanguageSupport(lang);
      expect(support).toBeDefined();
      // Assert syntax tokens are generated
    });
  });
});
````

### Performance Tests

```typescript
describe('Language Loading Performance', () => {
  it('should load core languages synchronously', () => {
    const start = performance.now();
    getLanguageSupport('javascript');
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1); // < 1ms
  });

  it('should cache loaded languages', async () => {
    await getLanguageSupport('php'); // First load
    const start = performance.now();
    await getLanguageSupport('php'); // Second load
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1); // < 1ms (cached)
  });
});
```

## User Documentation

### Supported Languages

Document all supported languages in README:

```markdown
## Supported Languages

Una Editor supports syntax highlighting for 60+ programming languages:

### Core Languages (Always Available)

- JavaScript/TypeScript (including JSX/TSX)
- CSS/SCSS/Less
- Markdown
- Shell/Bash

### Extended Languages (Loaded on Demand)

- PHP
- Go
- Java
- Python
- Rust
- C/C++
- JSON
- HTML/XML
- SQL
- YAML
- And 50+ more...

### Usage

Simply specify the language in your fenced code block:

\`\`\`typescript
const greeting: string = "Hello, World!";
\`\`\`
```

## Migration Notes

### For Existing Users

No breaking changes:

- Existing code blocks continue to work
- Syntax highlighting is automatic when language is specified
- No action required from users

### For New Users

Just specify language in code blocks:

```markdown
Before (no highlighting):
```

code here

````

After (with highlighting):
```typescript
code here
````

````

## Future Enhancements

### Phase 2 Features

1. **Custom Language Registration**
   ```typescript
   editor.registerLanguage('mylang', myLangSupport);
````

2. **Language Auto-Detection**

   ```markdown

   ```

   // Auto-detect as JavaScript
   const x = 1;

   ```

   ```

3. **Syntax Error Highlighting**
   - Show syntax errors in code blocks
   - Optional linting integration

4. **Code Block Metadata**
   ````markdown
   ```typescript:filename.ts:5-10
   // Start from line 5, show lines 5-10
   ```
   ````
   ```

   ```
