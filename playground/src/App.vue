<script setup lang="ts">
// App.vue is now just a global layout / router-view container
</script>

<template>
  <router-view />
</template>

<style>
/* Base global styles to ensure full height and no margin */
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
}
</style>
