import { createRouter, createWebHistory } from 'vue-router'

import Index from '../views/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'index',
      component: Index
    },
    {
      path: '/marker',
      name: 'marker',
      component: () => import('../views/amap/marker.vue')
    }
  ]
})

export default router
