import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
    {
      path: '/',
      component: () => import('../components/common/AppLayout.vue'),
      children: [
        { path: '', redirect: '/board' },
        { path: 'board', component: () => import('../views/DashboardView.vue') },
        { path: 'standup', component: () => import('../views/StandupView.vue') },
        { path: 'milestones', component: () => import('../views/MilestonesView.vue') },
        { path: 'milestones/:id', component: () => import('../views/MilestoneDetailView.vue') },
        { path: 'history', component: () => import('../views/HistoryView.vue') },
        { path: 'learning', component: () => import('../views/LearningView.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const isAuth = !!localStorage.getItem('ds_token')
  if (!to.meta.public && !isAuth) return '/login'
  if (to.meta.public && isAuth) return '/board'
})

export default router
