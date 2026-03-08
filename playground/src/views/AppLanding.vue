<script setup lang="ts">
import AppHeader from '../components/AppHeader.vue';
import AppHero from '../components/AppHero.vue';
import AppFeatures from '../components/AppFeatures.vue';
import AppDemo from '../components/DemoEditor.vue';
import AppFooter from '../components/AppFooter.vue';
</script>

<template>
  <div class="landing-container">
    <AppHeader />
    <main class="landing-main">
      <AppHero />
      <AppFeatures />
      <AppDemo />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.landing-container {
  min-height: 100vh;
  background-color: #0f172a;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
}

.landing-main {
  flex: 1;
}
</style>
