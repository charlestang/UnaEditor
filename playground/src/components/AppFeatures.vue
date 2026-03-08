<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const features = [
  { icon: '🚀', key: 'performance' },
  { icon: '🎨', key: 'vue3' },
  { icon: '💪', key: 'typeSafe' },
  { icon: '⚡️', key: 'vite' },
  { icon: '📝', key: 'hybridMarkdown' },
  { icon: '⌨️', key: 'vimMode' },
];
</script>

<template>
  <section class="features">
    <div class="features-container">
      <div v-for="feature in features" :key="feature.key" class="feature-card">
        <div class="feature-icon">{{ feature.icon }}</div>
        <h3 class="feature-title">{{ t(`features.${feature.key}.title`) }}</h3>
        <p class="feature-desc">{{ t(`features.${feature.key}.desc`) }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features {
  padding: 4rem 2rem;
  background-color: rgba(255, 255, 255, 0.02);
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 2rem;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #f8fafc;
}

.feature-desc {
  color: #94a3b8;
  line-height: 1.6;
  font-size: 0.95rem;
}
</style>
