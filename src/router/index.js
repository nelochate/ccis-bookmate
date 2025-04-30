import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import DashboardView from '@/components/system/DashboardView.vue'
import { isAuthenticated } from '@/utils/supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
  ],
})

router.beforeEach(async (to, from) => {
  const isAuth = await isAuthenticated()
  
  // Redirect to login if route requires auth and user is not authenticated
  if (to.meta.requiresAuth && !isAuth) {
    return { name: 'login' }
  }
  
  // Redirect to dashboard if user is authenticated and tries to access auth pages
 /* if ((to.name === 'login' || to.name === 'register') && isAuth) {
    return { name: 'dashboard' }
  }*/
})

export default router