import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/campus',
      name: 'campus',
      component: () => import('../views/CampusTable.vue')
    },
    {
      path: '/resume',
      name: 'resume',
      component: () => import('../views/ResumeManage.vue')
    },
    {
      path: '/autofill',
      name: 'autofill',
      component: () => import('../views/AutofillGuide.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/applications',
      name: 'applications',
      component: () => import('../views/Applications.vue')
    }
  ]
})

export default router