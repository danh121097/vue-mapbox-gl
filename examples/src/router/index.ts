import type { App } from 'vue'

import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      name: 'Home',
      path: '/',
      component: () => import('../views/Home.vue')
    }
  ],
  strict: true,
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export function setupRouter(app: App<Element>) {
  app.use(router)
}
