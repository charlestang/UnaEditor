# Code Block Theme System

## Overview

The code block theme system provides rich color scheme support beyond simple light/dark modes. Users can choose from popular color schemes like Dracula, Solarized, Monokai, etc.

## Theme Architecture

````
Theme Hierarchy
┌─────────────────────────────────────────────────┐
│ Editor Theme (theme prop)                       │
│  ├─ Controls: Editor background, text, UI      │
│  └─ Examples: 'light', 'dark'                   │
├─────────────────────────────────────────────────┤
│ Code Block Theme (codeTheme prop)              │
│  ├─ Controls: Code block colors only           │
│  ├─ Independent from editor theme              │
│  └─ Examples: 'dracula', 'solarized-dark'      │
└─────────────────────────────────────────────────┘

Visual Example:
┌─────────────────────────────────────────────────┐
│ Editor: One Dark (dark)                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ # Markdown content                          │ │
│ │                                             │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ ```typescript                           │ │ │
│ │ │ Code Block: Dracula theme               │ │ │
│ │ │ (Purple/Pink/Cyan colors)               │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
````

## Supported Color Schemes

### Dark Themes

#### 1. One Dark (Default Dark)

```typescript
{
  name: 'one-dark',
  type: 'dark',
  colors: {
    background: '#282c34',
    foreground: '#abb2bf',
    selection: '#3e4451',
    lineNumber: '#636d83',
    keyword: '#c678dd',      // Purple
    function: '#61afef',     // Blue
    string: '#98c379',       // Green
    number: '#d19a66',       // Orange
    comment: '#5c6370',      // Gray
    operator: '#56b6c2',     // Cyan
    variable: '#e06c75',     // Red
    type: '#e5c07b',         // Yellow
  }
}
```

#### 2. Dracula

```typescript
{
  name: 'dracula',
  type: 'dark',
  colors: {
    background: '#282a36',
    foreground: '#f8f8f2',
    selection: '#44475a',
    lineNumber: '#6272a4',
    keyword: '#ff79c6',      // Pink
    function: '#50fa7b',     // Green
    string: '#f1fa8c',       // Yellow
    number: '#bd93f9',       // Purple
    comment: '#6272a4',      // Blue-gray
    operator: '#ff79c6',     // Pink
    variable: '#f8f8f2',     // White
    type: '#8be9fd',         // Cyan
  }
}
```

#### 3. Solarized Dark

```typescript
{
  name: 'solarized-dark',
  type: 'dark',
  colors: {
    background: '#002b36',
    foreground: '#839496',
    selection: '#073642',
    lineNumber: '#586e75',
    keyword: '#859900',      // Green
    function: '#268bd2',     // Blue
    string: '#2aa198',       // Cyan
    number: '#d33682',       // Magenta
    comment: '#586e75',      // Gray
    operator: '#859900',     // Green
    variable: '#b58900',     // Yellow
    type: '#cb4b16',         // Orange
  }
}
```

#### 4. Monokai

```typescript
{
  name: 'monokai',
  type: 'dark',
  colors: {
    background: '#272822',
    foreground: '#f8f8f2',
    selection: '#49483e',
    lineNumber: '#90908a',
    keyword: '#f92672',      // Pink
    function: '#a6e22e',     // Green
    string: '#e6db74',       // Yellow
    number: '#ae81ff',       // Purple
    comment: '#75715e',      // Gray
    operator: '#f92672',     // Pink
    variable: '#f8f8f2',     // White
    type: '#66d9ef',         // Cyan
  }
}
```

#### 5. Nord

```typescript
{
  name: 'nord',
  type: 'dark',
  colors: {
    background: '#2e3440',
    foreground: '#d8dee9',
    selection: '#434c5e',
    lineNumber: '#4c566a',
    keyword: '#81a1c1',      // Blue
    function: '#88c0d0',     // Cyan
    string: '#a3be8c',       // Green
    number: '#b48ead',       // Purple
    comment: '#616e88',      // Gray
    operator: '#81a1c1',     // Blue
    variable: '#d8dee9',     // White
    type: '#8fbcbb',         // Teal
  }
}
```

#### 6. Tokyo Night

```typescript
{
  name: 'tokyo-night',
  type: 'dark',
  colors: {
    background: '#1a1b26',
    foreground: '#a9b1d6',
    selection: '#283457',
    lineNumber: '#565f89',
    keyword: '#bb9af7',      // Purple
    function: '#7aa2f7',     // Blue
    string: '#9ece6a',       // Green
    number: '#ff9e64',       // Orange
    comment: '#565f89',      // Gray
    operator: '#89ddff',     // Cyan
    variable: '#f7768e',     // Red
    type: '#2ac3de',         // Cyan
  }
}
```

### Light Themes

#### 1. GitHub Light (Default Light)

```typescript
{
  name: 'github-light',
  type: 'light',
  colors: {
    background: '#ffffff',
    foreground: '#24292e',
    selection: '#c8e1ff',
    lineNumber: '#959da5',
    keyword: '#d73a49',      // Red
    function: '#6f42c1',     // Purple
    string: '#032f62',       // Blue
    number: '#005cc5',       // Blue
    comment: '#6a737d',      // Gray
    operator: '#d73a49',     // Red
    variable: '#24292e',     // Black
    type: '#005cc5',         // Blue
  }
}
```

#### 2. Solarized Light

```typescript
{
  name: 'solarized-light',
  type: 'light',
  colors: {
    background: '#fdf6e3',
    foreground: '#657b83',
    selection: '#eee8d5',
    lineNumber: '#93a1a1',
    keyword: '#859900',      // Green
    function: '#268bd2',     // Blue
    string: '#2aa198',       // Cyan
    number: '#d33682',       // Magenta
    comment: '#93a1a1',      // Gray
    operator: '#859900',     // Green
    variable: '#b58900',     // Yellow
    type: '#cb4b16',         // Orange
  }
}
```

#### 3. Atom One Light

```typescript
{
  name: 'atom-one-light',
  type: 'light',
  colors: {
    background: '#fafafa',
    foreground: '#383a42',
    selection: '#e5e5e6',
    lineNumber: '#9d9d9f',
    keyword: '#a626a4',      // Purple
    function: '#4078f2',     // Blue
    string: '#50a14f',       // Green
    number: '#986801',       // Orange
    comment: '#a0a1a7',      // Gray
    operator: '#0184bc',     // Cyan
    variable: '#e45649',     // Red
    type: '#c18401',         // Yellow
  }
}
```

## API Design

### Props

```typescript
export interface EditorProps {
  // ... existing props

  /**
   * Theme for code blocks
   * - 'auto': Follow editor theme (one-dark for dark, github-light for light)
   * - Named theme: 'dracula', 'monokai', 'solarized-dark', etc.
   * @default 'auto'
   */
  codeTheme?: 'auto' | CodeThemeName;

  /**
   * Show line numbers in code blocks
   * @default false
   */
  codeLineNumbers?: boolean;
}

type CodeThemeName =
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
```

### Usage Examples

```vue
<!-- Example 1: Auto theme (follows editor) -->
<UnaEditor v-model="content" theme="dark" code-theme="auto" />
<!-- Code blocks use: one-dark -->

<!-- Example 2: Specific theme -->
<UnaEditor v-model="content" theme="dark" code-theme="dracula" />
<!-- Editor: one-dark, Code blocks: dracula -->

<!-- Example 3: Mixed light/dark -->
<UnaEditor v-model="content" theme="light" code-theme="monokai" />
<!-- Editor: light, Code blocks: monokai (dark) -->

<!-- Example 4: With line numbers -->
<UnaEditor v-model="content" theme="dark" code-theme="tokyo-night" :code-line-numbers="true" />
```

## Implementation

### Theme Registry

```typescript
// src/themes/codeThemes.ts

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

export interface CodeTheme {
  name: string;
  type: 'light' | 'dark';
  colors: CodeThemeColors;
}

// Theme definitions
export const CODE_THEMES: Record<string, CodeTheme> = {
  'one-dark': {
    name: 'One Dark',
    type: 'dark',
    colors: {
      background: '#282c34',
      foreground: '#abb2bf',
      selection: '#3e4451',
      lineNumber: '#636d83',
      keyword: '#c678dd',
      function: '#61afef',
      string: '#98c379',
      number: '#d19a66',
      comment: '#5c6370',
      operator: '#56b6c2',
      variable: '#e06c75',
      type: '#e5c07b',
      constant: '#d19a66',
      property: '#e06c75',
      tag: '#e06c75',
      attribute: '#d19a66',
      regexp: '#98c379',
      escape: '#56b6c2',
    },
  },
  dracula: {
    name: 'Dracula',
    type: 'dark',
    colors: {
      background: '#282a36',
      foreground: '#f8f8f2',
      selection: '#44475a',
      lineNumber: '#6272a4',
      keyword: '#ff79c6',
      function: '#50fa7b',
      string: '#f1fa8c',
      number: '#bd93f9',
      comment: '#6272a4',
      operator: '#ff79c6',
      variable: '#f8f8f2',
      type: '#8be9fd',
      constant: '#bd93f9',
      property: '#f8f8f2',
      tag: '#ff79c6',
      attribute: '#50fa7b',
      regexp: '#f1fa8c',
      escape: '#ff79c6',
    },
  },
  // ... other themes
};

// Helper to get theme by name
export function getCodeTheme(name: string): CodeTheme | undefined {
  return CODE_THEMES[name];
}

// Get default theme for editor theme
export function getDefaultCodeTheme(editorTheme: 'light' | 'dark'): CodeTheme {
  return editorTheme === 'dark' ? CODE_THEMES['one-dark'] : CODE_THEMES['github-light'];
}
```

### Theme Extension Builder

```typescript
// src/extensions/codeThemeExtension.ts

import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import type { CodeTheme } from '../themes/codeThemes';

export function createCodeThemeExtension(theme: CodeTheme): Extension {
  const { colors } = theme;

  return EditorView.theme({
    // Code block line background and foreground
    '.cm-line.cm-code-block-line': {
      backgroundColor: colors.background,
      color: colors.foreground,
    },

    // Selection within code block lines
    '.cm-line.cm-code-block-line .cm-selectionBackground': {
      backgroundColor: colors.selection,
    },

    // Line numbers (if enabled) - rendered via ::before pseudo-element
    '.cm-line.cm-code-block-line[data-code-line-number]::before': {
      color: colors.lineNumber,
    },

    // Syntax highlighting tokens (scoped to code block lines)
    '.cm-line.cm-code-block-line .tok-keyword': {
      color: colors.keyword,
    },
    '.cm-line.cm-code-block-line .tok-function': {
      color: colors.function,
    },
    '.cm-line.cm-code-block-line .tok-string': {
      color: colors.string,
    },
    '.cm-line.cm-code-block-line .tok-number': {
      color: colors.number,
    },
    '.cm-line.cm-code-block-line .tok-comment': {
      color: colors.comment,
      fontStyle: 'italic',
    },
    '.cm-line.cm-code-block-line .tok-operator': {
      color: colors.operator,
    },
    '.cm-line.cm-code-block-line .tok-variableName': {
      color: colors.variable,
    },
    '.cm-line.cm-code-block-line .tok-typeName': {
      color: colors.type,
    },
    '.cm-line.cm-code-block-line .tok-constant': {
      color: colors.constant || colors.number,
    },
    '.cm-line.cm-code-block-line .tok-propertyName': {
      color: colors.property || colors.variable,
    },
    '.cm-line.cm-code-block-line .tok-tagName': {
      color: colors.tag || colors.keyword,
    },
    '.cm-line.cm-code-block-line .tok-attributeName': {
      color: colors.attribute || colors.variable,
    },
    '.cm-line.cm-code-block-line .tok-regexp': {
      color: colors.regexp || colors.string,
    },
    '.cm-line.cm-code-block-line .tok-escape': {
      color: colors.escape || colors.operator,
    },
  });
}
```

### Integration in useEditor

```typescript
// src/composables/useEditor.ts

import { getCodeTheme, getDefaultCodeTheme } from '../themes/codeThemes';
import { createCodeThemeExtension } from '../extensions/codeThemeExtension';

// Helper to resolve code theme
function resolveCodeTheme(codeTheme: 'auto' | string, editorTheme: 'light' | 'dark'): CodeTheme {
  if (codeTheme === 'auto') {
    return getDefaultCodeTheme(editorTheme);
  }

  const theme = getCodeTheme(codeTheme);
  if (!theme) {
    console.warn(`Unknown code theme: ${codeTheme}, falling back to default`);
    return getDefaultCodeTheme(editorTheme);
  }

  return theme;
}

// In useEditor composable
const codeThemeCompartment = new Compartment();

// Initial extension
const codeTheme = resolveCodeTheme(props.codeTheme || 'auto', props.theme);
codeThemeCompartment.of(createCodeThemeExtension(codeTheme));

// Watch for changes
watch(
  () => [props.codeTheme, props.theme] as const,
  ([codeThemeName, editorTheme]) => {
    if (!editorView.value) return;
    const theme = resolveCodeTheme(codeThemeName || 'auto', editorTheme);
    editorView.value.dispatch({
      effects: codeThemeCompartment.reconfigure(createCodeThemeExtension(theme)),
    });
  },
);
```

## Theme Showcase

### Visual Comparison

````
Dracula Theme:
┌─────────────────────────────────────────┐
│ ```typescript                           │
│ import { ref } from 'vue';              │
│ ^^^^^^ ^^^^^ ^^^ ^^^^^ ^^^^^^           │
│ pink   yellow    cyan  yellow           │
│                                         │
│ const count = ref<number>(0);           │
│ ^^^^^ ^^^^^ ^ ^^^ ^^^^^^ ^^^            │
│ pink  white   pink cyan  purple         │
└─────────────────────────────────────────┘

Solarized Dark:
┌─────────────────────────────────────────┐
│ ```typescript                           │
│ import { ref } from 'vue';              │
│ ^^^^^^ ^^^^^ ^^^ ^^^^^ ^^^^^^           │
│ green  cyan     cyan   cyan             │
│                                         │
│ const count = ref<number>(0);           │
│ ^^^^^ ^^^^^ ^ ^^^ ^^^^^^ ^^^            │
│ green yellow  green blue magenta        │
└─────────────────────────────────────────┘

Tokyo Night:
┌─────────────────────────────────────────┐
│ ```typescript                           │
│ import { ref } from 'vue';              │
│ ^^^^^^ ^^^^^ ^^^ ^^^^^ ^^^^^^           │
│ purple cyan     cyan   green            │
│                                         │
│ const count = ref<number>(0);           │
│ ^^^^^ ^^^^^ ^ ^^^ ^^^^^^ ^^^            │
│ purple red    blue cyan  orange         │
└─────────────────────────────────────────┘
````

## Theme Picker Component (Optional)

For better UX, provide a theme picker:

```vue
<!-- ThemePicker.vue -->
<template>
  <div class="theme-picker">
    <label>Code Block Theme:</label>
    <select v-model="selectedTheme">
      <option value="auto">Auto (Follow Editor)</option>
      <optgroup label="Dark Themes">
        <option value="one-dark">One Dark</option>
        <option value="dracula">Dracula</option>
        <option value="monokai">Monokai</option>
        <option value="solarized-dark">Solarized Dark</option>
        <option value="nord">Nord</option>
        <option value="tokyo-night">Tokyo Night</option>
      </optgroup>
      <optgroup label="Light Themes">
        <option value="github-light">GitHub Light</option>
        <option value="solarized-light">Solarized Light</option>
        <option value="atom-one-light">Atom One Light</option>
      </optgroup>
    </select>

    <!-- Theme preview -->
    <div class="theme-preview" :style="previewStyle">
      <code>const hello = "world";</code>
    </div>
  </div>
</template>
```

## Bundle Size Impact

```
Theme System:
- Theme definitions:      ~3 KB (gzipped)
- Theme extension builder: ~2 KB (gzipped)
- Total:                  ~5 KB (gzipped)

All themes are defined in a single file, so no additional
loading is needed when switching themes.
```

## Testing

### Visual Regression Tests

````typescript
describe('Code Theme Visual Tests', () => {
  const themes = [
    'one-dark',
    'dracula',
    'monokai',
    'solarized-dark',
    'nord',
    'tokyo-night',
    'github-light',
    'solarized-light',
    'atom-one-light',
  ];

  themes.forEach((theme) => {
    it(`should render ${theme} correctly`, async () => {
      const content = '```typescript\nconst x = 1;\n```';
      // Take screenshot and compare
    });
  });
});
````

## Documentation

### User Guide

```markdown
## Code Block Themes

Una Editor supports 9 beautiful color schemes for code blocks:

### Dark Themes

- **One Dark** - VSCode's default dark theme
- **Dracula** - Popular purple/pink theme
- **Monokai** - Classic Sublime Text theme
- **Solarized Dark** - Precision colors for readability
- **Nord** - Arctic, north-bluish color palette
- **Tokyo Night** - Clean, dark theme inspired by Tokyo

### Light Themes

- **GitHub Light** - GitHub's clean light theme
- **Solarized Light** - Light variant of Solarized
- **Atom One Light** - Atom's default light theme

### Usage

\`\`\`vue
<UnaEditor
  v-model="content"
  code-theme="dracula"
/>
\`\`\`
```

## Future Enhancements

1. **Custom Theme Support**

   ```typescript
   <UnaEditor
     :code-theme="{
       name: 'my-theme',
       colors: { ... }
     }"
   />
   ```

2. **Theme Import/Export**
   - Export theme as JSON
   - Import VSCode themes
   - Import TextMate themes

3. **Per-Language Themes**
   ```typescript
   <UnaEditor
     :code-theme="{
       typescript: 'dracula',
       python: 'monokai',
       default: 'one-dark'
     }"
   />
   ```
