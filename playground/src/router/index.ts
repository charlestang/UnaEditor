import { createRouter, createWebHashHistory } from 'vue-router';
import AppLanding from '../views/AppLanding.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Landing',
      component: AppLanding,
    },
    {
      path: '/sandbox',
      name: 'Sandbox',
      // Lazy load sandbox to keep landing page fast
      component: () => import('../views/AppSandbox.vue'),
    },
  ],
});

export default router;
