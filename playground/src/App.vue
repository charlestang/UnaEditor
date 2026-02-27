<script setup lang="ts">
import { version } from 'hexopress-editor';
</script>

<template>
  <div class="playground">
    <h1>HexoPress Editor Playground</h1>
    <p>Editor version: {{ version }}</p>
    <p>This is a development playground for testing the editor component.</p>
  </div>
</template>

<style scoped>
.playground {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

h1 {
  color: #333;
  margin-bottom: 1rem;
}

p {
  color: #666;
  line-height: 1.6;
}
</style>
