<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();

const goSandbox = () => {
  router.push('/sandbox');
};
</script>

<template>
  <section class="hero">
    <div class="hero-content">
      <h1 class="title">
        <span class="highlight">Una</span> Editor
      </h1>
      <p class="subtitle">{{ t('hero.title') }}</p>
      <div class="actions">
        <button class="btn primary" @click="goSandbox">
          {{ t('hero.getStarted') }}
        </button>
        <a href="https://github.com/charlestang/UnaEditor" target="_blank" class="btn secondary">
          {{ t('hero.viewOnGithub') }}
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: 6rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.hero-content {
  max-width: 800px;
}

.title {
  font-size: 5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.1;
  letter-spacing: -0.05em;
}

.highlight {
  background: linear-gradient(to right, #3b82f6, #0ea5e9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.5rem;
  color: #94a3b8;
  margin-bottom: 3rem;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}

.btn {
  padding: 0.875rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn.primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.btn.primary:hover {
  background-color: #2563eb;
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
}

.btn.secondary {
  background-color: transparent;
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn.secondary:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.4);
}
</style>
