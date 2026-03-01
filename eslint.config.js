import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';

const typedFiles = ['**/*.{ts,tsx,vue}'];
const vueFiles = ['**/*.vue'];
const appRuntimeFiles = [
  'src/**/*.{ts,tsx,vue}',
  'playground/src/**/*.{ts,tsx,vue}',
];
const testFiles = [
  'test/**/*.{ts,tsx,vue}',
];
const browserGlobals = {
  console: 'readonly',
  alert: 'readonly',
  document: 'readonly',
  window: 'readonly',
  File: 'readonly',
};
const vitestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  vi: 'readonly',
};

export default [
  {
    name: 'app/files-to-ignore',
    ignores: ['dist/', 'node_modules/', 'playground/dist/', '**/*.vue.js'],
  },
  {
    name: 'app/eslint-config-js',
    ...js.configs.recommended,
    files: ['eslint.config.js'],
  },
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    name: 'app/vue-typescript-parser',
    files: vueFiles,
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    name: 'app/browser-runtime-globals',
    files: appRuntimeFiles,
    languageOptions: {
      globals: {
        // Browser globals for runtime code
        ...browserGlobals,
      },
    },
  },
  {
    name: 'app/test-runtime-globals',
    files: testFiles,
    languageOptions: {
      globals: {
        // Test files run in jsdom and may use Vitest globals
        ...browserGlobals,
        ...vitestGlobals,
      },
    },
  },
  {
    name: 'app/typescript-project-rules',
    files: typedFiles,
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    name: 'app/vue-style-rules',
    files: vueFiles,
    rules: {
      // Relax Vue formatting rules for playground
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
    },
  },
];
