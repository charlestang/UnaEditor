# Una Editor Coding Standard

This document outlines the coding standards and architectural conventions that all contributors must adhere to when working on the Una Editor codebase. These rules go beyond what automated tools (ESLint/Prettier) can enforce.

## 1. Component API Signature

- **Props Separation**: For complex components, Props interface definitions MUST be extracted to `src/types/`. Do not define massive interfaces directly inside the `.vue` file.
- **Emit Declarations**: MUST use type-based declarations for strict type inference.

  ```typescript
  // ✅ Good
  const emit = defineEmits<{
    'update:modelValue': [value: string];
    change: [value: string];
  }>();

  // ❌ Bad
  const emit = defineEmits(['update:modelValue', 'change']);
  ```

## 2. Composition API Structure

Inside `<script setup>`, maintain a strict top-to-bottom reading order:

1. `import` statements
2. Macros (`defineOptions`, `defineProps`, `defineEmits`)
3. Component internal state (`ref`, `reactive`)
4. Composable invocations (e.g., `useEditor`)
5. Local event handlers and pure functions
6. `defineExpose` (MUST always be at the very bottom)

## 3. Composables Design Principles

- **Props Passing**: When passing component props to a composable, pass the entire `props` object. Do NOT destructure props before passing them, as this destroys reactivity.
  ```typescript
  // ✅ Good
  useEditor(containerRef, props, emit);
  ```
- **Cleanup Obligation**: Any composable that initializes external instances (like CodeMirror), timers, or event listeners MUST implement an `onBeforeUnmount` hook to destroy them and prevent memory leaks.
- **DOM Refs**: Variables holding DOM references passed to composables must be typed as `Ref<HTMLElement | undefined>`.

## 4. Naming Conventions

- **Boolean States**: MUST be prefixed with `is`, `has`, `can`, or `should` (e.g., `isInternalUpdate`).
- **Event Handlers**: Internal functions that handle DOM or component events MUST be prefixed with `handle` (e.g., `handleChange`, `handleDrop`).
- **DOM Refs**: Variables bound to the `ref` attribute in templates SHOULD end with `Ref` or `Container` to distinguish them from data state (e.g., `editorContainer`).

## 5. Styling and Fallthrough Attributes

- **Attribute Fallthrough**: For wrapper components, explicitly control where external attributes (`class`, `style`, `id`) are applied to prevent black-box rendering issues using `inheritAttrs: false` and `v-bind="$attrs"`.
