<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="brand">
          <span class="logo-icon">💠</span>
          <span class="brand-name">Una Editor</span>
        </div>
        <p class="copyright">
          Released under the MIT License.<br />
          Copyright © 2026-present Charles Tang.
        </p>
      </div>
      <div class="links">
        <div class="link-group">
          <h4 class="group-title">{{ t('footer.resources') }}</h4>
          <a href="https://github.com/charlestang/UnaEditor/blob/main/docs/api.md" target="_blank">{{ t('footer.apiDocs') }}</a>
          <a href="https://github.com/charlestang/UnaEditor/issues" target="_blank">Issues</a>
        </div>
        <div class="link-group">
          <h4 class="group-title">{{ t('footer.community') }}</h4>
          <a href="https://github.com/charlestang/UnaEditor" target="_blank">GitHub</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: #0f172a;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 4rem 2rem;
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 3rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 1rem;
}

.copyright {
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.6;
}

.links {
  display: flex;
  gap: 4rem;
}

.link-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.group-title {
  color: #f8fafc;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.link-group a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.link-group a:hover {
  color: #3b82f6;
}

@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
  }
  
  .links {
    gap: 2rem;
    flex-wrap: wrap;
  }
}
</style>
