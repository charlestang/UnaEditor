import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'una-editor': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
});
