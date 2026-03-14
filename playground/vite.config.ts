import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import packageJson from '../package.json';

export default defineConfig({
  base: '/UnaEditor/',
  plugins: [vue()],
  define: {
    __UNA_EDITOR_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      'una-editor': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
});
