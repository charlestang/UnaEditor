import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import zh from './locales/zh.json';

// Use navigator language or fallback to 'en'
const defaultLocale = navigator.language.startsWith('zh') ? 'zh' : 'en';

const i18n = createI18n({
  legacy: false, // use Composition API
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    zh,
  },
});

export default i18n;
